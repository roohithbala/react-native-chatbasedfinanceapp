import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const AppFooter: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleEmailPress = () => {
    const email = 'roohithbala@outlook.com';
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  const handleGitHubPress = () => {
    const repoUrl = 'https://github.com/roohithbala/react-native-chatbasedfinanceapp';
    Linking.openURL(repoUrl).catch(() => {
      Alert.alert('Error', 'Unable to open GitHub repository');
    });
  };

  return (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <View style={styles.developerInfo}>
          <Text style={styles.developerText}>
            Developed by{' '}
            <Text style={styles.developerName}>roohithbala</Text>
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleEmailPress}
          >
            <Ionicons name="mail-outline" size={14} color={theme.primary} />
            <Text style={styles.contactText}> roohithbala@outlook.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.repoInfo}>
          <TouchableOpacity
            style={styles.repoButton}
            onPress={handleGitHubPress}
          >
            <Ionicons name="logo-github" size={16} color={theme.primary} />
            <Text style={styles.repoText}> Open Source</Text>
          </TouchableOpacity>
          <Text style={styles.repoSubtext}>View source code on GitHub</Text>
        </View>
      </View>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  footer: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  developerInfo: {
    flex: 1,
  },
  developerText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  developerName: {
    fontWeight: '600',
    color: theme.primary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: theme.primary,
    textDecorationLine: 'underline',
  },
  repoInfo: {
    alignItems: 'flex-end',
  },
  repoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  repoText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  repoSubtext: {
    fontSize: 10,
    color: theme.textTertiary,
  },
});

export default AppFooter;