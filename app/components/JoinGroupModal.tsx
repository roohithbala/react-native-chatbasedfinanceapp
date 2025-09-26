import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface JoinGroupModalProps {
  visible: boolean;
  onClose: () => void;
  inviteCode: string;
  onInviteCodeChange: (code: string) => void;
  onJoin: () => void;
  loading: boolean;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  visible,
  onClose,
  inviteCode,
  onInviteCodeChange,
  onJoin,
  loading,
}) => {
  const { theme } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Join Group</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.modalInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Enter invite code"
            placeholderTextColor={theme.textSecondary}
            value={inviteCode}
            onChangeText={onInviteCodeChange}
            autoCapitalize="characters"
            maxLength={8}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={onJoin}
              disabled={loading}
            >
              <Text style={[styles.primaryButtonText, { color: theme.surface }]}>
                {loading ? 'Joining...' : 'Join'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JoinGroupModal;