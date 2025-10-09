import React from 'react';
import ExpensesHeader from '@/app/components/ExpensesHeader';

// Use a permissive prop type to remain compatible with existing ExpensesHeader props
type Props = any;

export default function ExpensesHeaderWrapper(props: Props) {
  return <ExpensesHeader {...props} />;
}
