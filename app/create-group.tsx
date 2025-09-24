import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';

interface GroupTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  suggestedDescription: string;
}

const GROUP_TEMPLATES: GroupTemplate[] = [
  {
    id: 'trip',
    name: 'Trip Planning',
    description: 'Plan expenses for vacations, getaways, or business trips',
    icon: 'airplane',
    color: '#3B82F6',
    suggestedDescription: 'Planning our amazing trip! Let\'s track all expenses and split costs fairly.',
  },
  {
    id: 'roommates',
    name: 'Roommates',
    description: 'Share household expenses with roommates or housemates',
    icon: 'home',
    color: '#10B981',
    suggestedDescription: 'Managing shared expenses for our home. Rent, utilities, groceries, and more.',
  },
  {
    id: 'event',
    name: 'Event Planning',
    description: 'Organize parties, weddings, birthdays, or special events',
    icon: 'balloon',
    color: '#F59E0B',
    suggestedDescription: 'Planning an amazing event! Let\'s track all the costs and contributions.',
  },
  {
    id: 'project',
    name: 'Project Work',
    description: 'Collaborate on work projects or freelance assignments',
    icon: 'briefcase',
    color: '#8B5CF6',
    suggestedDescription: 'Working on a project together. Let\'s track expenses and budget effectively.',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Manage family expenses and shared costs',
    icon: 'people-circle',
    color: '#EF4444',
    suggestedDescription: 'Managing family expenses and shared costs. Keeping everything organized and fair.',
  },
  {
    id: 'friends',
    name: 'Friends Outing',
    description: 'Plan outings, dinners, or activities with friends',
    icon: 'heart',
    color: '#EC4899',
    suggestedDescription: 'Having fun with friends! Let\'s track our shared expenses and memories.',
  },
  {
    id: 'custom',
    name: 'Custom Group',
    description: 'Create a custom group for any purpose',
    icon: 'add-circle',
    color: '#6B7280',
    suggestedDescription: '',
  },
];

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<GroupTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { createGroup } = useFinanceStore();

  const handleTemplateSelect = (template: GroupTemplate) => {
    setSelectedTemplate(template);
    if (template.id !== 'custom') {
      setGroupName('');
      setGroupDescription(template.suggestedDescription);
    } else {
      setGroupDescription('');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      setIsCreating(true);
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        avatar: selectedTemplate?.icon ? `👥` : '👥', // Default avatar
        category: selectedTemplate?.id,
      });

      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/chats')
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isCreating}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Group</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.templatesSection}>
            <Text style={styles.sectionTitle}>Choose a Group Type</Text>
            <Text style={styles.sectionSubtitle}>Select a template to get started quickly</Text>
            
            <View style={styles.templatesGrid}>
              {GROUP_TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate?.id === template.id && styles.selectedTemplateCard
                  ]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
                    <Ionicons name={template.icon as any} size={24} color="white" />
                  </View>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.textInput}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor="#94A3B8"
                maxLength={50}
                editable={!isCreating}
              />
              <Text style={styles.characterCount}>
                {groupName.length}/50
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description {selectedTemplate?.id !== 'custom' ? '(Auto-filled)' : '(Optional)'}</Text>
              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                value={groupDescription}
                onChangeText={setGroupDescription}
                placeholder="Describe your group"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                maxLength={200}
                editable={!isCreating}
              />
              <Text style={styles.characterCount}>
                {groupDescription.length}/200
              </Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={20} color="#64748B" />
                <Text style={styles.infoText}>
                  You'll be the admin of this group
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="link" size={20} color="#64748B" />
                <Text style={styles.infoText}>
                  An invite link will be generated automatically
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="chatbubbles" size={20} color="#64748B" />
                <Text style={styles.infoText}>
                  Members can chat and split expenses
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createButton, (!groupName.trim() || isCreating) && styles.createButtonDisabled]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Group</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  templatesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedTemplateCard: {
    borderColor: '#2563EB',
    backgroundColor: '#F0F9FF',
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  form: {
    marginBottom: 20,
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
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
  },
  infoSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    paddingTop: 20,
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