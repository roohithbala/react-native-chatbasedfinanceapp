const Location = require('../models/Location');
const locationUtils = require('../utils/locationUtils');

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

module.exports = {
  createLocation,
  updateLocation,
  deleteLocation
};