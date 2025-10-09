# Split Bill and Messages Disappearing After Refresh - Fix

## Issue
When users create split bills or send messages in group chat:
1. ✅ Split bill is created successfully
2. ✅ Messages appear in the chat
3. ❌ After refreshing/leaving and re-entering the group:
   - Split bills vanish
   - All messages sent before refreshing disappear
   - Only the welcome message remains

## Root Cause Investigation

### Potential Causes

1. **Messages Not Being Saved to Database**
   - Messages created but `.save()` fails silently
   - Database connection issues
   - Validation errors on save

2. **Messages Being Saved to Wrong Collection**
   - Collection name mismatch
   - Database name mismatch
   - MongoDB connection string issue

3. **Query Not Finding Messages**
   - `groupId` format mismatch (String vs ObjectId)
   - Query filter issue
   - Index problem

4. **Messages Being Deleted**
   - Cleanup script running
   - TTL index removing messages
   - Frontend clearing state incorrectly

## Added Debug Logging

### Backend Changes

**File**: `backend/controllers/messageQueriesController.js`
```javascript
const getGroupMessages = async (groupId, userId) => {
  console.log('📥 getGroupMessages called:', { groupId, userId });
  
  const group = await chatUtils.validateGroupMembership(groupId, userId);
  console.log('✅ Group validated:', { groupId: group._id, name: group.name });

  const messages = await Message.find({ groupId })
    .sort({ createdAt: 1 })
    .limit(50)
    .populate({
      path: 'user',
      select: 'name avatar username _id'
    })
    .lean();

  console.log('📊 Messages found:', {
    count: messages.length,
    groupId,
    firstMessage: messages[0] ? {
      _id: messages[0]._id,
      text: messages[0].text?.substring(0, 50),
      type: messages[0].type
    } : null
  });

  // ... rest of code
};
```

**File**: `backend/controllers/messageManagementController.js`
```javascript
await message.save();
console.log('✅ Message saved to DB:', {
  _id: message._id,
  groupId: message.groupId,
  text: message.text?.substring(0, 50),
  type: message.type,
  hasSplitBillData: !!message.splitBillData
});
```

## Testing Steps

### Step 1: Check Backend Logs

1. Restart backend server
2. Send a message in group chat
3. Check backend terminal for logs:
   ```
   ✅ Message saved to DB: { _id: '...', groupId: '...', text: '...' }
   ```

### Step 2: Refresh and Check Query

1. Leave group and re-enter
2. Check backend logs for:
   ```
   📥 getGroupMessages called: { groupId: '...', userId: '...' }
   ✅ Group validated: { groupId: '...', name: '...' }
   📊 Messages found: { count: X, groupId: '...', firstMessage: { ... } }
   ```

3. **If count is 0**: Messages not being saved OR query not finding them
4. **If count > 0**: Frontend issue or format problem

### Step 3: Direct Database Check

Create a script to check messages directly in MongoDB:

**File**: `backend/check-messages.js`
```javascript
const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');

async function checkMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance');
    console.log('✅ Connected to MongoDB');

    // Get all messages
    const allMessages = await Message.find({});
    console.log(`\n📊 Total messages in database: ${allMessages.length}\n`);

    // Group by groupId
    const byGroup = {};
    allMessages.forEach(msg => {
      const gid = msg.groupId?.toString() || 'null';
      if (!byGroup[gid]) byGroup[gid] = [];
      byGroup[gid].push(msg);
    });

    console.log('Messages by Group:');
    Object.entries(byGroup).forEach(([groupId, msgs]) => {
      console.log(`\nGroup ${groupId}:`);
      console.log(`  Messages: ${msgs.length}`);
      msgs.slice(0, 3).forEach(msg => {
        console.log(`  - ${msg._id}: "${msg.text?.substring(0, 50)}" (${msg.type})`);
      });
      if (msgs.length > 3) {
        console.log(`  ... and ${msgs.length - 3} more`);
      }
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMessages();
```

