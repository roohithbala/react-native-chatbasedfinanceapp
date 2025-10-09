import { useEffect, useState } from 'react';
import { directMessagesAPI } from '@/lib/services/api';
import { useFinanceStore } from '@/lib/store/financeStore';

export function useDirectChat(userId: string | undefined) {
  const { currentUser } = useFinanceStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any | null>(null);

  const [newMessage, setNewMessage] = useState('');

  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    // socket listeners are set in the original file; keep minimal here
    try {
      const socketService = require('../../../lib/services/socketService').socketService;
      const handleSplitBillUpdate = (data: any) => {
        if (data.type === 'payment-made' || data.type === 'bill-rejected') {
          setMessages(prev => prev.map(msg => {
            if (msg.splitBillData && msg.splitBillData._id === data.splitBillId) {
              const updatedSplitBillData = {
                ...msg.splitBillData,
                participants: data.splitBill.participants.map((p: any) => ({
                  userId: { _id: p.userId, name: p.name, username: p.name.toLowerCase().replace(/\s+/g, '') },
                  amount: p.amount,
                  isPaid: p.isPaid,
                  isRejected: p.isRejected || false
                }))
              };
              return { ...msg, splitBillData: updatedSplitBillData };
            }
            return msg;
          }));
        }
      };

      const setupSocketListeners = () => {
        socketService.onSplitBillUpdate(handleSplitBillUpdate);
      };

      socketService.connect().then(setupSocketListeners).catch((e: any) => console.warn('Socket connect failed', e));
      socketService.onConnectionStatusChange((status: any) => { if (status.isConnected) setupSocketListeners(); });

      return () => {
        socketService.removeAllListeners();
      };
    } catch (error) {
      // ignore if socket service not available in tests
      console.warn('Socket service not available in hook', error);
    }
  }, [userId]);

  const loadMessages = async () => {
    if (!userId) return;
    try {
      const history = await directMessagesAPI.getChatHistory(userId);
      setMessages(history);
      if (history.length > 0) {
        const firstMessage = history[0];
        let otherUserInfo: any = null;
        if (firstMessage.sender && firstMessage.sender._id === currentUser?._id) otherUserInfo = firstMessage.receiver;
        else if (firstMessage.receiver && firstMessage.receiver._id === currentUser?._id) otherUserInfo = firstMessage.sender;
        else otherUserInfo = firstMessage.sender || firstMessage.receiver;

        if (otherUserInfo && otherUserInfo.name && otherUserInfo.username && otherUserInfo._id) {
          setOtherUser({ _id: otherUserInfo._id, name: otherUserInfo.name, username: otherUserInfo.username, avatar: otherUserInfo.avatar || (otherUserInfo.name ? otherUserInfo.name.charAt(0).toUpperCase() : 'U') });
        }
      }
      setIsLoading(false);
      await directMessagesAPI.markAsRead(userId);
    } catch (error) {
      console.error('Error loading messages (hook):', error);
      setIsLoading(false);
    }
  };

  const handleSend = async (toUserId: string | undefined, text: string) => {
    if (!text || !toUserId) return;
    try {
      const commandData = require('../components/..//../components/CommandParser').CommandParser?.parse ? require('../../components/CommandParser').CommandParser.parse(text) : null;
      // keep simple: send as regular message
      const sent = await directMessagesAPI.sendMessage(toUserId, text);
      setMessages(prev => [...prev, sent]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message (hook):', error);
    }
  };

  const performSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    const filtered = messages.filter(m => (m.text || '').toLowerCase().includes(query.toLowerCase()));
    setSearchResults(filtered);
  };

  const onRetryImage = (id: string) => setImageLoadErrors(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; });

  return {
    messages,
    isLoading,
    otherUser,
    newMessage,
    setNewMessage,
    selectedMedia,
    setSelectedMedia,
    showSearchModal,
    setShowSearchModal,
    searchQuery,
    setSearchQuery,
    searchResults,
    performSearch,
    imageLoadErrors,
    setImageLoadErrors,
    loadMessages,
    handleSend,
    onRetryImage,
  };
}

export default useDirectChat;
