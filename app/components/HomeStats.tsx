import React from 'react';
import { View } from 'react-native';
import HomeQuickStats from '@/app/components/HomeQuickStats';

type Props = {
  totalExpensesThisMonth: number;
  totalOwed: number;
};

export default function HomeStats({ totalExpensesThisMonth, totalOwed }: Props) {
  return (
    <View>
      <HomeQuickStats totalExpensesThisMonth={totalExpensesThisMonth} totalOwed={totalOwed} />
    </View>
  );
}
