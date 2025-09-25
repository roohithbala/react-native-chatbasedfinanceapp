import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  groupName: string;
  onGroupNameChange: (name: string) => void;
  onCreate: () => void;
  groups: any[];
  selectedGroup: any;
  onSelectGroup: (group: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  groupName,
  onGroupNameChange,
  onCreate,
  groups,
  selectedGroup,
  onSelectGroup,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Group</Text>
          <TouchableOpacity onPress={onCreate}>
            <Text style={styles.modalSave}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.textInput}
              value={groupName}
              onChangeText={onGroupNameChange}
              placeholder="Enter group name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.groupsList}>
            <Text style={styles.groupsListTitle}>Your Groups</Text>
            {(groups || []).map((group) => (
              <TouchableOpacity
                key={group._id}
                style={[
                  styles.groupItem,
                  selectedGroup?._id === group._id && styles.selectedGroupItem
                ]}
                onPress={() => {
                  onSelectGroup(group);
                  onClose();
                }}
              >
                <View style={styles.groupIcon}>
                  <Text style={styles.groupEmoji}>{group.avatar}</Text>
                </View>
                <View style={styles.groupContent}>
                  <Text style={styles.groupTitle}>{group.name}</Text>
                  <Text style={styles.groupSubtitle}>
                    {group.members.length} members • {group.inviteCode}
                  </Text>
                </View>
                {selectedGroup?._id === group._id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748B',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  groupsList: {
    marginTop: 20,
  },
  groupsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGroupItem: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupEmoji: {
    fontSize: 20,
  },
  groupContent: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
  },
});

export default CreateGroupModal;