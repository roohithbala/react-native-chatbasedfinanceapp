import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatHeaderProps {
  activeTab: 'chats' | 'groups';
  onCreateGroup: () => void;
  onJoinGroup?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeTab,
  onCreateGroup,
  onJoinGroup,
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
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0) + 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ChatHeader;