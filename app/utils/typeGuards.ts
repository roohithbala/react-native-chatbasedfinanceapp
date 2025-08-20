import { MessageResponse, MessagesResponse } from '../types/chat';

export function isMessageResponse(response: any): response is MessageResponse {
  return (
    response?.status === 'success' &&
    response?.data?.message &&
    typeof response.data.message === 'object' &&
    'text' in response.data.message &&
    'user' in response.data.message &&
    '_id' in response.data.message
  );
}

export function isMessagesResponse(response: any): response is MessagesResponse {
  return (
    response?.status === 'success' &&
    response?.data?.messages &&
    Array.isArray(response?.data?.messages) &&
    response.data.messages.every((msg: any) =>
      msg &&
      typeof msg === 'object' &&
      'text' in msg &&
      'user' in msg &&
      '_id' in msg
    )
  );
}

// Dummy component to satisfy expo-router's default export requirement
export default function TypeGuards() {
  return null;
}
