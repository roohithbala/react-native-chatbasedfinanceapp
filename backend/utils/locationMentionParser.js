const Location = require('../models/Location');

/**
 * Parses location mentions from message text
 * @param {string} text - Message text containing @location mentions
 * @param {string} userId - User ID for location filtering
 * @returns {Array} - Array of location mention objects
 */
const parseLocationMentions = async (text, userId) => {
  try {
    // Match @location patterns (e.g., @location:restaurant, @location:home)
    const locationMentions = text.match(/@location:([^\s]+)/g) || [];

    if (locationMentions.length === 0) return [];

    const locationNames = locationMentions.map(mention => mention.substring(10)); // Remove '@location:'

    // Find matching locations for the user
    const locations = await Location.find({
      userId: userId,
      name: { $in: locationNames }
    }).select('_id name coordinates');

    // Map back to the expected format
    return locations.map(location => ({
      locationId: location._id.toString(),
      locationName: location.name,
      coordinates: location.coordinates
    }));

  } catch (error) {
    console.error('Error parsing location mentions:', error);
    return [];
  }
};

module.exports = {
  parseLocationMentions
};