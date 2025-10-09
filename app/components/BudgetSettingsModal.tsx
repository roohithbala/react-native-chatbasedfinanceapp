import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useBudgetsStore } from '@/lib/store/budgetsStore';

interface BudgetSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { rolloverBudgets, resetBudgets } = useBudgetsStore();
  
  const [rolloverUnused, setRolloverUnused] = useState(true);
  const [rolloverPercentage, setRolloverPercentage] = useState('100');
  const [resetPeriod, setResetPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRollover = async () => {
    try {
      setIsProcessing(true);
      
      const percentage = parseFloat(rolloverPercentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        Alert.alert('Error', 'Please enter a valid percentage (0-100)');
        return;
      }

      await rolloverBudgets({
        rolloverUnused,
        rolloverPercentage: percentage,
      });

      Alert.alert(
        'Success',
        'Budgets have been rolled over to the next period!',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to rollover budgets');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Confirm Reset',
      'Are you sure you want to reset all budgets? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await resetBudgets({ period: resetPeriod });
              Alert.alert(
                'Success',
                'All budgets have been reset for the new period!',
                [{ text: 'OK', onPress: onClose }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reset budgets');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Budget Settings
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.primary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Rollover Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Rollover Budgets
              </Text>
              <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                Transfer unused budget amounts to the next period
              </Text>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Rollover Unused Amount
                </Text>
                <Switch
                  value={rolloverUnused}
                  onValueChange={setRolloverUnused}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={rolloverUnused ? theme.success : theme.textSecondary}
                />
              </View>

              {rolloverUnused && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Rollover Percentage (0-100)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    value={rolloverPercentage}
                    onChangeText={setRolloverPercentage}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <Text style={[styles.inputHint, { color: theme.textSecondary }]}>
                    {rolloverPercentage}% of unused amounts will be added to next period
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.primary },
                  isProcessing && styles.disabledButton,
                ]}
                onPress={handleRollover}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Apply Rollover</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Reset Section */}
            <View style={[styles.section, styles.resetSection]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Reset Budgets
              </Text>
              <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                Reset all budgets for a new period
              </Text>

              <View style={styles.periodSelector}>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    resetPeriod === 'monthly' && { backgroundColor: theme.primary },
                    { borderColor: theme.border },
                  ]}
                  onPress={() => setResetPeriod('monthly')}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      {
                        color: resetPeriod === 'monthly' ? '#fff' : theme.text,
                      },
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    resetPeriod === 'yearly' && { backgroundColor: theme.primary },
                    { borderColor: theme.border },
                  ]}
                  onPress={() => setResetPeriod('yearly')}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      {
                        color: resetPeriod === 'yearly' ? '#fff' : theme.text,
                      },
                    ]}
                  >
                    Yearly
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.resetButton,
                  { backgroundColor: theme.error },
                  isProcessing && styles.disabledButton,
                ]}
                onPress={handleReset}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Reset All Budgets</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  resetSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default BudgetSettingsModal;
