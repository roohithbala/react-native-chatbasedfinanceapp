import React from 'react';
import SearchBar from '@/app/components/SearchBar';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

export default function ChatsSearch({ value, onChangeText, placeholder }: Props) {
  return <SearchBar value={value} onChangeText={onChangeText} placeholder={placeholder} />;
}
