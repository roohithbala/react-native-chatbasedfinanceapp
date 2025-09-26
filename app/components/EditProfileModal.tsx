import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useFinanceStore } from '@/lib/store/financeStore';
import { authAPI } from '@/lib/services/api';
import { useTheme } from '../context/ThemeContext';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { currentUser, updateProfile } = useFinanceStore();
  const { theme } = useTheme();
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [upiId, setUpiId] = useState(currentUser?.upiId || '');
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(currentUser?.avatar || '👤');
  const [currency, setCurrency] = useState(currentUser?.preferences?.currency || 'INR');
  const [notifications, setNotifications] = useState(currentUser?.preferences?.notifications ?? true);
  const [biometric, setBiometric] = useState(currentUser?.preferences?.biometric ?? false);
  const [darkMode, setDarkMode] = useState(currentUser?.preferences?.darkMode ?? false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !username.trim() || !upiId.trim()) {
      Alert.alert('Error', 'Name, email, username and UPI ID are required');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Error', 'Username must be at least 3 characters and can only contain letters, numbers, and underscores');
      return;
    }

    // Validate UPI ID format
    const upiRegex = /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/;
    if (!upiId.trim()) {
      Alert.alert('Error', 'UPI ID is required');
      return;
    } else if (!upiRegex.test(upiId)) {
      Alert.alert('Error', 'Please enter a valid UPI ID (e.g., user@paytm)');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        upiId: upiId.trim(),
        avatar: avatar.trim(),
        preferences: {
          ...currentUser?.preferences,
          notifications,
          biometric,
          darkMode,
          currency: currency.trim(),
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Text style={[styles.headerButton, { color: theme.textSecondary }, loading && styles.disabledText]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.headerButton, styles.saveButton, { color: theme.primary }, loading && styles.disabledText]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading && (
            <View style={[styles.loadingOverlay, { backgroundColor: theme.modalOverlay }]}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.inputBackground, 
                  borderColor: theme.inputBorder, 
                  color: theme.text 
                }]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={theme.inputPlaceholder}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Username</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.inputBackground, 
                  borderColor: theme.inputBorder, 
                  color: theme.text 
                }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Your username"
                placeholderTextColor={theme.inputPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Username must be at least 3 characters and can only contain letters, numbers, and underscores
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.inputBackground, 
                  borderColor: theme.inputBorder, 
                  color: theme.text 
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Your email"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>UPI ID</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.inputBackground, 
                  borderColor: theme.inputBorder, 
                  color: theme.text 
                }]}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="user@paytm"
                placeholderTextColor={theme.inputPlaceholder}
                autoCapitalize="none"
                editable={!loading}
              />
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Your UPI ID for payments (e.g., user@paytm, user@ybl)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Avatar</Text>
              <View style={styles.avatarInput}>
                <Text style={styles.avatarEmoji}>{avatar}</Text>
                <Text style={[styles.avatarHelp, { color: theme.textSecondary }]}>
                  Use an emoji as your avatar
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.emojiInput, { 
                  backgroundColor: theme.inputBackground, 
                  borderColor: theme.inputBorder, 
                  color: theme.text 
                }]}
                value={avatar}
                onChangeText={setAvatar}
                maxLength={2}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Preferred Currency</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.inputBackground, 
                  borderColor: theme.inputBorder, 
                  color: theme.text 
                }]}
                value={currency}
                onChangeText={setCurrency}
                placeholder="INR"
                placeholderTextColor={theme.inputPlaceholder}
                maxLength={3}
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Preferences</Text>
              
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: theme.textSecondary }]}>Push Notifications</Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: theme.inputBorder, true: theme.primary }}
                  thumbColor={notifications ? theme.surface : theme.textSecondary}
                  disabled={loading}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: theme.textSecondary }]}>Biometric Authentication</Text>
                <Switch
                  value={biometric}
                  onValueChange={setBiometric}
                  trackColor={{ false: theme.inputBorder, true: theme.primary }}
                  thumbColor={biometric ? theme.surface : theme.textSecondary}
                  disabled={loading}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: theme.textSecondary }]}>Dark Mode</Text>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: theme.inputBorder, true: theme.primary }}
                  thumbColor={darkMode ? theme.surface : theme.textSecondary}
                  disabled={loading}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
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
    marginBottom: 8
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  helpText: {
    fontSize: 12,
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
  },
  emojiInput: {
    fontSize: 24,
    textAlign: 'center'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
});

export default EditProfileModal;
