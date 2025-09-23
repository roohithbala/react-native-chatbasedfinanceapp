export interface GroupExpenseParticipant {
  userId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: Date;
}

export interface GroupExpense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  groupId?: string; // Made optional to support direct chat expenses
  paidBy: string;
  participants: GroupExpenseParticipant[];
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupExpenseStats {
  overview: {
    totalAmount: number;
    count: number;
    settled: number;
    pending: number;
  };
  byCategory: {
    _id: string;
    amount: number;
    count: number;
  }[];
  byParticipant: {
    _id: string;
    amount: number;
    count: number;
    paid: number;
    pending: number;
  }[];
}

// Dummy component to satisfy Expo Router's default export requirement
export default function GroupExpense() {
  return null;
}
