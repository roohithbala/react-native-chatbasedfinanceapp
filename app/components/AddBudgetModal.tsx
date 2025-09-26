import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AddBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  category: string;
  onCategoryChange: (category: string) => void;
  limit: string;
  onLimitChange: (limit: string) => void;
  categories: string[];
  categoryIcons: Record<string, string>;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  visible,
  onClose,
  onSave,
  category,
  onCategoryChange,
  limit,
  onLimitChange,
  categories,
  categoryIcons,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={[styles.modalHeader, { backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Set Budget</Text>
          <TouchableOpacity onPress={onSave}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.surface },
                    category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => onCategoryChange(cat)}
                >
                  <Text style={styles.categoryEmoji}>
                    {categoryIcons[cat as keyof typeof categoryIcons]}
                  </Text>
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Budget Limit</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.surface }]}
              value={limit}
              onChangeText={onLimitChange}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary || '#94A3B8'}
              keyboardType="numeric"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background || '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E2E8F0',
    backgroundColor: theme.surface || 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text || '#1E293B',
  },
  modalCancel: {
    fontSize: 16,
    color: theme.textSecondary || '#64748B',
  },
  modalSave: {
    fontSize: 16,
    color: theme.primary || '#8B5CF6',
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
    color: theme.text || '#1E293B',
    marginBottom: 8,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface || 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.border || '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: theme.primary || '#8B5CF6',
    borderColor: theme.primary || '#8B5CF6',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary || '#64748B',
  },
  categoryTextActive: {
    color: theme.surface || 'white',
  },
  textInput: {
    backgroundColor: theme.surface || 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border || '#E2E8F0',
    color: theme.text || '#1E293B',
  },
});

export default AddBudgetModal;