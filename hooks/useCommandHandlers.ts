import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinanceStore } from '@/lib/store/financeStore';
import { API_BASE_URL } from '../lib/services/api';

export const useCommandHandlers = (groupId: string) => {
  const processCommand = async (commandData: any, originalMessage: string) => {
    try {
      switch (commandData.type) {
        case 'expense':
          await handleExpenseCommand(commandData);
          break;
        case 'predict':
          await handlePredictCommand();
          break;
        default:
          // Send as regular message if command not recognized
          console.log('Unrecognized command, sending as regular message');
      }
    } catch (error) {
      console.error('Error processing command:', error);
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
      const confirmationMessage = `✅ Expense added!\n📝 ${data.description}\n💰 Amount: $${(data.amount || 0).toFixed(2)}\n📂 Category: ${data.category}`;

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

  return {
    processCommand,
    handleExpenseCommand,
    handlePredictCommand
  };
};