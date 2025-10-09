import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import styles from '@/lib/styles/budgetStyles';

type Props<T extends string = string> = {
  viewMode: T;
  setViewMode?: (mode: T) => void;
  onViewModeChange?: (mode: T) => void;
  theme: any;
  options?: { label: string; value: T }[];
};

export default function ViewModeSelector<T extends string = string>({
  viewMode,
  setViewMode,
  onViewModeChange,
  theme,
  options = [
    { label: 'Current', value: 'current' as T },
    { label: 'Historical', value: 'historical' as T }
  ]
}: Props<T>) {
  const handlePress = (mode: T) => {
    if (setViewMode) {
      setViewMode(mode);
    } else if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  return (
    <View style={[styles.viewModeSelector, { backgroundColor: theme.surfaceSecondary || 'rgba(0,0,0,0.05)' }]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.viewModeButton,
            viewMode === option.value && [styles.selectedViewModeButton, { backgroundColor: theme.primary }],
          ]}
          onPress={() => handlePress(option.value)}
        >
          <Text style={[
            styles.viewModeButtonText,
            { color: theme.text },
            viewMode === option.value && [styles.selectedViewModeButtonText, { color: theme.surface }]
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
