import { useFinanceStore } from '@/lib/store/financeStore';
import { CommandParser } from '@/lib/components/CommandParser';
import { Alert } from 'react-native';

interface UseDirectChatCommandsProps {
  currentUser: any;
  otherUser: any;
  userId: string;
  sendMessage: (userId: string, message: string, isDirectChat: boolean, messageType?: string, splitBillData?: any) => Promise<void>;
  onShowPaymentOptions?: (splitBill: any, userShare: number) => void;
  onSplitBillCreated?: (splitBill: any) => void;
}

export const useDirectChatCommands = ({
  currentUser,
  otherUser,
  userId,
  sendMessage,
  onShowPaymentOptions,
  onSplitBillCreated,
}: UseDirectChatCommandsProps) => {
  const handleSendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Check if the message is a command
    const commandData = CommandParser.parse(trimmedMessage);

    if (commandData && commandData.type === 'split') {
      // Handle split command for direct chats - create bill directly
      try {
        // Create the split bill directly
        const createdBill = await createSplitBillFromCommand(commandData);

        // Format the split bill data properly for the message
        const formattedSplitBillData = {
          _id: createdBill._id,
          description: createdBill.description,
          totalAmount: createdBill.totalAmount,
          createdBy: {
            _id: currentUser._id,
            name: currentUser.name || currentUser.username,
            avatar: currentUser.avatar
          },
          participants: createdBill.participants.map((p: any) => ({
            userId: typeof p.userId === 'object' ? p.userId._id || p.userId : p.userId,
            amount: p.amount,
            isPaid: p.isPaid || false,
            isRejected: p.isRejected || false,
            paidAt: p.paidAt,
            rejectedAt: p.rejectedAt
          })),
          splitType: createdBill.splitType,
          category: createdBill.category,
          isSettled: createdBill.isSettled || false
        };

        console.log('📤 Sending split bill message:', {
          splitBillId: formattedSplitBillData._id,
          createdBy: formattedSplitBillData.createdBy,
          participants: formattedSplitBillData.participants
        });

        // Send a split bill request message with properly formatted data
        await sendMessage(userId, `✅ Split bill created: ${commandData.data.description}`, true, 'split_bill', formattedSplitBillData);

        console.log('Direct chat split command processed:', commandData.data);
      } catch (error) {
        console.error('Error processing split command:', error);
        Alert.alert('Error', 'Failed to create split bill. Please try again.');
      }
    } else if (commandData && commandData.type === 'expense') {
      // Handle expense command
      try {
        // Send the command message
        await sendMessage(userId, trimmedMessage, true);

        // Process the expense command
        if (!currentUser?._id) {
          console.error('No current user for expense command');
          return;
        }

        const expenseData = {
          description: commandData.data.description,
          amount: commandData.data.amount,
          category: commandData.data.category,
          userId: currentUser._id,
          groupId: undefined // No group for direct chats
        };

        const { addExpense } = useFinanceStore.getState();
        await addExpense(expenseData);
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    } else if (commandData && commandData.type === 'predict') {
      // Handle predict command
      try {
        // Send the command message
        await sendMessage(userId, trimmedMessage, true);

        // Predict command is handled by backend, but we can show a local response
        console.log('Predict command in direct chat');
      } catch (error) {
        console.error('Error handling predict command:', error);
      }
    } else {
      // Send as regular message
      await sendMessage(userId, trimmedMessage, true);
    }
  };

  const createSplitBillFromCommand = async (commandData: any) => {
    try {
      if (!currentUser?._id || !otherUser?._id) {
        throw new Error('User information not available');
      }

      // For direct chats, creator has already paid - only the other user needs to pay their share
      const totalAmount = commandData.data.amount;
      const otherUserShare = totalAmount; // Other user pays the full amount to the creator

      const splitBillData = {
        description: commandData.data.description,
        totalAmount: totalAmount,
        participants: [
          {
            userId: otherUser._id, // Only the other user is a participant who needs to pay
            amount: otherUserShare,
          }
        ],
        splitType: 'equal' as const,
        category: commandData.data.category || 'Other',
        currency: 'INR',
        // No groupId for direct chats
      };

      console.log('Creating split bill from command:', splitBillData);

      // Create the split bill
      const { createSplitBill } = useFinanceStore.getState();
      const createdBill = await createSplitBill(splitBillData);

      console.log('Split bill created successfully:', createdBill);

      // Notify that split bill was created
      if (onSplitBillCreated) {
        onSplitBillCreated(createdBill);
      }

      // Don't show payment options for the creator - they already paid
      // The payment options will be shown in the chat message for the participant

      // Return the created bill so it can be sent in the message
      return createdBill;
    } catch (error: any) {
      console.error('Error creating split bill from command:', error);
      throw error;
    }
  };

  return {
    handleSendMessage,
  };
};;