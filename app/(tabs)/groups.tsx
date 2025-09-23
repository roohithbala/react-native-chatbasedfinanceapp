import React, { useState } from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { GroupHeader } from '../components/GroupHeader';
import { GroupList } from '../components/GroupList';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { useGroupData } from '@/hooks/useGroupData';
import { useGroupActions } from '@/hooks/useGroupActions';
import { useFinanceStore } from '../../lib/store/financeStore';

export default function GroupsScreen() {
  const { groups, loading, error, refreshing, totalExpenses, refreshGroups } = useGroupData();
  const {
    creatingGroup,
    handleCreateGroup,
    handleAddMember,
    navigateToGroup,
  } = useGroupActions();

  const { currentUser } = useFinanceStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const handleCreateGroupPress = () => {
    setShowCreateModal(true);
  };

  const handleCreateGroupSubmit = async () => {
    if (!groupName.trim()) return;

    try {
      await handleCreateGroup({
        name: groupName.trim(),
        avatar: '👥', // Default avatar
      });
      setGroupName('');
      setShowCreateModal(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleGroupPress = (group: any) => {
    navigateToGroup(group._id);
  };

  const handleGroupLongPress = (group: any) => {
    // Could show options menu here
    console.log('Long press on group:', group.name);
  };

  const handleSelectGroup = (group: any) => {
    setSelectedGroup(group);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GroupHeader
        userName={currentUser?.name || 'User'}
        totalGroups={groups.length}
        totalExpenses={totalExpenses}
        onCreateGroup={handleCreateGroupPress}
      />

      <View style={styles.content}>
        <GroupList
          groups={groups}
          onGroupPress={handleGroupPress}
          onGroupLongPress={handleGroupLongPress}
          refreshing={refreshing}
          onRefresh={refreshGroups}
        />
      </View>

      <FloatingActionButton
        onPress={handleCreateGroupPress}
        icon="add"
      />

      <CreateGroupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        groupName={groupName}
        onGroupNameChange={setGroupName}
        onCreate={handleCreateGroupSubmit}
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={handleSelectGroup}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
});