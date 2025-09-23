import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: LocalAuthentication.AuthenticationType;
}

export class BiometricService {
  private static instance: BiometricService;

  static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  async isBiometricAvailable(): Promise<{
    available: boolean;
    types: LocalAuthentication.AuthenticationType[];
    hasHardware: boolean;
    isEnrolled: boolean;
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        available: hasHardware && isEnrolled,
        types: supportedTypes,
        hasHardware,
        isEnrolled,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        available: false,
        types: [],
        hasHardware: false,
        isEnrolled: false,
      };
    }
  }

  async authenticate(reason: string = 'Authenticate to access your account'): Promise<BiometricResult> {
    try {
      const biometricCheck = await this.isBiometricAvailable();

      if (!biometricCheck.available) {
        return {
          success: false,
          error: biometricCheck.hasHardware
            ? 'Biometric authentication is not set up on this device'
            : 'Biometric authentication is not available on this device',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Store successful biometric authentication
        await AsyncStorage.setItem('biometric_authenticated', Date.now().toString());
        return {
          success: true,
          biometricType: biometricCheck.types[0],
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  }

  async enableBiometric(): Promise<BiometricResult> {
    const result = await this.authenticate('Enable biometric authentication for quick access');

    if (result.success) {
      await AsyncStorage.setItem('biometric_enabled', 'true');
      return result;
    }

    return result;
  }

  async disableBiometric(): Promise<void> {
    await AsyncStorage.removeItem('biometric_enabled');
    await AsyncStorage.removeItem('biometric_authenticated');
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  async shouldRequireBiometric(): Promise<boolean> {
    try {
      const enabled = await this.isBiometricEnabled();
      if (!enabled) return false;

      const lastAuth = await AsyncStorage.getItem('biometric_authenticated');
      if (!lastAuth) return true;

      // Require re-authentication after 24 hours
      const lastAuthTime = parseInt(lastAuth);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const now = Date.now();

      return (now - lastAuthTime) > twentyFourHours;
    } catch {
      return false;
    }
  }

  async getBiometricType(): Promise<LocalAuthentication.AuthenticationType | null> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.length > 0 ? types[0] : null;
    } catch {
      return null;
    }
  }
}

export const biometricService = BiometricService.getInstance();