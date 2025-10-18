import React from 'react';
import { View, Text, StyleSheet , Switch } from 'react-native';

import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      {settingsItems.map((item, index) => (
        <View key={index} style={[styles.settingItem, { backgroundColor: theme.surface }]}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={item.value ? theme.surface : theme.textSecondary}
          />
        </View>
      ))}
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
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
    color: theme.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});

export default SettingsSection;