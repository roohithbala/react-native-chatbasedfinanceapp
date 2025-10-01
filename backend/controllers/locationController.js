// Import sub-controllers
const locationQueries = require('./locationQueriesController');
const locationManagement = require('./locationManagementController');
const locationInteractions = require('./locationInteractionsController');

// Export all functions from sub-controllers
module.exports = {
  // Location Queries
  ...locationQueries,

  // Location Management
  ...locationManagement,

  // Location Interactions
  ...locationInteractions
};