Run it:
```bash
cd backend
node check-messages.js
```

## Potential Fixes

### Fix 1: Ensure Messages are Saved with Correct groupId

Check that `groupId` is an ObjectId when saving:

**File**: `backend/controllers/messageManagementController.js`
```javascript
const message = new Message({
  text: text.trim(),
  user: { /* ... */ },
  groupId: mongoose.Types.ObjectId(groupId), // ✅ Ensure ObjectId
  type: /* ... */,
  status: 'sent',
  readBy: [/* ... */]
});
```

### Fix 2: Check Message Schema Indexes

**File**: `backend/models/Message.js`
```javascript
// Compound index for efficient group message queries
messageSchema.index({ groupId: 1, createdAt: -1 });
```

Rebuild indexes if needed:
```javascript
// In server.js or a migration script
await Message.collection.dropIndexes();
await Message.syncIndexes();
```

### Fix 3: Verify Query Uses Correct Type

**File**: `backend/controllers/messageQueriesController.js`
```javascript
const mongoose = require('mongoose');

const getGroupMessages = async (groupId, userId) => {
  // Ensure groupId is ObjectId
  const groupIdObj = mongoose.Types.ObjectId(groupId);
  
  const messages = await Message.find({ groupId: groupIdObj })
    .sort({ createdAt: 1 })
    .limit(50)
    .populate(/* ... */)
    .lean();
    
  // ... rest
};
```

### Fix 4: Check for TTL Index

```javascript
// Check if Message model has TTL index
const indexes = await Message.collection.getIndexes();
console.log('Message indexes:', indexes);

// If there's a TTL index, remove it:
await Message.collection.dropIndex('createdAt_1');
```

### Fix 5: Frontend State Management

Check if frontend is clearing messages on unmount:

**File**: `hooks/useGroupChat.ts`
```typescript
useEffect(() => {
  return () => {
    // ❌ DON'T clear messages on unmount
    // setMessages([]); // Remove this if it exists
  };
}, []);
```

## Expected Behavior

### After Save
```
Backend Log:
✅ Message saved to DB: {
  _id: '67068abc123...',
  groupId: '670680def456...',
  text: 'Hello world',
  type: 'text',
  hasSplitBillData: false
}
```

### After Refresh/Reload
```
Backend Log:
📥 getGroupMessages called: { groupId: '670680def456...', userId: '...' }
✅ Group validated: { groupId: '670680def456...', name: 'Family' }
📊 Messages found: {
  count: 5,
  groupId: '670680def456...',
  firstMessage: { _id: '...', text: 'Welcome to Family! 🎉', type: 'system' }
}

Frontend:
✅ Displays 5 messages including the new ones
```

## Quick Fix Script

Create `backend/fix-messages.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');

async function fixMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance');
    
    // 1. Check all messages
    const messages = await Message.find({});
    console.log(`Found ${messages.length} messages`);
    
    // 2. Fix any messages with string groupId
    let fixed = 0;
    for (const msg of messages) {
      if (typeof msg.groupId === 'string') {
        msg.groupId = mongoose.Types.ObjectId(msg.groupId);
        await msg.save();
        fixed++;
      }
    }
    console.log(`Fixed ${fixed} messages`);
    
    // 3. Rebuild indexes
    await Message.collection.dropIndexes();
    await Message.syncIndexes();
    console.log('✅ Indexes rebuilt');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixMessages();
```

## Next Steps

1. ✅ Added debug logging (DONE)
2. ⏳ Run backend and test message creation
3. ⏳ Check backend logs for save confirmation
4. ⏳ Refresh and check query logs
5. ⏳ Run `check-messages.js` to verify database
6. ⏳ Apply appropriate fix based on findings

## Status

🔍 **INVESTIGATING** - Debug logging added, waiting for test results

---

**Date**: October 9, 2025
**Files Modified**:
- `backend/controllers/messageQueriesController.js` - Added debug logs
- `backend/controllers/messageManagementController.js` - Added save confirmation log
