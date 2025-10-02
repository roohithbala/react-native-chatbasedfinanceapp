import { useState, useEffect } from 'react';

interface ChatPreview {
  _id: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
}

export const useSearch = (recentChats: ChatPreview[] = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Filter recent chats based on search query
    const filtered = recentChats.filter(chat =>
      chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setSearchResults(filtered);
    setIsSearching(false);
  }, [searchQuery, recentChats]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
  };
};