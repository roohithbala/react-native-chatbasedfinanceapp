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
    // Parse: @split @username category amount or @split @username amount
    const parts = message.trim().split(/\s+/);
    
    console.log('Parsing split command:', message);
    console.log('Parts:', parts);
    
    if (parts.length < 3) {
      console.log('Not enough parts for split command');
      return { type: 'unknown', data: {} };
    }

    // Check if first part after @split is a username mention
    const firstPart = parts[1];
    if (!firstPart.startsWith('@')) {
      console.log('First part is not a username mention, falling back to legacy parser');
      // Fallback to old format: @split description amount @users...
      return this.parseSplitCommandLegacy(message);
    }

    const username = firstPart.substring(1); // Remove @ symbol
    let category = 'Other';
    let amount = 0;

    console.log('Username:', username);
    console.log('Parts length:', parts.length);

    // Check if we have category and amount or just amount
    if (parts.length === 4) {
      // Format: @split @username category amount
      category = parts[2];
      amount = parseFloat(parts[3]);
      console.log('4-part format - Category:', category, 'Amount:', amount);
    } else if (parts.length === 3) {
      // Format: @split @username amount
      amount = parseFloat(parts[2]);
      console.log('3-part format - Amount:', amount);
    } else {
      console.log('Invalid number of parts for split command');
      return { type: 'unknown', data: {} };
    }

    console.log('Parsed amount:', amount, 'isNaN:', isNaN(amount), 'amount <= 0:', amount <= 0);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      console.log('Amount validation failed');
      return { type: 'unknown', data: {} };
    }

    const result: ParsedCommand = {
      type: 'split',
      data: {
        username,
        description: `${category} with ${username}`,
        amount,
        category,
        participants: [username],
        splitType: 'equal',
      },
    };

    console.log('Parsed split command result:', result);
    return result;
  }

  private static parseSplitCommandLegacy(message: string): ParsedCommand {
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