import React from 'react';
import { View as RNView, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface ThemedViewProps extends ViewProps {
  style?: ViewProps['style'];
}

export const View: React.FC<ThemedViewProps> = ({ style, ...props }) => {
  const { theme } = useTheme();
  return (
    <RNView style={[{ backgroundColor: theme.background }, style]} {...props} />
  );
};

export interface CardProps {
  style?: ViewProps['style'];
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ style, children }) => {
  const { theme } = useTheme();
  return (
    <View style={[{
      backgroundColor: theme.card,
      borderRadius: 12,
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Empty for now since we're using inline styles
});

export default {
  View,
  Card,
};
