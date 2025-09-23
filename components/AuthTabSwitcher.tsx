import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AuthTabSwitcherProps {
  isLogin: boolean;
  onSwitchMode: () => void;
}

export const AuthTabSwitcher: React.FC<AuthTabSwitcherProps> = ({
  isLogin,
  onSwitchMode
}) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, isLogin && styles.activeTab]}
        onPress={() => !isLogin && onSwitchMode()}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
          Sign In
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, !isLogin && styles.activeTab]}
        onPress={() => isLogin && onSwitchMode()}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '700',
  },
});