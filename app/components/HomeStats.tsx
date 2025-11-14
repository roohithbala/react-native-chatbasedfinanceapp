import React from 'react';
import { View } from 'react-native';
import HomeQuickStats from '@/app/components/HomeQuickStats';

type Props = {
  totalExpensesThisMonth: number;
  totalOwed: number;
  budgetRemaining?: number;
  netPosition?: number;
  lastMonthExpenses?: number;
};

export default function HomeStats({ totalExpensesThisMonth, totalOwed, budgetRemaining, netPosition, lastMonthExpenses }: Props) {
  return (
    <View>
      <HomeQuickStats 
        totalExpensesThisMonth={totalExpensesThisMonth} 
        totalOwed={totalOwed}
        budgetRemaining={budgetRemaining}
        netPosition={netPosition}
        lastMonthExpenses={lastMonthExpenses}
      />
    </View>
  );
}
