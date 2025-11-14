import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme, hexToRgba } from '../context/ThemeContext';

interface ReminderSettingsProps {
  settings: {
    enablePaymentDueReminders: boolean;
    enableSettlementReminders: boolean;
    enableOverdueReminders: boolean;
    paymentDueReminderHours: number;
    settlementReminderDays: number;
    overdueReminderDays: number;
  };
  onSettingsChange: (settings: any) => void;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { theme } = useTheme();

  const updateSetting = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Payment Reminders
      </Text>

      {/* Payment Due Reminders */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            Payment Due Reminders
          </Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Get notified when payments are due
          </Text>
        </View>
        <Switch
          value={settings.enablePaymentDueReminders}
          onValueChange={(value) => updateSetting('enablePaymentDueReminders', value)}
          trackColor={{ false: theme.border, true: hexToRgba(theme.primary, 0.5) }}
          thumbColor={settings.enablePaymentDueReminders ? theme.primary : theme.textSecondary}
        />
      </View>

      {settings.enablePaymentDueReminders && (
        <View style={styles.subSetting}>
          <Text style={[styles.subSettingLabel, { color: theme.text }]}>
            Hours before due date:
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
            value={settings.paymentDueReminderHours.toString()}
            onChangeText={(value) => {
              const numValue = parseInt(value) || 24;
              updateSetting('paymentDueReminderHours', Math.max(1, Math.min(168, numValue)));
            }}
            keyboardType="numeric"
            placeholder="24"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      )}

      {/* Settlement Reminders */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            Settlement Reminders
          </Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Weekly reminders for unsettled payments
          </Text>
        </View>
        <Switch
          value={settings.enableSettlementReminders}
          onValueChange={(value) => updateSetting('enableSettlementReminders', value)}
          trackColor={{ false: theme.border, true: hexToRgba(theme.primary, 0.5) }}
          thumbColor={settings.enableSettlementReminders ? theme.primary : theme.textSecondary}
        />
      </View>

      {settings.enableSettlementReminders && (
        <View style={styles.subSetting}>
          <Text style={[styles.subSettingLabel, { color: theme.text }]}>
            Days between reminders:
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
            value={settings.settlementReminderDays.toString()}
            onChangeText={(value) => {
              const numValue = parseInt(value) || 7;
              updateSetting('settlementReminderDays', Math.max(1, Math.min(30, numValue)));
            }}
            keyboardType="numeric"
            placeholder="7"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      )}

      {/* Overdue Payment Reminders */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            Overdue Payment Alerts
          </Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Escalating reminders for overdue payments
          </Text>
        </View>
        <Switch
          value={settings.enableOverdueReminders}
          onValueChange={(value) => updateSetting('enableOverdueReminders', value)}
          trackColor={{ false: theme.border, true: hexToRgba(theme.primary, 0.5) }}
          thumbColor={settings.enableOverdueReminders ? theme.primary : theme.textSecondary}
        />
      </View>

      {settings.enableOverdueReminders && (
        <View style={styles.subSetting}>
          <Text style={[styles.subSettingLabel, { color: theme.text }]}>
            Days after due date:
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
            value={settings.overdueReminderDays.toString()}
            onChangeText={(value) => {
              const numValue = parseInt(value) || 3;
              updateSetting('overdueReminderDays', Math.max(1, Math.min(14, numValue)));
            }}
            keyboardType="numeric"
            placeholder="3"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      )}

      <Text style={[styles.note, { color: theme.textSecondary }]}>
        💡 Reminders help ensure timely payments and maintain healthy group finances.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  subSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  subSettingLabel: {
    fontSize: 14,
    marginRight: 12,
    minWidth: 120,
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 16,
    lineHeight: 16,
  },
});

export default ReminderSettings;