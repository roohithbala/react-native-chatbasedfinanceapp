# Messages Disappearing - Diagnostic Testing Guide

## Issue
Messages and split bills vanish after refreshing/leaving group chat.

## Quick Diagnostic Steps

### Step 1: Send a Test Message

1. Open your app
2. Go to any group chat
3. Send a simple message: "Test 123"
4. **Immediately** run this command in backend terminal:

```bash
cd backend
node test-message-persistence.js
```

**Expected Output:**
```
1. [text] 2s ago
   Text: "Test 123"
   Group: 68df88d77f3d68fa2052d8ae
   User: Your Name (670abc...)
```

**If your message appears** ✅ → Messages ARE being saved
**If your message doesn't appear** ❌ → Message save failing

---

### Step 2: Check Backend Logs When Loading Messages

1. Leave the group and re-enter
2. Check the backend terminal for logs

**Expected Backend Logs:**
```
📥 getGroupMessages called: { groupId: '68df...', userId: '670...' }
✅ Group validated: { groupId: '68df...', name: 'Family' }
📊 Messages found: { count: 15 }
```

**If count > 0** ✅ → Backend is finding messages
**If count = 0** ❌ → Query problem or wrong groupId

---

### Step 3: Check Frontend Logs

Look at your React Native Metro logs (Expo terminal):

**Expected Frontend Logs:**
```
🔄 useGroupChat: Fetching messages for group: 68df...
📥 useGroupChat: API response received: { messageCount: 15 }
✅ useGroupChat: Loaded messages from API: { count: 15 }
💾 useGroupChat: Setting messages in state: { totalMessages: 16 }
```

**Analysis:**
- If API shows 15 but state shows 0 → **Frontend state problem**
- If API shows 0 but backend logs show 15 → **API formatting issue**
- If both show 0 → **Query issue**

---

### Step 4: Test Specific Group

Get your group ID from the app URL or logs, then:

```bash
node test-message-persistence.js YOUR_GROUP_ID
```

**Example:**
```bash
node test-message-persistence.js 68df88d77f3d68fa2052d8ae
```

This will show all messages for that specific group.

---

## Common Scenarios & Fixes

### Scenario A: Messages Save But Don't Load

**Symptoms:**
- Backend logs: "Messages found: { count: 15 }"
- Frontend: Only welcome message visible

**Likely Cause:** Frontend state not updating

**Fix:** Check if `setMessages()` is being called after `loadMessages()`
- Look for console log: "💾 useGroupChat: Setting messages in state"
- If log exists but messages don't show → UI rendering issue
- If log doesn't exist → `setMessages()` not being called

---

### Scenario B: Messages Not Being Saved

**Symptoms:**
- Backend logs: "✅ Message saved to DB"
- But `test-message-persistence.js` shows no recent messages

**Likely Cause:** Database connection or save failing silently

**Fix:** 
1. Check MongoDB is running
2. Check database connection string
3. Look for save errors in backend logs

---

### Scenario C: Wrong GroupId

**Symptoms:**
- Backend logs: "📊 Messages found: { count: 0 }"
- But `check-messages.js` shows messages exist

**Likely Cause:** GroupId mismatch

**Debug:**
```bash
# See all messages
node check-messages.js

# Check what groupIds exist
# Compare with the groupId in your API request
```

**Fix:** Ensure frontend is sending correct groupId to API

---

### Scenario D: Split Bills with Null GroupId

**Symptoms:**
- Split bill created successfully
- Shows in chat initially  
- Vanishes after refresh

**Likely Cause:** Split bill has `groupId: null`

**Check:**
```bash
node check-messages.js | grep "Split Bills by Group" -A 20
```

Look for: `Group ID: null` with split bills

**Fix:** Run the migration script (see below)

---

## Migration Scripts

### Fix Split Bills with Null GroupId

Create `backend/fix-split-bills.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();
const SplitBill = require('./models/SplitBill');
const Message = require('./models/Message');

async function fixSplitBills() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbasedfinance');
  
  const nullGroupBills = await SplitBill.find({ groupId: null });
  console.log(`Found ${nullGroupBills.length} split bills with null groupId`);
  
  let fixed = 0;
  for (const bill of nullGroupBills) {
    // Find associated message
    const msg = await Message.findOne({
      $or: [
        { 'splitBillData.splitBillId': bill._id },
        { 'splitBillData._id': bill._id.toString() }
      ]
    });
    
    if (msg && msg.groupId) {
      bill.groupId = msg.groupId;
      await bill.save();
      console.log(`✅ Fixed: ${bill._id} → ${msg.groupId}`);
      fixed++;
    } else {
      console.log(`⚠️  No group found for: ${bill._id}`);
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} out of ${nullGroupBills.length} split bills`);
  await mongoose.connection.close();
}

fixSplitBills();
```

Run it:
```bash
node fix-split-bills.js
```

---

## Real-Time Testing

### Test While Sending Messages

1. Open 2 terminals side by side
2. Terminal 1: Backend logs (`cd backend && npm start`)
3. Terminal 2: Database watcher

In Terminal 2, run this loop:
```bash
while ($true) { 
  Clear-Host
  node test-message-persistence.js | Select -First 20
  Start-Sleep -Seconds 2 
}
```

Now send messages in your app and watch Terminal 2 update in real-time!

---

## Debugging Checklist

- [ ] Messages appear in `test-message-persistence.js`
- [ ] Backend logs show "✅ Message saved to DB"
- [ ] Backend logs show "📊 Messages found: { count: X }" with X > 0
- [ ] Frontend logs show "📥 useGroupChat: API response" with messageCount > 0
- [ ] Frontend logs show "💾 useGroupChat: Setting messages in state"
- [ ] Messages visible in app before refresh
- [ ] Messages still visible after refresh

If ALL checkboxes are ✅ but messages still disappear → **UI rendering issue**
If some are ❌ → Focus on the first failing check

---

## Getting Help

When reporting the issue, include:

1. **Backend logs** when loading messages
2. **Frontend logs** from Metro/Expo
3. **Output of:** `node test-message-persistence.js`
4. **Which checklist items** are ✅ and which are ❌

Example report:
```
✅ Messages save (test-message-persistence shows them)
✅ Backend finds them (count: 15)
❌ Frontend API response shows messageCount: 0
→ Issue is in API response formatting
```

---

## Quick Fixes to Try

### Fix 1: Force Messages Reload

Add a reload button to your chat UI:

```typescript
const forceReload = async () => {
  setMessages([]);
  await loadMessages();
};
```

### Fix 2: Clear Message Cache

If messages are cached incorrectly:

```typescript
useEffect(() => {
  // Clear cache on mount
  setMessages([]);
  loadMessages();
  
  return () => {
    // Don't clear on unmount
  };
}, [groupId]);
```

### Fix 3: Verify GroupId Format

Ensure groupId is correct format:

```typescript
console.log('GroupId type:', typeof groupId);
console.log('GroupId value:', groupId);
console.log('Is valid ObjectId:', /^[0-9a-fA-F]{24}$/.test(groupId));
```

---

## Status Indicators

Add these to your debugging:

```typescript
// In your component
console.log('📊 Current State:', {
  groupId,
  messagesCount: messages.length,
  isLoading,
  currentUser: !!currentUser,
  activeGroup: !!activeGroup
});
```

---

## Next Steps

1. Run Step 1-4 diagnostics
2. Check which scenario (A, B, C, or D) matches your issue
3. Apply the corresponding fix
4. Re-run diagnostics to confirm fix worked

**Most likely issue:** Frontend state not persisting or API response not formatted correctly.

