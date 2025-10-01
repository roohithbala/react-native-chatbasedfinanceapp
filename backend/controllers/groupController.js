// Import sub-controllers
const groupManagement = require('./groupManagementController');
const memberManagement = require('./memberManagementController');
const inviteCode = require('./inviteCodeController');
const groupSplitBill = require('./groupSplitBillController');

// Export all functions from sub-controllers
module.exports = {
  // Group Management
  ...groupManagement,

  // Member Management
  ...memberManagement,

  // Invite Code Management
  ...inviteCode,

  // Group Split Bill
  ...groupSplitBill
};