import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { usersAPI } from '../lib/services/api';

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  email: string;
}

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If query is empty, clear results and show recent chats
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Debounce search - wait 300ms before searching
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await usersAPI.searchUsers(query);
        // Ensure results is always an array
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]); // Set empty array on error
        Alert.alert('Search Error', 'Unable to search users. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    setSearchTimeout(timeout as any);
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
  };
};