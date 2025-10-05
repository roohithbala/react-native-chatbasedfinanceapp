const commandExecutors = require('./commandExecutors');

/**
 * Parses and executes financial commands from chat messages
 * @param {string} text - Command text
 * @param {string} userId - User ID executing the command
 * @param {string} groupId - Group ID where command was executed
 * @param {Object} user - User object
 * @returns {Object} - Command execution result
 */
const parseAndExecuteCommand = async (text, userId, groupId, user) => {
  const lowerText = text.toLowerCase();

  if (lowerText.startsWith('@split')) {
    return await commandExecutors.executeSplitCommand(text, userId, groupId, user);
  }
  else if (lowerText.startsWith('@addexpense')) {
    return await commandExecutors.executeAddExpenseCommand(text, userId, groupId);
  }
  else if (lowerText.startsWith('@predict')) {
    return await commandExecutors.executePredictCommand(userId);
  }
  else if (lowerText.startsWith('@summary')) {
    return await commandExecutors.executeSummaryCommand(groupId);
  }

  return { type: 'unknown', data: {}, success: false };
};

/**
 * Validates command format and required parameters
 * @param {string} text - Command text
 * @param {string} commandType - Type of command
 * @returns {Object} - Validation result
 */
const validateCommandFormat = (text, commandType) => {
  const errors = [];

  switch (commandType) {
    case 'split':
      // Check for amount
      const amountMatch = text.match(/(?:[\$₹£€¥]\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[\$₹£€¥])?/);
      if (!amountMatch) {
        errors.push('Amount is required for split command');
      } else {
        const amount = parseFloat(amountMatch[1]);
        if (amount <= 0) {
          errors.push('Amount must be positive');
        }
      }
      break;

    case 'addexpense':
      // Check for amount
      const expenseAmountMatch = text.match(/(?:[\$₹£€¥]\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[\$₹£€¥])?/);
      if (!expenseAmountMatch) {
        errors.push('Amount is required for add expense command');
      } else {
        const amount = parseFloat(expenseAmountMatch[1]);
        if (amount <= 0) {
          errors.push('Amount must be positive');
        }
      }
      break;

    case 'predict':
    case 'summary':
      // These commands don't require additional parameters
      break;

    default:
      errors.push('Unknown command type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Extracts command type from text
 * @param {string} text - Command text
 * @returns {string|null} - Command type or null if not a command
 */
const extractCommandType = (text) => {
  const lowerText = text.toLowerCase();

  if (lowerText.startsWith('@split')) return 'split';
  if (lowerText.startsWith('@addexpense')) return 'addexpense';
  if (lowerText.startsWith('@predict')) return 'predict';
  if (lowerText.startsWith('@summary')) return 'summary';

  return null;
};

module.exports = {
  parseAndExecuteCommand,
  validateCommandFormat,
  extractCommandType
};