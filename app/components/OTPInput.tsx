import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function OTPInput({
  length = 6,
  onComplete,
  onChange,
  disabled = false,
  error
}: OTPInputProps) {
  const { theme } = useTheme();
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<TextInput[]>([]);

  const styles = getStyles(theme);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (value: string, index: number) => {
    if (disabled) return;

    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue.length > 1) {
      // Handle paste operation
      const digits = numericValue.split('').slice(0, length);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < length) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);

      const completeOtp = newOtp.join('');
      onChange?.(completeOtp);

      if (completeOtp.length === length) {
        onComplete(completeOtp);
      }

      // Focus last filled input or first empty input
      const nextIndex = Math.min(digits.length, length - 1);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    const completeOtp = newOtp.join('');
    onChange?.(completeOtp);

    // Auto-focus next input
    if (numericValue && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Check if OTP is complete
    if (completeOtp.length === length) {
      onComplete(completeOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (disabled) return;

    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    if (disabled) return;

    // Clear all inputs after current position when focused
    const newOtp = [...otp];
    for (let i = index + 1; i < length; i++) {
      newOtp[i] = '';
    }
    setOtp(newOtp);
  };

  const clearOTP = () => {
    setOtp(new Array(length).fill(''));
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.input,
              error && styles.inputError,
              disabled && styles.inputDisabled
            ]}
            value={digit}
            onChangeText={(value) => handleChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            editable={!disabled}
            contextMenuHidden
          />
        ))}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <TouchableOpacity
        style={[styles.clearButton, disabled && styles.clearButtonDisabled]}
        onPress={clearOTP}
        disabled={disabled}
      >
        <Text style={[styles.clearButtonText, disabled && styles.clearButtonDisabledText]}>
          Clear
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  input: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    backgroundColor: theme.surface,
  },
  inputError: {
    borderColor: theme.error || '#EF4444',
  },
  inputDisabled: {
    backgroundColor: theme.surfaceVariant || '#F5F5F5',
    opacity: 0.6,
  },
  errorText: {
    color: theme.error || '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButtonDisabledText: {
    color: theme.textSecondary,
  },
});