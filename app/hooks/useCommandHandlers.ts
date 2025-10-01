import { useCallback } from 'react';
import { splitBillAPI } from '../../lib/services/splitBillAPI';
import PaymentsAPI from '../../lib/services/paymentsAPI';

interface CommandResult {
  type: 'success' | 'error' | 'info';
  message: string;
  data?: any;
}

export const useCommandHandlers = (groupId: string, currentUser: any) => {
  const handleSplitBillCommand = useCallback(async (commandText: string): Promise<CommandResult> => {
    try {
      // Parse command like "/split 500 @user1 @user2 for dinner"
      const splitRegex = /^\/split\s+(\d+(?:\.\d{2})?)\s+(.+)$/;
      const match = commandText.match(splitRegex);

      if (!match) {
        return {
          type: 'error',
          message: 'Invalid split command format. Use: /split <amount> <description> [@users]'
        };
      }

      const amount = parseFloat(match[1]);
      const description = match[2];

      if (isNaN(amount) || amount <= 0) {
        return {
          type: 'error',
          message: 'Invalid amount. Please provide a positive number.'
        };
      }

      // For now, create a basic split bill
      // In a real implementation, you'd parse mentioned users
      const splitBillData = {
        totalAmount: amount,
        description,
        participants: [], // Would be populated from mentions
        groupId,
      };

      const response = await splitBillAPI.createSplitBill(splitBillData);

      return {
        type: 'success',
        message: `Split bill created for ₹${amount}: ${description}`,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating split bill:', error);
      return {
        type: 'error',
        message: 'Failed to create split bill. Please try again.'
      };
    }
  }, [groupId]);

  const handlePaymentCommand = useCallback(async (commandText: string): Promise<CommandResult> => {
    try {
      // Parse command like "/pay @user 500 for lunch"
      const payRegex = /^\/pay\s+@(\w+)\s+(\d+(?:\.\d{2})?)(?:\s+(.+))?$/;
      const match = commandText.match(payRegex);

      if (!match) {
        return {
          type: 'error',
          message: 'Invalid pay command format. Use: /pay @username <amount> [description]'
        };
      }

      const username = match[1];
      const amount = parseFloat(match[2]);
      const description = match[3] || 'Payment';

      if (isNaN(amount) || amount <= 0) {
        return {
          type: 'error',
          message: 'Invalid amount. Please provide a positive number.'
        };
      }

      // In a real implementation, you'd resolve the username to user ID
      // For now, return a placeholder
      return {
        type: 'info',
        message: `Payment command received: Pay @${username} ₹${amount} for ${description}. Payment processing not yet implemented.`
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        type: 'error',
        message: 'Failed to process payment. Please try again.'
      };
    }
  }, []);

  const handleBudgetCommand = useCallback(async (commandText: string): Promise<CommandResult> => {
    try {
      // Parse command like "/budget food 2000" or "/budget check"
      const budgetRegex = /^\/budget\s+(?:(\w+)\s+(\d+(?:\.\d{2})?)|(check))$/;
      const match = commandText.match(budgetRegex);

      if (!match) {
        return {
          type: 'error',
          message: 'Invalid budget command format. Use: /budget <category> <amount> or /budget check'
        };
      }

      if (match[3] === 'check') {
        // Check budget status
        return {
          type: 'info',
          message: 'Budget checking not yet implemented. Use /budget <category> <amount> to set budgets.'
        };
      }

      const category = match[1];
      const amount = parseFloat(match[2]);

      if (isNaN(amount) || amount <= 0) {
        return {
          type: 'error',
          message: 'Invalid amount. Please provide a positive number.'
        };
      }

      // In a real implementation, you'd call the budgets API
      return {
        type: 'success',
        message: `Budget set for ${category}: ₹${amount} per month. Budget management not yet fully implemented.`
      };
    } catch (error) {
      console.error('Error setting budget:', error);
      return {
        type: 'error',
        message: 'Failed to set budget. Please try again.'
      };
    }
  }, []);

  const handleHelpCommand = useCallback((): CommandResult => {
    return {
      type: 'info',
      message: `Available commands:
• /split <amount> <description> - Create a split bill
• /pay @username <amount> [desc] - Record a payment
• /budget <category> <amount> - Set monthly budget
• /budget check - Check budget status
• /help - Show this help message`
    };
  }, []);

  const processCommand = useCallback(async (commandText: string): Promise<CommandResult> => {
    const trimmedCommand = commandText.trim().toLowerCase();

    if (trimmedCommand.startsWith('/split')) {
      return await handleSplitBillCommand(commandText);
    } else if (trimmedCommand.startsWith('/pay')) {
      return await handlePaymentCommand(commandText);
    } else if (trimmedCommand.startsWith('/budget')) {
      return await handleBudgetCommand(commandText);
    } else if (trimmedCommand.startsWith('/help')) {
      return handleHelpCommand();
    } else {
      return {
        type: 'error',
        message: `Unknown command: ${commandText}. Type /help for available commands.`
      };
    }
  }, [handleSplitBillCommand, handlePaymentCommand, handleBudgetCommand, handleHelpCommand]);

  return {
    processCommand,
    handleSplitBillCommand,
    handlePaymentCommand,
    handleBudgetCommand,
    handleHelpCommand,
  };
};

export default useCommandHandlers;