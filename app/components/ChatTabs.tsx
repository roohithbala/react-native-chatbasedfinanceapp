import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatTabsProps {
  activeTab: 'chats' | 'groups';
  onTabChange: (tab: 'chats' | 'groups') => void;
}

export const ChatTabs: React.FC<ChatTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
        onPress={() => onTabChange('chats')}
      >
        <Ionicons
          name="chatbubbles"
          size={20}
          color={activeTab === 'chats' ? '#2563EB' : '#64748B'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'chats' && styles.activeTabText
        ]}>
          Chats
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
        onPress={() => onTabChange('groups')}
      >
        <Ionicons
          name="people-circle"
          size={20}
          color={activeTab === 'groups' ? '#2563EB' : '#64748B'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'groups' && styles.activeTabText
        ]}>
          Groups
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#2563EB',
  },
});

export default ChatTabs;