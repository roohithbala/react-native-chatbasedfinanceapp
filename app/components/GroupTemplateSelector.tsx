import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GroupTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  suggestedDescription: string;
}

interface GroupTemplateSelectorProps {
  templates: GroupTemplate[];
  selectedTemplate: GroupTemplate | null;
  onTemplateSelect: (template: GroupTemplate) => void;
}

export default function GroupTemplateSelector({
  templates,
  selectedTemplate,
  onTemplateSelect,
}: GroupTemplateSelectorProps) {
  return (
    <View style={styles.templatesGrid}>
      {templates.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={[
            styles.templateCard,
            selectedTemplate?.id === template.id && styles.selectedTemplateCard
          ]}
          onPress={() => onTemplateSelect(template)}
        >
          <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
            <Ionicons name={template.icon as any} size={24} color="white" />
          </View>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateDescription}>{template.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
});