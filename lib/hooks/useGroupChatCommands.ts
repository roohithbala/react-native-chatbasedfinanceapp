import { useFinanceStore } from '@/lib/store/financeStore';
import { CommandParser } from '@/lib/components/CommandParser';

interface UseGroupChatCommandsProps {
  currentUser: any;
  validGroupId?: string | null;
  sendMessage: (message: string) => Promise<void>;
}

export const useGroupChatCommands = ({
  currentUser,
  validGroupId,
  sendMessage,
}: UseGroupChatCommandsProps) => {
  const handleSendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Check if the message is a command
    const commandData = CommandParser.parse(trimmedMessage);

    if (commandData && commandData.type !== 'unknown' &&
        (trimmedMessage.startsWith('@addexpense ') ||
         trimmedMessage.startsWith('@predict'))) {
      // Send the command message
      await sendMessage(trimmedMessage);

      // Process the command on frontend for addexpense and predict
      if (commandData.type === 'expense') {
        // Handle add expense command
        try {
          if (!currentUser?._id) {
            console.error('No current user for expense command');
            return;
          }

          const expenseData = {
            description: commandData.data.description,
            amount: commandData.data.amount,
            category: commandData.data.category,
            userId: currentUser._id,
            groupId: validGroupId || undefined
          };

          const { addExpense } = useFinanceStore.getState();
          await addExpense(expenseData);
        } catch (error) {
          console.error('Error adding expense:', error);
        }
      } else if (commandData.type === 'predict') {
        // Predict command is handled by backend
      }
    } else if (commandData && (commandData.type === 'split' || commandData.type === 'summary')) {
      // For @split and @summary, just send the message and let backend handle it
      await sendMessage(trimmedMessage);
    } else {
      // Send as regular message
      await sendMessage(trimmedMessage);
    }
  };

  return {
    handleSendMessage,
  };
};