const Location = require('../models/Location');
const locationUtils = require('../utils/locationUtils');

/**
 * Get user locations with filtering and pagination
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters and pagination
 * @returns {Object} - Locations data with pagination
 */
const getUserLocations = async (userId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    category,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const query = locationUtils.buildLocationQuery(userId, { category, search });
  const sortOptions = locationUtils.buildLocationSortOptions({ sortBy, sortOrder, search });

  let locations;

  if (search) {
    // Use text search if search term provided
    locations = await Location.find(
      query,
      { score: { $meta: 'textScore' } }
    )
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name avatar');
  } else {
    locations = await Location.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name avatar');
  }

  const total = await Location.countDocuments(query);

  return {
    locations,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total
  };
};

/**
 * Get nearby locations
 * @param {string} userId - User ID
 * @param {Object} params - Search parameters
 * @returns {Object} - Nearby locations
 */
const getNearbyLocations = async (userId, params) => {
  const validation = locationUtils.validateNearbyParams(params);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const { longitude, latitude, maxDistance } = validation.parsedParams;

  const locations = await Location.findNearby(longitude, latitude, maxDistance, userId);

  return { locations };
};

/**
 * Get popular locations
 * @param {string} userId - User ID
 * @param {number} limit - Number of locations to return
 * @returns {Object} - Popular locations
 */
const getPopularLocations = async (userId, limit = 10) => {
  const locations = await Location.getPopularLocations(userId, parseInt(limit));
  return { locations };
};

/**
 * Get locations by category
 * @param {string} category - Category name
 * @param {string} userId - User ID
 * @param {number} limit - Number of locations to return
 * @returns {Object} - Locations in category
 */
const getLocationsByCategory = async (category, userId, limit = 20) => {
  if (!locationUtils.isValidCategory(category)) {
    throw new Error('Invalid category');
  }

  const locations = await Location.getLocationsByCategory(category, userId, parseInt(limit));
  return { locations };
};

/**
 * Get single location by ID
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID requesting the location
 * @returns {Object} - Location data
 */
const getLocationById = async (locationId, userId) => {
  const location = await Location.findOne({
    _id: locationId,
    $or: [
      { userId: userId },
      { isPublic: true }
    ]
  }).populate('userId', 'name avatar');

  if (!location) {
    throw new Error('Location not found');
  }

  return { location };
};

module.exports = {
  getUserLocations,
  getNearbyLocations,
  getPopularLocations,
  getLocationsByCategory,
  getLocationById
};