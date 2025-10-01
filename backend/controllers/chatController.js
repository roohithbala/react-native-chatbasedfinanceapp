// Import sub-controllers
const messageQueries = require('./messageQueriesController');
const messageManagement = require('./messageManagementController');

// Export all functions from sub-controllers
module.exports = {
  // Message Queries
  ...messageQueries,

  // Message Management
  ...messageManagement
};