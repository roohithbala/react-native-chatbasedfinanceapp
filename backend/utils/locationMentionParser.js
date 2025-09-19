const Location = require('../models/Location');

class LocationMentionParser {
  // Regex to match @location mentions like @Starbucks or @"Starbucks Downtown"
  static LOCATION_MENTION_REGEX = /@(?:"([^"]+)"|([^\s@]+))/g;

  /**
   * Parse a message text for location mentions
   * @param {string} text - The message text to parse
   * @param {string} userId - The user ID making the mention
   * @returns {Promise<Array>} Array of location mention objects
   */
  static async parseLocationMentions(text, userId) {
    const mentions = [];
    let match;

    // Reset regex lastIndex
    this.LOCATION_MENTION_REGEX.lastIndex = 0;

    while ((match = this.LOCATION_MENTION_REGEX.exec(text)) !== null) {
      const locationName = match[1] || match[2]; // match[1] for quoted, match[2] for unquoted

      try {
        // Search for locations matching the name
        const locations = await Location.find({
          userId,
          name: { $regex: locationName, $options: 'i' }
        }).limit(5);

        if (locations.length > 0) {
          // Use the first (best) match
          const location = locations[0];
          mentions.push({
            locationId: location._id,
            locationName: location.name,
            coordinates: location.coordinates,
            match: match[0], // The full @mention text
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
      } catch (error) {
        console.error('Error searching for location:', locationName, error);
      }
    }

    return mentions;
  }

  /**
   * Replace location mentions in text with formatted links
   * @param {string} text - Original message text
   * @param {Array} locationMentions - Array of location mention objects
   * @returns {string} Text with location mentions formatted
   */
  static formatLocationMentions(text, locationMentions) {
    let formattedText = text;

    // Sort mentions by startIndex in reverse order to avoid index shifting
    const sortedMentions = [...locationMentions].sort((a, b) => b.startIndex - a.startIndex);

    for (const mention of sortedMentions) {
      const before = formattedText.substring(0, mention.startIndex);
      const after = formattedText.substring(mention.endIndex);
      const formattedMention = `[@${mention.locationName}](location:${mention.locationId})`;

      formattedText = before + formattedMention + after;
    }

    return formattedText;
  }

  /**
   * Extract plain text from formatted location mentions for display
   * @param {string} formattedText - Text with formatted location mentions
   * @returns {string} Plain text for display
   */
  static extractPlainText(formattedText) {
    return formattedText.replace(/\[(@[^]]+)\]\(location:[^\)]+\)/g, '$1');
  }

  /**
   * Parse formatted text back to location mentions
   * @param {string} formattedText - Text with formatted location mentions
   * @returns {Array} Array of location mention objects
   */
  static parseFormattedText(formattedText) {
    const mentions = [];
    const regex = /\[(@[^]]+)\]\(location:([^\)]+)\)/g;
    let match;

    while ((match = regex.exec(formattedText)) !== null) {
      mentions.push({
        locationName: match[1].substring(1), // Remove the @ symbol
        locationId: match[2],
        formattedText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return mentions;
  }

  /**
   * Get location suggestions for autocomplete
   * @param {string} query - The search query
   * @param {string} userId - The user ID
   * @param {number} limit - Maximum number of suggestions
   * @returns {Promise<Array>} Array of location suggestions
   */
  static async getLocationSuggestions(query, userId, limit = 10) {
    try {
      const locations = await Location.find({
        userId,
        name: { $regex: query, $options: 'i' }
      })
      .select('name address category coordinates')
      .limit(limit)
      .sort({ visitCount: -1, createdAt: -1 });

      return locations.map(location => ({
        id: location._id,
        name: location.name,
        address: location.address,
        category: location.category,
        coordinates: location.coordinates,
        displayText: `${location.name} (${location.category})`
      }));
    } catch (error) {
      console.error('Error getting location suggestions:', error);
      return [];
    }
  }

  /**
   * Validate if a location mention is valid
   * @param {string} mentionText - The mention text (without @)
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} Whether the mention is valid
   */
  static async validateLocationMention(mentionText, userId) {
    try {
      const count = await Location.countDocuments({
        userId,
        name: { $regex: `^${mentionText}$`, $options: 'i' }
      });
      return count > 0;
    } catch (error) {
      console.error('Error validating location mention:', error);
      return false;
    }
  }
}

module.exports = LocationMentionParser;