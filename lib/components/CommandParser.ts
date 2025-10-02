interface ParsedCommand {
  type: 'split' | 'expense' | 'predict' | 'summary' | 'unknown';
  data: any;
}

export class CommandParser {
  static parse(message: string): ParsedCommand {
    // Only process messages that start with command prefixes followed by space
    const trimmedMessage = message.trim();
    
    // Be extremely strict - only process if it starts with exact command prefixes
    if (trimmedMessage.startsWith('@split ')) {
      return this.parseSplitCommand(trimmedMessage);
    } else if (trimmedMessage.startsWith('@addexpense ')) {
      return this.parseExpenseCommand(trimmedMessage);
    } else if (trimmedMessage === '@predict') {
      return { type: 'predict', data: {} };
    } else if (trimmedMessage === '@summary') {
      return { type: 'summary', data: {} };
    }
    
    // For ANY other message, return unknown - be very strict
    console.log('Message does not start with valid command prefix:', trimmedMessage);
    return { type: 'unknown', data: {} };
  }

  private static parseSplitCommand(message: string): ParsedCommand {
    // Parse: @split @username category amount or @split @username amount
    const parts = message.trim().split(/\s+/);
    
    console.log('Parsing split command:', message);
    console.log('Parts:', parts);
    
    if (parts.length < 3 || parts.length > 4) {
      console.log('Invalid number of parts for split command - must be 3 or 4 parts');
      return { type: 'unknown', data: {} };
    }

    // Check if first part after @split is a username mention
    const firstPart = parts[1];
    if (!firstPart.startsWith('@') || firstPart.length <= 1) {
      console.log('First part is not a valid username mention:', firstPart);
      return { type: 'unknown', data: {} };
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
      const amountStr = parts[3];
      amount = parseFloat(amountStr);
      console.log('4-part format - Category:', category, 'Amount string:', amountStr, 'Parsed amount:', amount);
    } else if (parts.length === 3) {
      // Format: @split @username amount
      const amountStr = parts[2];
      amount = parseFloat(amountStr);
      console.log('3-part format - Amount string:', amountStr, 'Parsed amount:', amount);
    } else {
      console.log('Invalid number of parts for split command');
      return { type: 'unknown', data: {} };
    }

    console.log('Parsed amount:', amount, 'isNaN:', isNaN(amount), 'amount <= 0:', amount <= 0);

    // Validate amount - must be a valid positive number
    if (isNaN(amount) || amount <= 0 || !isFinite(amount)) {
      console.log('Amount validation failed - not a valid positive number');
      return { type: 'unknown', data: {} };
    }

    // Validate username - must not be empty and contain only valid characters
    if (!username || !/^[a-zA-Z0-9_]+$/.test(username)) {
      console.log('Username validation failed - invalid username format');
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
    // This is more strict now - requires @split followed by description, amount, and at least one @mention
    const parts = message.split(' ');
    if (parts.length < 4) { // Need at least @split, description, amount, and one @mention
      return { type: 'unknown', data: {} };
    }

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

    // Validate that we have at least a description, valid amount, and at least one participant
    if (!description.trim() || amount <= 0 || participants.length === 0) {
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
    
    if (parts.length < 3) {
      console.log('Not enough parts for expense command - need at least description and amount');
      return { type: 'unknown', data: {} };
    }
    
    const description = parts[1] || 'Expense';

    // Extract amount - support multiple currency formats and plain numbers
    const amountMatch = message.match(/(?:[\$₹£€¥]\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[\$₹£€¥])?/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Extract category - support both "category:" and "cat:" prefixes
    const categoryMatch = message.match(/(?:category|cat):\s*(\w+)/i);
    const category = categoryMatch ? categoryMatch[1] : 'Other';

    // Validate that we have at least a description and amount
    if (!description.trim() || amount <= 0 || !isFinite(amount)) {
      console.log('Expense validation failed - invalid description or amount');
      return { type: 'unknown', data: {} };
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