import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Google OAuth discovery document
const GOOGLE_OAUTH_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_OAUTH_CLIENT_ID = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'YOUR_IOS_CLIENT_ID',
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'YOUR_ANDROID_CLIENT_ID',
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID',
};

// Get the appropriate client ID based on platform
const getClientId = () => {
  if (Platform.OS === 'ios') {
    return GOOGLE_OAUTH_CLIENT_ID.ios;
  } else if (Platform.OS === 'android') {
    return GOOGLE_OAUTH_CLIENT_ID.android;
  } else {
    return GOOGLE_OAUTH_CLIENT_ID.web;
  }
};

export interface GoogleAuthResult {
  type: 'success' | 'error' | 'cancel';
  params?: {
    access_token?: string;
    id_token?: string;
    error?: string;
  };
  errorCode?: string;
}

class GoogleAuthService {
  private static instance: GoogleAuthService;

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async signIn(): Promise<GoogleAuthResult> {
    try {
      const clientId = getClientId();

      if (!clientId || clientId === 'YOUR_IOS_CLIENT_ID' || clientId === 'YOUR_ANDROID_CLIENT_ID' || clientId === 'YOUR_WEB_CLIENT_ID') {
        throw new Error('Google OAuth client ID not configured. Please set up your Google OAuth credentials.');
      }

      console.log('Platform:', Platform.OS);
      console.log('Client ID:', clientId);

      // Use AuthRequest with authorization code flow (recommended by Google)
      const redirectUri = 'https://auth.expo.io/@roohithbalag23csd/securefinance-app';
      console.log('Using redirect URI:', redirectUri);

      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri,
        prompt: AuthSession.Prompt.SelectAccount,
        usePKCE: true,
      });

      console.log('Starting OAuth request with AuthRequest...');
      const result = await request.promptAsync(GOOGLE_OAUTH_DISCOVERY);

      console.log('AuthRequest result type:', result.type);
      console.log('AuthRequest result details:', JSON.stringify(result, null, 2));

      if (result.type === 'success' && 'params' in result && result.params.code) {
        console.log('Authorization code received, exchanging for tokens...');

        // Exchange authorization code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
          },
          GOOGLE_OAUTH_DISCOVERY
        );

        console.log('Token exchange successful');

        return {
          type: 'success',
          params: {
            access_token: tokenResult.accessToken,
            id_token: tokenResult.idToken,
          },
        };
      } else if (result.type === 'error') {
        const params = 'params' in result ? result.params : {};
        console.error('OAuth error details:', {
          error: params.error,
          error_description: params.error_description,
          error_uri: params.error_uri,
          full_params: params
        });
        return {
          type: 'error',
          params: {
            error: params.error || 'Authentication failed',
          },
          errorCode: params.error_description,
        };
      } else {
        console.log('User cancelled OAuth flow');
        return {
          type: 'cancel',
        };
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      return {
        type: 'error',
        params: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async signOut(): Promise<void> {
    // For Google OAuth, we don't need to explicitly sign out
    // The user will be signed out when they revoke access in their Google account
    // or when the access token expires
  }

  isConfigured(): boolean {
    const clientId = getClientId();
    return !!(clientId && clientId !== 'YOUR_IOS_CLIENT_ID' && clientId !== 'YOUR_ANDROID_CLIENT_ID' && clientId !== 'YOUR_WEB_CLIENT_ID');
  }
}

export default GoogleAuthService;