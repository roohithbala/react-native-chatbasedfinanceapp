import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';

interface GroupJoinScreenProps {
  onClose?: () => void;
}

const GroupJoinScreen: React.FC<GroupJoinScreenProps> = ({ onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const joinGroupByCode = useFinanceStore(state => state.joinGroupByCode);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setIsLoading(true);
    try {
      await joinGroupByCode(inviteCode.trim());
      onClose?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Join a Group</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter the invite code to join a group</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="Enter invite code"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]} 
        onPress={handleJoinGroup}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Joining...' : 'Join Group'}
        </Text>
      </TouchableOpacity>

      {onClose && (
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 15,
    padding: 15,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
});

export default GroupJoinScreen;