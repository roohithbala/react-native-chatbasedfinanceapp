import { AuthFormData } from './useAuthForm';

export const useAuthValidation = (formData: AuthFormData, isLogin: boolean) => {
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
  };

  const validateForm = () => {
    // Email validation
    if (!formData.email.trim()) {
      return { isValid: false, message: 'Email is required' };
    }

    if (!validateEmail(formData.email.trim())) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }

    // Password validation
    if (!formData.password.trim()) {
      return { isValid: false, message: 'Password is required' };
    }

    if (formData.password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }

    // Registration-specific validation
    if (!isLogin) {
      if (!formData.name.trim()) {
        return { isValid: false, message: 'Name is required for registration' };
      }

      if (!formData.username.trim()) {
        return { isValid: false, message: 'Username is required for registration' };
      }

      if (!validateUsername(formData.username.trim())) {
        return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
      }

      if (formData.password !== formData.confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
      }
    }

    return { isValid: true };
  };

  return {
    validateEmail,
    validateUsername,
    validateForm,
  };
};