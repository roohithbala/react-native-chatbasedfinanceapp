import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupType, setGroupType] = useState<'friends' | 'family' | 'roommates' | 'work' | 'other'>('friends');
  const [isPrivate, setIsPrivate] = useState(false);

  const { createGroup, isLoading } = useFinanceStore();

  const groupTypeOptions = [
    { value: 'friends', label: 'Friends', icon: 'people', description: 'Hang out with friends and split bills' },
    { value: 'family', label: 'Family', icon: 'home', description: 'Manage family expenses together' },
    { value: 'roommates', label: 'Roommates', icon: 'bed', description: 'Share rent and household costs' },
    { value: 'work', label: 'Work Team', icon: 'briefcase', description: 'Team outings and work expenses' },
    { value: 'other', label: 'Other', icon: 'grid', description: 'Custom group for any purpose' },
  ];

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Missing Information', 'Please enter a group name');
      return;
    }

    if (groupName.trim().length < 3) {
      Alert.alert('Invalid Name', 'Group name must be at least 3 characters long');
      return;
    }

    try {
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || `${groupTypeOptions.find(t => t.value === groupType)?.label} group`,
        type: groupType,
        isPrivate,
      };

      await createGroup(groupData);

      Alert.alert(
        'Group Created!',
        `"${groupName}" has been created successfully. You can now add members to start sharing expenses.`,
        [
          {
            text: 'Add Members',
            onPress: () => {
              // Navigate to add members screen (we'll create this next)
              router.replace('/chats');
            }
          },
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => router.replace('/chats')
          }
        ]
      );
    } catch (error) {
      // Error is handled in the store
    }
  };

  const selectedType = groupTypeOptions.find(t => t.value === groupType);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Create New Group</Text>
            <Text style={styles.headerSubtitle}>
              Start sharing expenses with friends and family
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Group Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Weekend Trip, House Expenses"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              autoCapitalize="words"
            />
            <Text style={styles.inputHint}>
              {groupName.length}/50 characters
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="What's this group for?"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.inputHint}>
              {groupDescription.length}/200 characters
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Type</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the type that best describes your group
          </Text>

          {groupTypeOptions.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeOption,
                groupType === type.value && styles.selectedTypeOption
              ]}
              onPress={() => setGroupType(type.value as any)}
            >
              <View style={styles.typeIcon}>
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={groupType === type.value ? '#2563EB' : '#64748B'}
                />
              </View>
              <View style={styles.typeContent}>
                <Text style={[
                  styles.typeLabel,
                  groupType === type.value && styles.selectedTypeLabel
                ]}>
                  {type.label}
                </Text>
                <Text style={[
                  styles.typeDescription,
                  groupType === type.value && styles.selectedTypeDescription
                ]}>
                  {type.description}
                </Text>
              </View>
              {groupType === type.value && (
                <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>

          <TouchableOpacity
            style={styles.privacyOption}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={styles.privacyContent}>
              <Ionicons
                name={isPrivate ? "lock-closed" : "lock-open"}
                size={24}
                color={isPrivate ? "#2563EB" : "#64748B"}
              />
              <View style={styles.privacyText}>
                <Text style={styles.privacyLabel}>
                  {isPrivate ? 'Private Group' : 'Public Group'}
                </Text>
                <Text style={styles.privacyDescription}>
                  {isPrivate
                    ? 'Only invited members can join'
                    : 'Anyone with the invite code can join'
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggle, isPrivate && styles.toggleActive]}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              <View style={[
                styles.toggleKnob,
                isPrivate && styles.toggleKnobActive
              ]} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewAvatar}>
                <Ionicons name="people" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>
                  {groupName || 'Your Group Name'}
                </Text>
                <Text style={styles.previewMembers}>1 member</Text>
              </View>
            </View>
            <Text style={styles.previewDescription}>
              {groupDescription || selectedType?.description || 'Group description'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, (!groupName.trim() || isLoading) && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Group</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedTypeOption: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  selectedTypeLabel: {
    color: '#2563EB',
  },
  typeDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedTypeDescription: {
    color: '#2563EB',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyText: {
    marginLeft: 16,
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#2563EB',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  previewSection: {
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  previewMembers: {
    fontSize: 12,
    color: '#64748B',
  },
  previewDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});