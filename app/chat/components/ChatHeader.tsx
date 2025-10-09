import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Props {
  otherUser?: { _id: string; name: string; username: string; avatar?: string } | null;
  theme: any;
  onHamburger: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
}

const ChatHeader: React.FC<Props> = ({ otherUser, theme, onHamburger, onVoiceCall, onVideoCall }) => {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#6366F1", "#8B5CF6", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {otherUser && (
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{otherUser.avatar}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{otherUser.name}</Text>
              <Text style={styles.userStatus}>Active now</Text>
            </View>
          </View>
        )}

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={onVoiceCall}>
            <Ionicons name="call" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onVideoCall}>
            <Ionicons name="videocam" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onHamburger}>
            <Ionicons name="ellipsis-vertical" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: { color: 'white', fontSize: 18, fontWeight: '600' },
  userDetails: { marginLeft: 12 },
  userName: { fontSize: 18, fontWeight: '600', color: 'white' },
  userStatus: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatHeader;
