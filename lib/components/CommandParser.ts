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
    // Parse: @split Dinner $120 @alice @bob
    const parts = message.split(' ');
    const description = parts[1] || 'Expense';
    
    // Extract amount
    const amountMatch = message.match(/\$(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    // Extract mentions
    const mentions = message.match(/@\w+/g) || [];
    const participants = mentions.slice(1).map(m => m.replace('@', '')); // Skip first @split
    
    // Check for percentage splits
    const percentageMatch = message.match(/(\d+)%/g);
    let splitType = 'equal';
    let splitData = {};
    
    if (percentageMatch && percentageMatch.length === participants.length + 1) {
      splitType = 'percentage';
      // Parse percentage splits
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
    // Parse: @addexpense Coffee $5 category:Food
    const parts = message.split(' ');
    const description = parts[1] || 'Expense';
    
    // Extract amount
    const amountMatch = message.match(/\$(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    // Extract category
    const categoryMatch = message.match(/category:(\w+)/);
    const category = categoryMatch ? categoryMatch[1] : 'Other';

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