import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatTabsProps {
  activeTab: 'groups' | 'direct';
  onTabChange: (tab: 'groups' | 'direct') => void;
}

export const ChatTabs: React.FC<ChatTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
        onPress={() => onTabChange('groups')}
      >
        <Ionicons
          name="people"
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

      <TouchableOpacity
        style={[styles.tab, activeTab === 'direct' && styles.activeTab]}
        onPress={() => onTabChange('direct')}
      >
        <Ionicons
          name="person"
          size={20}
          color={activeTab === 'direct' ? '#2563EB' : '#64748B'}
        />
        <Text style={[
          styles.tabText,
          activeTab === 'direct' && styles.activeTabText
        ]}>
          Direct
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