interface ParsedCommand {
  type: 'split' | 'expense' | 'predict' | 'summary' | 'unknown';
  data: any;
}

export class CommandParser {
  static parse(message: string): ParsedCommand {
    const text = message.toLowerCase().trim();
    
    if (text.startsWith('@split')) {
      return this.parseSplitCommand(message);
    } else if (text.startsWith('@addexpense')) {
      return this.parseExpenseCommand(message);
    } else if (text.startsWith('@predict')) {
      return { type: 'predict', data: {} };
    } else if (text.startsWith('@summary')) {
      return { type: 'summary', data: {} };
    }
    
    return { type: 'unknown', data: {} };
  }

  private static parseSplitCommand(message: string): ParsedCommand {
    // Parse: @split Dinner $120 @alice @bob or @split Dinner ₹120 @alice @bob or @split Dinner 120 @alice @bob
    const parts = message.split(' ');
    const description = parts[1] || 'Expense';

    // Extract amount - support multiple currency formats and plain numbers
    // Handle both formats: $120, ₹120, 120₹, 120, 120.50, $120.50, ₹120.50
    const amountMatch = message.match(/(?:[\$₹£€¥]\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[\$₹£€¥])?/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Extract mentions - find all @mentions that are not @split
    const mentions = message.match(/@\w+/g) || [];
    const participants = mentions
      .filter(mention => mention.toLowerCase() !== '@split') // Exclude @split command
      .map(m => m.replace('@', '')); // Remove @ symbol

    // Check for percentage splits
    const percentageMatch = message.match(/(\d+)%/g);
    let splitType = 'equal';
    let splitData = {};

    if (percentageMatch && percentageMatch.length === participants.length + 1) {
      splitType = 'percentage';
      // Parse percentage splits
    }

    // Validate that we have at least a description and amount
    if (!description.trim() || amount <= 0) {
      return {
        type: 'unknown',
        data: {}
      };
    }

    return {
      type: 'split',
      data: {
        description,
        amount,
        participants,
        splitType,
        splitData,
      },
    };
  }

  private static parseExpenseCommand(message: string): ParsedCommand {
    // Parse: @addexpense Coffee $5 category:Food or @addexpense Coffee ₹5 category:Food or @addexpense Coffee 5 category:Food
    const parts = message.split(' ');
    const description = parts[1] || 'Expense';

    // Extract amount - support multiple currency formats and plain numbers
    const amountMatch = message.match(/(?:[\$₹£€¥]\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[\$₹£€¥])?/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Extract category - support both "category:" and "cat:" prefixes
    const categoryMatch = message.match(/(?:category|cat):\s*(\w+)/i);
    const category = categoryMatch ? categoryMatch[1] : 'Other';

    // Validate that we have at least a description and amount
    if (!description.trim() || amount <= 0) {
      return {
        type: 'unknown',
        data: {}
      };
    }

    return {
      type: 'expense',
      data: {
        description,
        amount,
        category,
      },
    };
  }
}