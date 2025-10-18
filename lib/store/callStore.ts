import { create } from 'zustand';
import { CallData, CallParticipant } from '../services/callService';

interface CallState {
  // Current call state
  currentCall: CallData | null;
  isInCall: boolean;
  callStatus: 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';

  // Call participants
  participants: CallParticipant[];
  localParticipant: CallParticipant | null;

  // Media state
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;

  // Incoming call
  incomingCall: CallData | null;

  // Call history
  callHistory: CallData[];

  // Actions
  setCurrentCall: (call: CallData | null) => void;
  setCallStatus: (status: CallState['callStatus']) => void;
  setParticipants: (participants: CallParticipant[]) => void;
  updateParticipant: (userId: string, updates: Partial<CallParticipant>) => void;
  addParticipant: (participant: CallParticipant) => void;
  removeParticipant: (userId: string) => void;

  // Media controls
  setMuted: (muted: boolean) => void;
  setVideoOff: (videoOff: boolean) => void;
  setSpeakerOn: (speakerOn: boolean) => void;

  // Incoming call management
  setIncomingCall: (call: CallData | null) => void;

  // Call history
  addToCallHistory: (call: CallData) => void;
  setCallHistory: (calls: CallData[]) => void;

  // Utility actions
  resetCallState: () => void;
  startCall: (callData: CallData) => void;
  endCall: () => void;
}

const initialState = {
  currentCall: null,
  isInCall: false,
  callStatus: 'idle' as const,
  participants: [],
  localParticipant: null,
  isMuted: false,
  isVideoOff: false,
  isSpeakerOn: false,
  incomingCall: null,
  callHistory: [],
};

export const useCallStore = create<CallState>((set, get) => ({
  ...initialState,

  setCurrentCall: (call) => set({
    currentCall: call,
    isInCall: call !== null,
    callStatus: call ? call.status : 'idle'
  }),

  setCallStatus: (status) => set({ callStatus: status }),

  setParticipants: (participants) => set({ participants }),

  updateParticipant: (userId, updates) => set((state) => ({
    participants: state.participants.map(p =>
      p.userId === userId ? { ...p, ...updates } : p
    )
  })),

  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant]
  })),

  removeParticipant: (userId) => set((state) => ({
    participants: state.participants.filter(p => p.userId !== userId)
  })),

  setMuted: (muted) => set({ isMuted: muted }),

  setVideoOff: (videoOff) => set({ isVideoOff: videoOff }),

  setSpeakerOn: (speakerOn) => set({ isSpeakerOn: speakerOn }),

  setIncomingCall: (call) => set({ incomingCall: call }),

  addToCallHistory: (call) => set((state) => ({
    callHistory: [call, ...state.callHistory]
  })),

  setCallHistory: (calls) => set({ callHistory: calls }),

  resetCallState: () => set(initialState),

  startCall: (callData) => set({
    currentCall: callData,
    isInCall: true,
    callStatus: callData.status,
    participants: callData.participants,
    localParticipant: callData.participants.find(p => p.userId === 'current_user') || null
  }),

  endCall: () => {
    const { currentCall } = get();
    if (currentCall) {
      get().addToCallHistory({
        ...currentCall,
        status: 'ended',
        endTime: new Date()
      });
    }
    get().resetCallState();
  }
}));

export default useCallStore;