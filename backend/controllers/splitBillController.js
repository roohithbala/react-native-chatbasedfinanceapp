// Import sub-controllers
const splitBillQueries = require('./splitBillQueriesController');
const splitBillManagement = require('./splitBillManagementController');

// Export all functions from sub-controllers
module.exports = {
  // Split Bill Queries
  ...splitBillQueries,

  // Split Bill Management
  ...splitBillManagement
};