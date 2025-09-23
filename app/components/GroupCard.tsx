import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface GroupCardProps {
  group: any;
  onPress: () => void;
  onLongPress?: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupIcon}>
          <Text style={styles.groupEmoji}>{group.avatar}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMembers}>
            {group.members.length} members
          </Text>
        </View>
      </View>

      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            ${group.totalExpenses?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            ${group.yourShare?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.statLabel}>Your Share</Text>
        </View>
      </View>

      <View style={styles.groupFooter}>
        <Text style={styles.inviteCode}>
          Invite: {group.inviteCode}
        </Text>
        <Text style={styles.lastActivity}>
          {group.lastActivity || 'No recent activity'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    color: '#64748B',
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  lastActivity: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default GroupCard;