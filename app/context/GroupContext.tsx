import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFinanceStore } from '@/lib/store/financeStore';

interface GroupMember {
  userId: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member';
}

interface GroupContextType {
  groupMembers: GroupMember[];
  isLoading: boolean;
  error: string | null;
  refreshMembers: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | null>(null);

export function useGroupContext() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroupContext must be used within a GroupProvider');
  }
  return context;
}

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedGroup = useFinanceStore(state => state.selectedGroup);

  const loadGroupMembers = async () => {
    if (!selectedGroup) return;

    try {
      setIsLoading(true);
      setError(null);

      // Convert group members to required format with defensive checks
      const members = selectedGroup.members
        .filter(member => member && member.userId) // Filter out invalid members
        .map(member => ({
          userId: member.userId,
          name: member.user?.name || 'Unknown User',
          avatar: member.user?.avatar || undefined,
          role: member.role || 'member',
        }));

      setGroupMembers(members);
    } catch (err: any) {
      setError(err.message || 'Failed to load group members');
      setGroupMembers([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroupMembers();
  }, [selectedGroup?._id]);

  return (
    <GroupContext.Provider
      value={{
        groupMembers,
        isLoading,
        error,
        refreshMembers: loadGroupMembers,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export default GroupContext;
