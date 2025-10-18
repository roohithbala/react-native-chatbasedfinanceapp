import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  type?: 'fingerprint' | 'facial' | 'iris';
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  canAuthenticate: boolean;
}

class BiometricAuthService {
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private static readonly BIOMETRIC_TYPE_KEY = 'biometric_type';

  /**
   * Check if the device supports biometric authentication
   */
  async getBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const canAuthenticate = hasHardware && isEnrolled && supportedTypes.length > 0;

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        canAuthenticate,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        canAuthenticate: false,
      };
    }
  }

  /**
   * Get the type of biometric authentication available
   */
  getBiometricType(types: LocalAuthentication.AuthenticationType[]): 'fingerprint' | 'facial' | 'iris' | null {
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'facial';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    return null;
  }

  /**
   * Check if biometric authentication is enabled for the user
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      console.log('🔐 Checking if biometric is enabled...');
      const enabled = await AsyncStorage.getItem(BiometricAuthService.BIOMETRIC_ENABLED_KEY);
      const result = enabled === 'true';
      console.log('🔐 Biometric enabled result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometric(): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.getBiometricCapabilities();

      if (!capabilities.canAuthenticate) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      // Test biometric authentication
      const authResult = await this.authenticate('Enable biometric authentication');

      if (authResult.success) {
        await AsyncStorage.setItem(BiometricAuthService.BIOMETRIC_ENABLED_KEY, 'true');
        const biometricType = this.getBiometricType(capabilities.supportedTypes);
        if (biometricType) {
          await AsyncStorage.setItem(BiometricAuthService.BIOMETRIC_TYPE_KEY, biometricType);
        }
        return { success: true, type: biometricType || undefined };
      }

      return authResult;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return {
        success: false,
        error: 'Failed to enable biometric authentication',
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BiometricAuthService.BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(BiometricAuthService.BIOMETRIC_TYPE_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  }

  /**
   * Authenticate using biometric
   */
  async authenticate(reason: string = 'Authenticate to continue'): Promise<BiometricAuthResult> {
    try {
      console.log('🔐 Checking biometric capabilities...');
      const capabilities = await this.getBiometricCapabilities();
      console.log('Biometric capabilities:', capabilities);

      if (!capabilities.canAuthenticate) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
        };
      }

      console.log('🔐 Starting biometric authentication prompt...');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      console.log('🔐 Raw authentication result:', result);

      if (result.success) {
        const biometricType = this.getBiometricType(capabilities.supportedTypes);
        console.log('✅ Biometric authentication successful, type:', biometricType);
        return {
          success: true,
          type: biometricType || undefined,
        };
      } else {
        let error = 'Authentication failed';
        // Cast result to any to access error property that may not be in type definitions
        const resultWithError = result as any;
        console.log('❌ Biometric authentication failed, raw result:', resultWithError);

        if (resultWithError.error) {
          switch (resultWithError.error) {
            case 'user_cancel':
              error = 'Authentication cancelled';
              break;
            case 'system_cancel':
              error = 'Authentication cancelled by system';
              break;
            case 'lockout':
              error = 'Too many failed attempts. Try again later.';
              break;
            case 'not_enrolled':
              error = 'No biometric data enrolled';
              break;
            case 'not_available':
              error = 'Biometric authentication not available';
              break;
            default:
              error = `Authentication failed: ${resultWithError.error}`;
          }
        }
        console.log('❌ Biometric authentication error:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }
  }

  /**
   * Get stored biometric type
   */
  async getStoredBiometricType(): Promise<'fingerprint' | 'facial' | 'iris' | null> {
    try {
      const type = await AsyncStorage.getItem(BiometricAuthService.BIOMETRIC_TYPE_KEY);
      return type as 'fingerprint' | 'facial' | 'iris' | null;
    } catch (error) {
      console.error('Error getting stored biometric type:', error);
      return null;
    }
  }

  /**
   * Quick biometric check for app unlock
   */
  async authenticateForAppUnlock(): Promise<BiometricAuthResult> {
    try {
      console.log('🔐 Checking if biometric is enabled for app unlock...');
      const enabled = await this.isBiometricEnabled();
      console.log('Biometric enabled status:', enabled);

      if (!enabled) {
        return { success: false, error: 'Biometric authentication not enabled' };
      }

      console.log('🔐 Starting biometric authentication for app unlock...');
      const result = await this.authenticate('Unlock SecureFinance');
      console.log('🔐 Biometric authentication result:', result);

      return result;
    } catch (error) {
      console.error('❌ Error in authenticateForAppUnlock:', error);
      return {
        success: false,
        error: 'Biometric authentication failed due to an unexpected error'
      };
    }
  }
}

export default new BiometricAuthService();