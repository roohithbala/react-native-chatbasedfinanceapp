export interface User {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface ChatUser {
  _id: string;
  name: string;
  username: string;
}

export interface ReadReceipt {
  userId: string;
  readAt: Date;
}

export interface Reaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface LocationMention {
  locationId: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface CommandData {
  amount?: number;
  splitAmount?: number;
  participants?: string[];
  category?: string;
  description?: string;
  prediction?: string;
  confidence?: number;
  budgetCategory?: string;
  budgetAmount?: number;
  periodStart?: Date;
  periodEnd?: Date;
  totalAmount?: number;
  itemCount?: number;
}

export interface SplitBillData {
  splitBillId: string;
  description: string;
  totalAmount: number;
  userShare: number;
  isPaid: boolean;
  participants: {
    userId: string;
    name: string;
    amount: number;
    isPaid: boolean;
  }[];
}

export interface SystemData {
  type: 'info' | 'warning' | 'error' | 'success';
  code?: string;
  details?: any;
}

export interface Message {
  _id: string;
  text: string;
  user: User;
  groupId: string;
  createdAt: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system' | 'command' | 'split_bill';
  status: 'sent' | 'delivered' | 'read' | 'error';
  readBy: ReadReceipt[];
  commandType?: 'split' | 'expense' | 'budget' | 'predict' | 'summary';
  commandData?: CommandData;
  systemData?: SystemData;
  splitBillData?: SplitBillData;
  // Multimedia fields
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaSize?: number;
  mediaDuration?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  mentions?: string[];
  reactions?: Reaction[];
  locationMentions?: LocationMention[];
  isTemp?: boolean;
}

export interface MessageResponse {
  status: 'success' | 'error';
  data: {
    message: Message;
    systemMessage?: Message;
  };
  message?: string;
}

export interface MessagesResponse {
  status: 'success' | 'error';
  data: {
    messages: Message[];
    group?: {
      _id: string;
      name: string;
      members: any[];
    };
  };
  message?: string;
}

export type ChatResponse = MessageResponse | MessagesResponse;

// Dummy component to satisfy expo-router's default export requirement
export default function Chat() {
  return null;
}
