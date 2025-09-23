import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Switch } from 'react-native';

interface SettingItem {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

interface SettingsSectionProps {
  settingsItems: SettingItem[];
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ settingsItems }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      {settingsItems.map((item, index) => (
        <View key={index} style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
            thumbColor={item.value ? '#FFFFFF' : '#94A3B8'}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  settingItem: {
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
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default SettingsSection;