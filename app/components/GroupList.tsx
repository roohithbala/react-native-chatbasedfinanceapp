import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { GroupCard } from './GroupCard';

interface GroupListProps {
  groups: any[];
  onGroupPress: (group: any) => void;
  onGroupLongPress?: (group: any) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  onGroupPress,
  onGroupLongPress,
  refreshing,
  onRefresh,
}) => {
  const renderGroup = ({ item }: { item: any }) => (
    <GroupCard
      group={item}
      onPress={() => onGroupPress(item)}
      onLongPress={() => onGroupLongPress?.(item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first group to start tracking shared expenses
      </Text>
    </View>
  );

  return (
    <FlatList
      data={groups}
      renderItem={renderGroup}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2563EB']}
          tintColor="#2563EB"
        />
      }
      ListEmptyComponent={renderEmpty}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default GroupList;