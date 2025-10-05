interface ParsedCommand {
  type: 'split' | 'expense' | 'predict' | 'summary' | 'unknown';
  data: any;
}

export class CommandParser {
  static parse(message: string): ParsedCommand {
    // Only process messages that start with @ and are likely commands
    const trimmed = message.trim();

    // Must start with @ to be considered a command
    if (!trimmed.startsWith('@')) {
      console.log('CommandParser: Message does not start with @, treating as regular message');
      return { type: 'unknown', data: {} };
    }

    // Additional safeguard: if message is very long (>100 chars), it's likely not a command
    if (trimmed.length > 100) {
      console.log('CommandParser: Message too long to be a command, treating as regular message');
      return { type: 'unknown', data: {} };
    }

    // Additional safeguard: if message contains multiple @ symbols, it's likely not a command
    const atSymbolCount = (trimmed.match(/@/g) || []).length;
    if (atSymbolCount > 2) {
      console.log('CommandParser: Message contains multiple @ symbols, treating as regular message');
      return { type: 'unknown', data: {} };
    }

    const text = trimmed.toLowerCase();

    if (text.startsWith('@split ')) {
      console.log('CommandParser: Detected @split command, parsing...');
      return this.parseSplitCommand(trimmed);
    } else if (text.startsWith('@addexpense ')) {
      console.log('CommandParser: Detected @addexpense command, parsing...');
      return this.parseExpenseCommand(trimmed);
    } else if (text === '@predict') {
      console.log('CommandParser: Detected @predict command');
      return { type: 'predict', data: {} };
    } else if (text === '@summary') {
      console.log('CommandParser: Detected @summary command');
      return { type: 'summary', data: {} };
    }

    // Message starts with @ but is not a recognized command
    console.log('CommandParser: Message starts with @ but is not a recognized command:', trimmed);
    return { type: 'unknown', data: {} };
  }

  private static parseSplitCommand(message: string): ParsedCommand {
    // Parse format: @split description $amount @user1 @user2 ...
    // Examples: @split dinner $500 @john @mary, @split movie $200 @all

    const trimmed = message.trim();

    // Must start with '@split ' (with space)
    if (!trimmed.toLowerCase().startsWith('@split ')) {
      console.log('Message does not start with @split followed by space');
      return { type: 'unknown', data: {} };
    }

    // Remove @split and trim
    const content = trimmed.substring(7).trim();

    // Find the $amount
    const dollarIndex = content.indexOf('$');
    if (dollarIndex === -1) {
      console.log('No $ found in split command');
      return { type: 'unknown', data: {} };
    }

    // Description is everything before $
    const description = content.substring(0, dollarIndex).trim();
    if (!description || description.length < 2) {
      console.log('Description is too short:', description);
      return { type: 'unknown', data: {} };
    }

    // Find the amount and @users after $
    const afterDollar = content.substring(dollarIndex + 1).trim();
    const parts = afterDollar.split(/\s+/);

    if (parts.length < 2) {
      console.log('Need amount and at least one @user');
      return { type: 'unknown', data: {} };
    }

    // First part after $ should be the amount
    const amountPart = parts[0];
    const amount = parseFloat(amountPart);
    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
      console.log('Amount is invalid:', amountPart);
      return { type: 'unknown', data: {} };
    }

    // Remaining parts should be @users
    const userParts = parts.slice(1);
    if (userParts.length === 0) {
      console.log('No users specified');
      return { type: 'unknown', data: {} };
    }

    // Validate all user parts start with @
    const users = [];
    let isAll = false;
    for (const part of userParts) {
      if (!part.startsWith('@')) {
        console.log('User does not start with @:', part);
        return { type: 'unknown', data: {} };
      }
      const username = part.substring(1);
      if (username === 'all') {
        isAll = true;
        users.length = 0; // Clear users if @all is specified
        break;
      }
      if (!username || username.length === 0) {
        console.log('Empty username after @');
        return { type: 'unknown', data: {} };
      }
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{1,30}$/;
      if (!usernameRegex.test(username)) {
        console.log('Invalid username format:', username);
        return { type: 'unknown', data: {} };
      }
      users.push(username);
    }

    // Try to extract category from description
    const categoryKeywords = ['food', 'dinner', 'lunch', 'breakfast', 'coffee', 'drink', 'movie', 'travel', 'taxi', 'uber', 'hotel', 'shopping', 'grocery', 'gas', 'fuel', 'entertainment', 'party', 'gift'];
    const descLower = description.toLowerCase();
    let category = 'Other';
    for (const keyword of categoryKeywords) {
      if (descLower.includes(keyword)) {
        category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }

    console.log('✅ Valid split command parsed:', { description, amount, users, isAll, category });

    return {
      type: 'split',
      data: {
        target: isAll ? 'all' : users[0],
        username: isAll ? null : users[0],
        isAll,
        description,
        amount,
        category,
        participants: isAll ? [] : users,
        splitType: 'equal',
      },
    };
  }

  private static parseSplitCommandLegacy(message: string): ParsedCommand {
    // Legacy parser removed - now using strict format only
    return { type: 'unknown', data: {} };
  }

  private static parseExpenseCommand(message: string): ParsedCommand {
    // EXTREMELY strict parsing: @addexpense description amount [category:Category]
    // Examples: @addexpense coffee 50, @addexpense lunch 200 category:Food
    // Must have at least 3 parts: @addexpense description amount

    const trimmed = message.trim();
    
    // Must start with '@addexpense ' (with space)
    if (!trimmed.toLowerCase().startsWith('@addexpense ')) {
      console.log('Message does not start with @addexpense followed by space');
      return { type: 'unknown', data: {} };
    }

    const parts = trimmed.split(/\s+/);

    // Must have at least 3 parts: @addexpense description amount
    if (parts.length < 3) {
      console.log(`Expense command needs at least 3 parts, got ${parts.length}:`, parts);
      return { type: 'unknown', data: {} };
    }

    const [command, description, amountPart, ...rest] = parts;

    // Validate command is exactly '@addexpense' (case insensitive)
    if (command.toLowerCase() !== '@addexpense') {
      console.log('First part is not @addexpense:', command);
      return { type: 'unknown', data: {} };
    }

    // Validate description is meaningful (at least 2 characters, not just numbers, not empty)
    if (!description || description.length < 2 || /^\d+$/.test(description) || description.toLowerCase() === 'the' || description.toLowerCase() === 'a' || description.toLowerCase() === 'an') {
      console.log('Description is too short, invalid, or meaningless:', description);
      return { type: 'unknown', data: {} };
    }

    // Additional validation: ensure description doesn't look like a command
    if (description.toLowerCase().startsWith('@') || description.toLowerCase().includes('split') || description.toLowerCase().includes('expense') || description.toLowerCase().includes('add')) {
      console.log('Description looks like a command:', description);
      return { type: 'unknown', data: {} };
    }

    // Validate amount is a valid number
    const amount = parseFloat(amountPart);
    if (isNaN(amount) || amount <= 0 || amount > 1000000 || !/^\d+(\.\d{1,2})?$/.test(amountPart)) {
      console.log('Amount is invalid:', amountPart);
      return { type: 'unknown', data: {} };
    }

    // Check for category in remaining parts
    let category = 'Other';
    const categoryPart = rest.find(part => part.toLowerCase().startsWith('category:'));
    if (categoryPart) {
      const categoryValue = categoryPart.split(':')[1];
      if (categoryValue && categoryValue.length > 0) {
        category = categoryValue;
      }
    }

    console.log('✅ Valid expense command parsed:', { description, amount, category });

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