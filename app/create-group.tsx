import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';
import ExpenseScreenHeader from '@/app/components/ExpenseScreenHeader';
import GroupTemplateSelector from './components/GroupTemplateSelector';
import GroupForm from './components/GroupForm';
import GroupInfoSection from './components/GroupInfoSection';
import { getStyles } from '@/lib/styles/createGroupStyles';

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
  const styles = getStyles();

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
      <ExpenseScreenHeader title="Create Group" />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>Choose a Group Type</Text>
          <Text style={styles.sectionSubtitle}>Select a template to get started quickly</Text>
          
          <GroupTemplateSelector
            templates={GROUP_TEMPLATES}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
          />
        </View>

        <GroupForm
          groupName={groupName}
          groupDescription={groupDescription}
          selectedTemplateId={selectedTemplate?.id || null}
          onGroupNameChange={setGroupName}
          onGroupDescriptionChange={setGroupDescription}
          isCreating={isCreating}
        />

        <GroupInfoSection />
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
              <Ionicons name="people" size={24} color="white" />
              <Text style={styles.createButtonText}>Create Group</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}