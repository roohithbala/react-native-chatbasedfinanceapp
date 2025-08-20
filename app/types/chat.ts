export interface User {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
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
  type: 'text' | 'image' | 'file' | 'system' | 'command';
  status: 'sent' | 'delivered' | 'read' | 'error';
  readBy: ReadReceipt[];
  commandType?: 'split' | 'expense' | 'budget' | 'predict' | 'summary';
  commandData?: CommandData;
  systemData?: SystemData;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'audio';
  mediaSize?: number;
  mentions?: string[];
  reactions?: Reaction[];
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
