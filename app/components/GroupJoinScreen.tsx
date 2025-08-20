import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFinanceStore } from '@/lib/store/financeStore';

interface GroupJoinScreenProps {
  onClose?: () => void;
}

const GroupJoinScreen: React.FC<GroupJoinScreenProps> = ({ onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const joinGroupByCode = useFinanceStore(state => state.joinGroupByCode);

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
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <Text style={styles.subtitle}>Enter the invite code to join a group</Text>
      
      <TextInput
        style={styles.input}
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="Enter invite code"
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleJoinGroup}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Joining...' : 'Join Group'}
        </Text>
      </TouchableOpacity>

      {onClose && (
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
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
    color: '#666',
    fontSize: 16,
  },
});

export default GroupJoinScreen;