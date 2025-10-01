// Import sub-controllers
const paymentProcessing = require('./paymentProcessingController');
const settlement = require('./settlementController');
const reminder = require('./reminderController');
const paymentHistory = require('./paymentHistoryController');

// Export all functions from sub-controllers
module.exports = {
  // Payment Processing
  ...paymentProcessing,

  // Settlement
  ...settlement,

  // Reminders
  ...reminder,

  // Payment History
  ...paymentHistory
};