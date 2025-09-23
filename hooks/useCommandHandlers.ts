import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinanceStore } from '@/lib/store/financeStore';
import { API_BASE_URL } from '../lib/services/api';

export const useCommandHandlers = (groupId: string) => {
  const processCommand = async (commandData: any, originalMessage: string) => {
    try {
      switch (commandData.type) {
        case 'split':
          await handleSplitBillCommand(commandData);
          break;
        case 'expense':
          await handleExpenseCommand(commandData);
          break;
        case 'predict':
          await handlePredictCommand();
          break;
        case 'summary':
          await handleSummaryCommand();
          break;
        default:
          // Send as regular message if command not recognized
          console.log('Unrecognized command, sending as regular message');
      }
    } catch (error) {
      console.error('Error processing command:', error);
    }
  };

  const handleSplitBillCommand = async (data: any) => {
    console.log('handleSplitBillCommand called with data:', data);
    console.log('Data type checks:', {
      data: !!data,
      dataAmount: !!data?.amount,
      dataAmountValue: data?.amount,
      dataAmountType: typeof data?.amount,
      amountGreaterThanZero: data?.amount > 0
    });

    try {
      if (!data || !data.amount || data.amount <= 0) {
        throw new Error('Invalid amount for split bill');
      }

      const { currentUser } = useFinanceStore.getState();
      if (!currentUser?._id) {
        throw new Error('User not authenticated');
      }

      if (!groupId) {
        throw new Error('No group selected');
      }

      // Handle both old and new command formats
      let participants = [];
      let description = data.description || 'Split Bill';

      if (data.username) {
        // Old format: @split description $amount @username
        participants = [{ userId: data.username, name: data.username }];
      } else if (data.participants && data.participants.length > 0) {
        // New format: @split description $amount @user1 @user2
        const { groups } = useFinanceStore.getState();
        const currentGroup = groups.find(g => g._id === groupId);

        participants = data.participants.map((username: string) => {
          // Find user by username in group members
          const member = currentGroup?.members?.find((m: any) =>
            m.userId?.username === username.replace('@', '')
          );
          return member ? {
            userId: member.userId._id,
            name: member.userId.name || username
          } : { userId: username, name: username };
        });
      } else {
        // Default: split with all group members except current user
        const { groups } = useFinanceStore.getState();
        const currentGroup = groups.find(g => g._id === groupId);

        participants = currentGroup?.members
          ?.filter((member: any) => member?.userId && member.userId._id !== currentUser._id)
          ?.map((member: any) => ({
            userId: member.userId._id,
            name: member.userId.name || 'Unknown'
          })) || [];
      }

      if (participants.length === 0) {
        throw new Error('No participants found for split bill');
      }

      // Create the split bill
      const splitBillData = {
        description: description,
        totalAmount: data.amount,
        groupId: groupId,
        participants: participants,
        splitType: 'equal' as const,
        category: data.category || 'Split',
        currency: 'INR'
      };

      console.log('Creating split bill with data:', splitBillData);
      const result = await useFinanceStore.getState().createSplitBill(splitBillData);

      // Create individual expenses for each participant
      for (const participant of participants) {
        const expenseData = {
          description: `${description} (split with ${participants.length} people)`,
          amount: data.amount / participants.length,
          category: data.category || 'Split',
          userId: participant.userId,
          groupId: groupId
        };

        await useFinanceStore.getState().addExpense(expenseData);
      }

      // Send confirmation message
      const participantNames = participants
        .filter((p: any) => p.userId !== currentUser._id)
        .map((p: any) => p.name)
        .join(', ');

      const confirmationMessage = `✅ Split bill created!\n📝 ${description}\n💰 Total: ₹${(data.amount || 0).toFixed(2)}\n🤝 Each pays: ₹${((data.amount || 0) / participants.length).toFixed(2)}\n👥 Participants: ${participantNames || 'All group members'}\n💾 Data saved to database`;

      // Note: This will be called by the parent component
      return confirmationMessage;
    } catch (error: any) {
      console.error('Error creating split bill:', error);
      Alert.alert('Error', error.message || 'Failed to create split bill');
      throw error;
    }
  };

  const handleExpenseCommand = async (data: any) => {
    try {
      if (!data || !data.amount || data.amount <= 0) {
        throw new Error('Invalid amount for expense');
      }

      const { currentUser } = useFinanceStore.getState();
      if (!currentUser?._id) {
        throw new Error('User not authenticated');
      }

      // Create expense data
      const expenseData = {
        description: data.description,
        amount: data.amount,
        category: data.category,
        userId: currentUser._id,
        groupId: groupId || undefined
      };

      // Add the expense
      const { addExpense } = useFinanceStore.getState();
      await addExpense(expenseData);

      // Send confirmation message
      const confirmationMessage = `✅ Expense added!\n📝 ${data.description}\n💰 Amount: ₹${(data.amount || 0).toFixed(2)}\n📂 Category: ${data.category}`;

      return confirmationMessage;
    } catch (error: any) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
      throw error;
    }
  };

  const handlePredictCommand = async () => {
    try {
      console.log('Handling @predict command');
      const response = await fetch(`${API_BASE_URL}/ai/predict`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get predictions');
      }

      const data = await response.json();
      console.log('AI prediction response:', data);

      // Create AI response message
      const aiMessage = `🤖 AI Predictions:\n\n${data.predictions?.map((p: any) =>
        `• ${p.message}${p.suggestion ? `\n  💡 ${p.suggestion}` : ''}`
      ).join('\n\n') || 'No predictions available'}`;

      return aiMessage;
    } catch (error) {
      console.error('Error handling predict command:', error);
      Alert.alert('Error', 'Failed to get AI predictions. Please try again.');
      throw error;
    }
  };

  const handleSummaryCommand = async () => {
    try {
      console.log('Handling @summary command');
      const response = await fetch(`${API_BASE_URL}/ai/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get summary');
      }

      const data = await response.json();
      console.log('AI summary response:', data);

      // Create AI response message
      const aiMessage = `📊 Financial Summary:\n\n💰 Total Expenses: ₹${data.totalExpenses?.toFixed(2) || '0.00'}\n💵 Personal: ₹${data.totalPersonalExpenses?.toFixed(2) || '0.00'}\n🤝 Split Bills: ₹${data.totalSplitExpenses?.toFixed(2) || '0.00'}\n\n📈 Expense Count: ${data.expenseCount || 0}\n🔄 Split Bills: ${data.splitBillCount || 0}\n\n📂 Top Categories:\n${Object.entries(data.categoryBreakdown || {}).map(([cat, amount]: [string, any]) =>
        `• ${cat}: ₹${Number(amount).toFixed(2)}`
      ).join('\n') || 'No category data'}`;

      return aiMessage;
    } catch (error) {
      console.error('Error handling summary command:', error);
      Alert.alert('Error', 'Failed to get financial summary. Please try again.');
      throw error;
    }
  };

  return {
    processCommand,
    handleSplitBillCommand,
    handleExpenseCommand,
    handlePredictCommand,
    handleSummaryCommand
  };
};