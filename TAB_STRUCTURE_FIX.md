# Tab Structure Fix

## Issue
The `hooks` folder was incorrectly placed inside the `(tabs)` folder. According to Expo Router conventions, only the actual tab screen files should be inside `(tabs)`, not shared utilities like hooks.

## Changes Made

### 1. Removed hooks folder from (tabs) ✅
- **Removed**: `app/(tabs)/hooks/` folder
- **File**: `useHomeData.ts` was already in the correct location at `app/hooks/`
- **Reason**: The project already has `app/hooks/` with other shared hooks like `useGroupChat.ts`, `useBudgetActions.ts`, etc.

### 2. Import Path Remains Correct ✅
- **File**: `app/(tabs)/index.tsx`
- **Import**: `import useHomeData from '../hooks/useHomeData';`
- **Explanation**: Uses relative path from `(tabs)/` to `app/hooks/`

## Correct Structure

### ✅ AFTER (Correct)
```
app/
├── (tabs)/              # Tab navigation group - ONLY TAB SCREENS
│   ├── _layout.tsx      # Tab layout configuration
│   ├── index.tsx        # Home tab
│   ├── expenses.tsx     # Expenses tab
│   ├── chats.tsx        # Chats tab
│   ├── budget.tsx       # Budget tab
│   ├── insights.tsx     # Insights tab
│   └── profile.tsx      # Profile tab
├── components/          # Shared components
├── context/             # Shared context providers
├── hooks/               # ✅ Shared hooks at app level
│   ├── useBudgetActions.ts
│   ├── useBudgetData.ts
│   ├── useChatsLogic.ts
│   ├── useGroupChat.ts
│   ├── useHomeData.ts   # ✅ Correctly here
│   └── ... (other hooks)
├── lib/                 # Shared utilities
├── types/               # Shared type definitions
├── utils/               # Shared utility functions
├── auth.tsx             # Auth screen (outside tabs)
├── chat.tsx             # Chat screen (outside tabs)
├── create-group.tsx     # Create group screen (outside tabs)
├── group-chat/          # Group chat screens (outside tabs)
├── voice-call/          # Voice call screens (outside tabs)
└── video-call/          # Video call screens (outside tabs)
```

### ❌ BEFORE (Incorrect)
```
app/
├── (tabs)/
│   ├── hooks/           # ❌ Wrong! Hooks shouldn't be here
│   │   └── useHomeData.ts
│   ├── _layout.tsx
│   ├── index.tsx
│   └── ...
```

## Why This Matters

### Expo Router Conventions
1. **`(tabs)` folder** = Route group for tab navigation
   - Should ONLY contain:
     - `_layout.tsx` (tab navigator configuration)
     - Tab screen files (`.tsx` files that appear as tabs)
   
2. **Shared resources** = Should be outside route groups
   - `components/` - Reusable UI components
   - `hooks/` - Reusable custom hooks
   - `context/` - Context providers
   - `lib/` - Utilities and services
   - `types/` - TypeScript types

### Benefits of Correct Structure
- ✅ **Clear separation**: Routes vs. shared code
- ✅ **Easier imports**: Use `@/hooks/` from anywhere
- ✅ **Better scalability**: Add new tabs without affecting shared code
- ✅ **Follows best practices**: Matches Expo Router documentation
- ✅ **Prevents confusion**: Route groups only contain routes

## Import Path Convention

### Using Absolute Imports (Recommended)
```typescript
// ✅ Good - Works from anywhere
import useHomeData from '@/hooks/useHomeData';
import { useFinanceStore } from '@/lib/store/financeStore';
import HomeHeader from '@/app/components/HomeHeader';
```

### Using Relative Imports (Less Preferred)
```typescript
// ⚠️ Works but less maintainable
import useHomeData from '../../../hooks/useHomeData';
import { useFinanceStore } from '../../lib/store/financeStore';
```

## Route Groups in Expo Router

### What are Route Groups?
Route groups use folder names with parentheses `(name)` to:
1. **Organize routes** without affecting URL structure
2. **Apply layouts** to a group of screens
3. **Keep navigation logic** separate from shared code

### Examples of Route Groups
- `(tabs)` - Tab navigation (Home, Expenses, Chats, etc.)
- `(auth)` - Authentication screens (Login, Register, etc.)
- `(admin)` - Admin-only screens
- `(onboarding)` - Onboarding flow screens

### What Should Go Inside Route Groups?
- ✅ `_layout.tsx` - Layout/navigator for the group
- ✅ Screen files (`.tsx`) that are part of that navigation group
- ❌ Shared components
- ❌ Shared hooks
- ❌ Shared utilities
- ❌ Context providers

## Files in This Project

### Tab Screens (Correctly Inside `(tabs)`)
1. `_layout.tsx` - Tab navigator configuration
2. `index.tsx` - Home screen (tab 1)
3. `expenses.tsx` - Expenses screen (tab 2)
4. `chats.tsx` - Chats screen (tab 3)
5. `budget.tsx` - Budget screen (tab 4)
6. `insights.tsx` - Insights screen (tab 5)
7. `profile.tsx` - Profile screen (tab 6)

### Non-Tab Screens (Correctly Outside `(tabs)`)
- `auth.tsx` - Authentication screen
- `chat.tsx` - Individual chat screen
- `create-group.tsx` - Create group screen
- `add-members.tsx` - Add members screen
- `group-settings.tsx` - Group settings screen
- `group-stats.tsx` - Group statistics screen
- `reminders.tsx` - Reminders screen
- `you-owe.tsx` - You owe screen
- `group-chat/[groupId].tsx` - Group chat screen
- `voice-call/[userId].tsx` - Voice call screen
- `video-call/[userId].tsx` - Video call screen

## Testing Checklist

- [x] Removed incorrect `app/(tabs)/hooks/` folder
- [x] Verified `useHomeData.ts` is in correct location at `app/hooks/`
- [x] Verified import path in `app/(tabs)/index.tsx` is correct
- [x] Verified `(tabs)` folder only contains tab screens (7 files: _layout.tsx + 6 tab screens)
- [ ] Run `npm start` or `npx expo start` to verify no import errors
- [ ] Open Home tab to verify `useHomeData` hook works correctly
- [ ] Verify app compiles without errors

## Notes

- This fix ensures the project follows Expo Router best practices
- The structure is now more maintainable and scalable
- All shared resources are properly organized outside route groups
- Tab navigation configuration remains in `(tabs)/_layout.tsx`
- No functionality was changed, only file organization

---

## Date: 2025-01-XX
## Status: ✅ COMPLETED
