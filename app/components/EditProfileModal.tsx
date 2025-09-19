import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFinanceStore } from '@/lib/store/financeStore';
import { authAPI } from '@/app/services/api';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const EditProfileModal = ({ visible, onClose }: EditProfileModalProps) => {
  const { currentUser, updateProfile } = useFinanceStore();
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(currentUser?.avatar || '👤');
  const [currency, setCurrency] = useState(currentUser?.preferences?.currency || 'INR');

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !username.trim()) {
      Alert.alert('Error', 'Name, email and username are required');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Error', 'Username must be at least 3 characters and can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        avatar,
        preferences: {
          ...currentUser?.preferences,
          currency,
        },
      };
      await authAPI.updateProfile(profileData);
      const response = await authAPI.getCurrentUser(); // Get updated user data
      await updateProfile(response.user); // Update store with new user data
      Alert.alert('Success', 'Profile updated successfully');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Text style={[styles.headerButton, loading && styles.disabledText]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.headerButton, styles.saveButton, loading && styles.disabledText]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#94A3B8"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <Text style={styles.helpText}>
              Username must be at least 3 characters and can only contain letters, numbers, and underscores
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Your email"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avatar</Text>
            <View style={styles.avatarInput}>
              <Text style={styles.avatarEmoji}>{avatar}</Text>
              <Text style={styles.avatarHelp}>
                Use an emoji as your avatar
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.emojiInput]}
              value={avatar}
              onChangeText={setAvatar}
              maxLength={2}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Currency</Text>
            <TextInput
              style={styles.input}
              value={currency}
              onChangeText={setCurrency}
              placeholder="INR"
              placeholderTextColor="#94A3B8"
              maxLength={3}
              autoCapitalize="characters"
              editable={!loading}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerButton: {
    fontSize: 16,
    color: '#64748B'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B'
  },
  saveButton: {
    color: '#2563EB',
    fontWeight: '600'
  },
  disabledText: {
    opacity: 0.5
  },
  content: {
    padding: 20
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B'
  },
  helpText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4
  },
  avatarInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  avatarEmoji: {
    fontSize: 32,
    marginRight: 12
  },
  avatarHelp: {
    fontSize: 14,
    color: '#64748B'
  },
  emojiInput: {
    fontSize: 24,
    textAlign: 'center'
  }
});

export default EditProfileModal;
