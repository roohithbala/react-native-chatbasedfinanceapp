/**
 * Location utility functions
 */

/**
 * Validates location creation data
 * @param {Object} data - Location data
 * @returns {Object} - Validation result
 */
const validateLocationData = (data) => {
  const { name, address, coordinates } = data;

  if (!name || !address || !coordinates) {
    return { isValid: false, message: 'Name, address, and coordinates are required' };
  }

  if (!coordinates.latitude || !coordinates.longitude) {
    return { isValid: false, message: 'Valid coordinates are required' };
  }

  return { isValid: true };
};

/**
 * Validates location update data
 * @param {Object} data - Location update data
 * @returns {Object} - Validation result
 */
const validateLocationUpdateData = (data) => {
  const { coordinates } = data;

  if (coordinates && (!coordinates.latitude || !coordinates.longitude)) {
    return { isValid: false, message: 'Valid coordinates are required' };
  }

  return { isValid: true };
};

/**
 * Builds query for location filtering
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Object} - MongoDB query object
 */
const buildLocationQuery = (userId, filters = {}) => {
  const { category, search } = filters;
  const query = { userId };

  if (category) {
    query.category = category;
  }

  if (search) {
    // Text search will be handled separately
    query.$text = { $search: search };
  }

  return query;
};

/**
 * Builds sort options for location queries
 * @param {Object} options - Sort options
 * @returns {Object} - MongoDB sort object
 */
const buildLocationSortOptions = (options = {}) => {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const sortOptions = {};

  if (sortBy === 'score' && options.search) {
    // For text search, include score sorting
    sortOptions.score = { $meta: 'textScore' };
  }

  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  return sortOptions;
};

/**
 * Validates category parameter
 * @param {string} category - Category to validate
 * @returns {boolean} - Whether category is valid
 */
const isValidCategory = (category) => {
  const validCategories = ['restaurant', 'store', 'entertainment', 'service', 'transport', 'healthcare', 'education', 'other'];
  return validCategories.includes(category);
};

/**
 * Validates nearby location parameters
 * @param {Object} params - Parameters object
 * @returns {Object} - Validation result
 */
const validateNearbyParams = (params) => {
  const { longitude, latitude, maxDistance = 1000 } = params;

  if (!longitude || !latitude) {
    return { isValid: false, message: 'Longitude and latitude are required' };
  }

  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);
  const dist = parseInt(maxDistance);

  if (isNaN(lng) || isNaN(lat)) {
    return { isValid: false, message: 'Invalid longitude or latitude' };
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return { isValid: false, message: 'Coordinates out of valid range' };
  }

  return {
    isValid: true,
    parsedParams: { longitude: lng, latitude: lat, maxDistance: dist }
  };
};

/**
 * Validates photo data
 * @param {Object} photoData - Photo data
 * @returns {Object} - Validation result
 */
const validatePhotoData = (photoData) => {
  const { url } = photoData;

  if (!url) {
    return { isValid: false, message: 'Photo URL is required' };
  }

  return { isValid: true };
};

module.exports = {
  validateLocationData,
  validateLocationUpdateData,
  buildLocationQuery,
  buildLocationSortOptions,
  isValidCategory,
  validateNearbyParams,
  validatePhotoData
};