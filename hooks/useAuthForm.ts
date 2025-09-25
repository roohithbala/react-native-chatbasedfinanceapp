import { useState } from 'react';
import { Alert } from 'react-native';
import { useFinanceStore } from '@/lib/store/financeStore';

export interface AuthFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  upiId: string;
}

export const useAuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    upiId: '',
  });

  const { login, register, isLoading, error, clearError } = useFinanceStore();

  const updateFormData = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearForm = () => {
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      upiId: '',
    });
  };

  const handleSubmit = async () => {
    try {
      clearError();

      // Basic validation
      if (!formData.email.trim() || !formData.password.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (isLogin) {
        await login(formData.email.trim(), formData.password);
        Alert.alert('Success', 'Welcome back!');
      } else {
        await register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
          upiId: formData.upiId.trim(),
        });
        Alert.alert('Success', 'Account created successfully!');
      }

      // Clear form on success
      clearForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearError();
    clearForm();
  };

  return {
    // State
    isLogin,
    formData,
    isLoading,
    error,

    // Actions
    updateFormData,
    handleSubmit,
    switchMode,
    clearError,
  };
};