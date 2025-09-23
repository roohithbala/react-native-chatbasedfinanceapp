import { useState, useEffect, useCallback } from 'react';
import { useFinanceStore } from '../lib/store/financeStore';
import { groupsAPI } from '../lib/services/api';

export const useGroupData = () => {
  const { currentUser, groups, loadGroups } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      await loadGroups();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadGroups]);

  const refreshGroups = useCallback(async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  }, [fetchGroups]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const totalExpenses = groups.reduce((sum: number, group: any) => sum + (group.totalExpenses || 0), 0);

  return {
    groups,
    loading,
    error,
    refreshing,
    totalExpenses,
    refreshGroups,
  };
};