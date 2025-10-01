import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallStore } from '../../lib/store/callStore';
import { callService } from '../../lib/services/callService';

const { width } = Dimensions.get('window');

interface CallNotificationProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export const CallNotification: React.FC<CallNotificationProps> = ({
  onAccept,
  onDecline,
}) => {
  const { incomingCall, setIncomingCall } = useCallStore();

  if (!incomingCall) return null;

  const handleAccept = async () => {
    try {
      await callService.answerCall();
      setIncomingCall(null);
      onAccept?.();
    } catch (error) {
      console.error('Failed to accept call:', error);
      Alert.alert('Error', 'Failed to accept call');
    }
  };

  const handleDecline = () => {
    // Send decline signal to backend
    callService.endCall();
    setIncomingCall(null);
    onDecline?.();
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="call" size={24} color="white" />
          <Text style={styles.title}>Incoming Call</Text>
        </View>

        {/* Call Info */}
        <View style={styles.callInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="rgba(255, 255, 255, 0.8)" />
          </View>
          <Text style={styles.callerName}>
            {incomingCall.callerName || 'Unknown Caller'}
          </Text>
          <Text style={styles.callType}>
            {incomingCall.type === 'video' ? 'Video Call' : 'Voice Call'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDecline}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.actionText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.actionText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width * 0.9,
    maxWidth: 350,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  callInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  callType: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default CallNotification;