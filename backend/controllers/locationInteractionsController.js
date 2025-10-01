const Location = require('../models/Location');
const locationUtils = require('../utils/locationUtils');

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
  recordLocationVisit,
  addLocationPhoto
};