import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  showPicker: boolean;
  onTogglePicker: () => void;
}

export default function DatePickerComponent({ date, onDateChange, showPicker, onTogglePicker }: DatePickerProps) {
  const { theme } = useTheme();
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      onTogglePicker();
    }
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>📅 Date</Text>
      <TouchableOpacity
        style={[styles.dateButton, { backgroundColor: theme.surface }]}
        onPress={onTogglePicker}
      >
        <Text style={styles.dateText}>
          {date.toLocaleDateString()}
        </Text>
        <Ionicons name="calendar" size={20} color="#64748B" />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 16,
    color: '#1E293B',
  },
});