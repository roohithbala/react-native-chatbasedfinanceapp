import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupsAPI } from '@/lib/services/api';

interface GroupSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupDetails: any;
  onGroupUpdated: () => void;
}

export default function GroupSettingsModal({
  visible,
  onClose,
  groupId,
  groupName,
  groupDetails,
  onGroupUpdated
}: GroupSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowInvites, setAllowInvites] = useState(true);
  const [splitMethod, setSplitMethod] = useState('equal');

  // Notification settings
  const [notifications, setNotifications] = useState({
    newMember: true,
    newExpense: true,
    paymentReminder: true,
    settlementDue: true,
  });

  useEffect(() => {
    if (visible && groupDetails) {
      loadSettings();
    }
  }, [visible, groupDetails]);

  const loadSettings = () => {
    if (!groupDetails) return;

    setGroupNameInput(groupDetails.name || '');
    setGroupDescription(groupDetails.description || '');
    setCurrency(groupDetails.settings?.currency || 'INR');
    setIsPrivate(groupDetails.settings?.isPrivate || false);
    setAllowInvites(groupDetails.settings?.allowInvites ?? true);
    setSplitMethod(groupDetails.settings?.splitMethod || 'equal');

    // Load notification settings
    if (groupDetails.settings?.notifications) {
      setNotifications(groupDetails.settings.notifications);
    }
  };

  const handleSaveSettings = async () => {
    if (!groupId) return;

    setIsSaving(true);
    try {
      // Validate data before sending
      const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];
      const validSplitMethods = ['equal', 'percentage', 'custom'];

      if (!validCurrencies.includes(currency)) {
        throw new Error(`Invalid currency: ${currency}`);
      }

      if (!validSplitMethods.includes(splitMethod)) {
        throw new Error(`Invalid split method: ${splitMethod}`);
      }

      // Debug logging
      console.log('GroupSettingsModal - Current user and group details:');
      console.log('Group ID:', groupId);
      console.log('Group Details:', JSON.stringify(groupDetails, null, 2));
      console.log('Group Members:', groupDetails?.members?.map((m: any) => ({
        userId: m.userId,
        name: m.userId?.name || 'Unknown',
        role: m.role
      })));

      // Prepare data for API calls
      const updateData = {
        name: groupNameInput.trim(),
        description: groupDescription.trim(),
      };

      const settingsData = {
        currency,
        isPrivate: Boolean(isPrivate),
        allowInvites: Boolean(allowInvites),
        splitMethod,
      };

      const notificationData = {
        newMember: Boolean(notifications.newMember),
        newExpense: Boolean(notifications.newExpense),
        paymentReminder: Boolean(notifications.paymentReminder),
        settlementDue: Boolean(notifications.settlementDue),
      };

      console.log('Sending group info update:', updateData);
      console.log('Sending settings update:', settingsData);
      console.log('Sending notification update:', notificationData);

      // Make API calls sequentially to handle permission errors gracefully
      let successCount = 0;
      const errors = [];

      try {
        await groupsAPI.updateGroupInfo(groupId, updateData);
        successCount++;
        console.log('Group info updated successfully');
      } catch (error: any) {
        console.warn('Group info update failed:', error.message);
        errors.push('Group info update failed (admin permission required)');
      }

      try {
        await groupsAPI.updateGroupSettings(groupId, settingsData);
        successCount++;
        console.log('Group settings updated successfully');
      } catch (error: any) {
        console.warn('Group settings update failed:', error.message);
        errors.push('Group settings update failed (admin permission required)');
      }

      try {
        await groupsAPI.updateNotificationSettings(groupId, notificationData);
        successCount++;
        console.log('Notification settings updated successfully');
      } catch (error: any) {
        console.warn('Notification settings update failed:', error.message);
        errors.push('Notification settings update failed');
      }

      // Check if at least one update succeeded
      if (successCount === 0) {
        throw new Error('All updates failed. You may not have sufficient permissions to modify group settings.');
      }

      // Show success message with warnings if some updates failed
      if (errors.length > 0) {
        Alert.alert(
          'Partial Success',
          `Settings updated successfully, but some changes failed:\n\n${errors.join('\n')}\n\nYou may need admin permissions for certain settings.`
        );
      } else {
        Alert.alert('Success', 'Group settings updated successfully');
      }

      onGroupUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        isAxiosError: !!error.config,
        errorType: error.constructor.name
      });

      // Show more specific error messages
      let errorMessage = 'Failed to save settings';

      // Check if it's a network error
      if (!error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('Invalid currency')) {
        errorMessage = 'Invalid currency selected';
      } else if (error.message.includes('Invalid split method')) {
        errorMessage = 'Invalid split method selected';
      } else if (error.message.includes('sufficient permissions')) {
        errorMessage = 'You do not have permission to modify group settings. Only group admins can change these settings.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to modify these settings.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
  ];

  const splitMethods = [
    { value: 'equal', label: 'Equal Split' },
    { value: 'percentage', label: 'Percentage Split' },
    { value: 'custom', label: 'Custom Amounts' },
  ];

  const renderCurrencyPicker = () => (
    <View style={styles.settingSection}>
      <Text style={styles.settingLabel}>Currency</Text>
      <View style={styles.currencyOptions}>
        {currencies.map((curr) => (
          <TouchableOpacity
            key={curr.code}
            style={[
              styles.currencyOption,
              currency === curr.code && styles.currencyOptionSelected,
            ]}
            onPress={() => setCurrency(curr.code)}
          >
            <Text
              style={[
                styles.currencyOptionText,
                currency === curr.code && styles.currencyOptionTextSelected,
              ]}
            >
              {curr.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSplitMethodPicker = () => (
    <View style={styles.settingSection}>
      <Text style={styles.settingLabel}>Default Split Method</Text>
      <View style={styles.splitMethodOptions}>
        {splitMethods.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[
              styles.splitMethodOption,
              splitMethod === method.value && styles.splitMethodOptionSelected,
            ]}
            onPress={() => setSplitMethod(method.value)}
          >
            <Text
              style={[
                styles.splitMethodOptionText,
                splitMethod === method.value && styles.splitMethodOptionTextSelected,
              ]}
            >
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>Group Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={groupNameInput}
                  onChangeText={setGroupNameInput}
                  placeholder="Enter group name"
                  maxLength={100}
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  placeholder="Enter group description"
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>
            </View>

            {/* Privacy Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy & Access</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Private Group</Text>
                  <Text style={styles.settingDescription}>
                    Only invited members can join
                  </Text>
                </View>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor={isPrivate ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Allow Invites</Text>
                  <Text style={styles.settingDescription}>
                    Members can generate invite codes
                  </Text>
                </View>
                <Switch
                  value={allowInvites}
                  onValueChange={setAllowInvites}
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor={allowInvites ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>
            </View>

            {/* Financial Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Financial Settings</Text>

              {renderCurrencyPicker()}
              {renderSplitMethodPicker()}
            </View>

            {/* Notification Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>New Members</Text>
                  <Text style={styles.settingDescription}>
                    Notify when someone joins the group
                  </Text>
                </View>
                <Switch
                  value={notifications.newMember}
                  onValueChange={(value) =>
                    setNotifications(prev => ({ ...prev, newMember: value }))
                  }
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor={notifications.newMember ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>New Expenses</Text>
                  <Text style={styles.settingDescription}>
                    Notify when expenses are added
                  </Text>
                </View>
                <Switch
                  value={notifications.newExpense}
                  onValueChange={(value) =>
                    setNotifications(prev => ({ ...prev, newExpense: value }))
                  }
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor={notifications.newExpense ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Payment Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Remind members about pending payments
                  </Text>
                </View>
                <Switch
                  value={notifications.paymentReminder}
                  onValueChange={(value) =>
                    setNotifications(prev => ({ ...prev, paymentReminder: value }))
                  }
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor={notifications.paymentReminder ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Settlement Due</Text>
                  <Text style={styles.settingDescription}>
                    Notify about upcoming settlements
                  </Text>
                </View>
                <Switch
                  value={notifications.settlementDue}
                  onValueChange={(value) =>
                    setNotifications(prev => ({ ...prev, settlementDue: value }))
                  }
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor={notifications.settlementDue ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.buttonDisabled]}
              onPress={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingSection: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  currencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  currencyOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  currencyOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  currencyOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '500',
  },
  splitMethodOptions: {
    gap: 8,
  },
  splitMethodOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  splitMethodOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  splitMethodOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  splitMethodOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});