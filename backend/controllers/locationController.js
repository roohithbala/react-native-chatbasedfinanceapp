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

/**
 * Create a new location
 * @param {string} userId - User ID creating the location
 * @param {Object} locationData - Location data
 * @returns {Object} - Created location
 */
const createLocation = async (userId, locationData) => {
  const validation = locationUtils.validateLocationData(locationData);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const {
    name,
    address,
    coordinates,
    category,
    googlePlaceId,
    rating,
    priceLevel,
    phoneNumber,
    website,
    businessHours,
    photos,
    tags,
    isPublic,
    notes
  } = locationData;

  // Check if location with same Google Place ID already exists for user
  if (googlePlaceId) {
    const existingLocation = await Location.findOne({
      googlePlaceId,
      userId: userId
    });

    if (existingLocation) {
      throw new Error('Location already exists for this user');
    }
  }

  const location = new Location({
    name: name.trim(),
    address: address.trim(),
    coordinates: {
      latitude: parseFloat(coordinates.latitude),
      longitude: parseFloat(coordinates.longitude)
    },
    category: category || 'other',
    googlePlaceId,
    rating: rating ? parseFloat(rating) : undefined,
    priceLevel: priceLevel ? parseInt(priceLevel) : undefined,
    phoneNumber: phoneNumber?.trim(),
    website: website?.trim(),
    businessHours,
    photos,
    tags: Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(tag => tag) : [],
    userId: userId,
    isPublic: Boolean(isPublic),
    notes: notes?.trim()
  });

  await location.save();
  await location.populate('userId', 'name avatar');

  return location;
};

/**
 * Update a location
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID updating the location
 * @param {Object} updateData - Update data
 * @returns {Object} - Updated location
 */
const updateLocation = async (locationId, userId, updateData) => {
  const validation = locationUtils.validateLocationUpdateData(updateData);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const location = await Location.findOne({
    _id: locationId,
    userId: userId
  });

  if (!location) {
    throw new Error('Location not found');
  }

  const {
    name,
    address,
    coordinates,
    category,
    rating,
    priceLevel,
    phoneNumber,
    website,
    businessHours,
    photos,
    tags,
    isPublic,
    notes
  } = updateData;

  // Update fields
  if (name !== undefined) location.name = name.trim();
  if (address !== undefined) location.address = address.trim();
  if (coordinates !== undefined) {
    location.coordinates = {
      latitude: parseFloat(coordinates.latitude),
      longitude: parseFloat(coordinates.longitude)
    };
  }
  if (category !== undefined) location.category = category;
  if (rating !== undefined) location.rating = rating ? parseFloat(rating) : undefined;
  if (priceLevel !== undefined) location.priceLevel = priceLevel ? parseInt(priceLevel) : undefined;
  if (phoneNumber !== undefined) location.phoneNumber = phoneNumber?.trim();
  if (website !== undefined) location.website = website?.trim();
  if (businessHours !== undefined) location.businessHours = businessHours;
  if (photos !== undefined) location.photos = photos;
  if (tags !== undefined) {
    location.tags = Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(tag => tag) : [];
  }
  if (isPublic !== undefined) location.isPublic = Boolean(isPublic);
  if (notes !== undefined) location.notes = notes?.trim();

  await location.save();
  await location.populate('userId', 'name avatar');

  return location;
};

/**
 * Delete a location
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID deleting the location
 * @returns {Object} - Success confirmation
 */
const deleteLocation = async (locationId, userId) => {
  const location = await Location.findOneAndDelete({
    _id: locationId,
    userId: userId
  });

  if (!location) {
    throw new Error('Location not found');
  }

  return { message: 'Location deleted successfully' };
};

/**
 * Record a visit to a location
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID recording the visit
 * @returns {Object} - Updated location
 */
const recordLocationVisit = async (locationId, userId) => {
  const location = await Location.findOne({
    _id: locationId,
    $or: [
      { userId: userId },
      { isPublic: true }
    ]
  });

  if (!location) {
    throw new Error('Location not found');
  }

  await location.recordVisit();

  return location;
};

/**
 * Add a photo to a location
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID adding the photo
 * @param {Object} photoData - Photo data
 * @returns {Object} - Updated location
 */
const addLocationPhoto = async (locationId, userId, photoData) => {
  const validation = locationUtils.validatePhotoData(photoData);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const location = await Location.findOne({
    _id: locationId,
    userId: userId
  });

  if (!location) {
    throw new Error('Location not found');
  }

  const { url, width, height, attribution } = photoData;

  await location.addPhoto({
    url,
    width: width ? parseInt(width) : undefined,
    height: height ? parseInt(height) : undefined,
    attribution
  });

  return location;
};

module.exports = {
  getUserLocations,
  getNearbyLocations,
  getPopularLocations,
  getLocationsByCategory,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  recordLocationVisit,
  addLocationPhoto
};