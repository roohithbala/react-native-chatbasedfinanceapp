import React from 'react';
import { View as RNView, ViewProps, StyleSheet } from 'react-native';

export interface ThemedViewProps extends ViewProps {
  style?: ViewProps['style'];
}

export const View: React.FC<ThemedViewProps> = ({ style, ...props }) => (
  <RNView style={[styles.view, style]} {...props} />
);

export interface CardProps {
  style?: ViewProps['style'];
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ style, children }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  view: {
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
});

export default {
  View,
  Card,
};
