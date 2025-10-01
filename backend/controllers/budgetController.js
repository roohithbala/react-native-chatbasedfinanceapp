// Import sub-controllers
const budgetQueries = require('./budgetQueriesController');
const budgetManagement = require('./budgetManagementController');

// Export all functions from sub-controllers
module.exports = {
  // Budget Queries
  ...budgetQueries,

  // Budget Management
  ...budgetManagement
};