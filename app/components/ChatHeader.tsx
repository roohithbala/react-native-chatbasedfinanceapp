import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatHeaderProps {
  activeTab: 'chats' | 'groups';
  onCreateGroup: () => void;
  onJoinGroup?: () => void;
  onNewChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeTab,
  onCreateGroup,
  onJoinGroup,
  onNewChat,
}) => {
  return (
    <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Chats</Text>
          <Text style={styles.headerSubtitle}>
            Stay connected with your groups and friends
          </Text>
        </View>
        {activeTab === 'groups' && (
          <View style={styles.headerActions}>
            {onJoinGroup && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onJoinGroup}
              >
                <Ionicons name="enter" size={24} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onCreateGroup}
            >
              <Ionicons name="people" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        {activeTab === 'chats' && onNewChat && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onNewChat}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0) + 10,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    maxWidth: '95%',
  },
});

export default ChatHeader;