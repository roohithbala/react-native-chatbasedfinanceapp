import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Keyboard,
} from 'react-native';
import { locationsAPI, Location } from '@/lib/services/locationsAPI';

const { width } = Dimensions.get('window');

interface LocationMentionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  onLocationMention?: (location: Location) => void;
}

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  category: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  displayText: string;
}

export default function LocationMentionInput({
  value,
  onChangeText,
  placeholder = 'Type @ to mention a location...',
  style,
  onLocationMention,
}: LocationMentionInputProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const handleLocationSuggestions = async () => {
      const mentionMatch = getCurrentMention();
      if (mentionMatch) {
        const query = mentionMatch.query;
        if (query.length > 0) {
          try {
            const locationSuggestions = await locationsAPI.getLocations(
              1, // page
              5, // limit
              { search: query } // filters
            );

            const formattedSuggestions: LocationSuggestion[] = locationSuggestions.locations.map(loc => ({
              id: loc._id,
              name: loc.name,
              address: loc.address,
              category: loc.category,
              coordinates: loc.coordinates,
              displayText: `${loc.name} (${loc.category})`,
            }));

            setSuggestions(formattedSuggestions);
            setShowSuggestions(true);
          } catch (error) {
            console.error('Error fetching location suggestions:', error);
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    handleLocationSuggestions();
  }, [value, cursorPosition]);

  const getCurrentMention = () => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      // Check if there's a space before the @ (to ensure it's a new mention)
      const charBeforeAt = atIndex > 0 ? textBeforeCursor.charAt(atIndex - 1) : ' ';

      if (charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) {
        // Check if there are spaces in the mention text (invalidates the mention)
        if (textAfterAt.includes(' ')) {
          return null;
        }

        setMentionStart(atIndex);
        return {
          query: textAfterAt,
          start: atIndex,
          end: cursorPosition,
        };
      }
    }

    return null;
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
  };

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const handleSuggestionPress = (suggestion: LocationSuggestion) => {
    const mentionText = `@${suggestion.name}`;
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(cursorPosition);

    const newText = beforeMention + mentionText + ' ' + afterMention;
    onChangeText(newText);

    // Move cursor to after the mention
    setTimeout(() => {
      inputRef.current?.setNativeProps({
        selection: { start: mentionStart + mentionText.length + 1, end: mentionStart + mentionText.length + 1 }
      });
    }, 100);

    setShowSuggestions(false);
    setSuggestions([]);

    // Notify parent component about the location mention
    if (onLocationMention) {
      // Fetch the full location details
      locationsAPI.getLocation(suggestion.id)
        .then(response => {
          onLocationMention(response.location);
        })
        .catch(error => {
          console.error('Error fetching location details:', error);
        });
    }
  };

  const renderSuggestion = ({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionName}>{item.name}</Text>
        <Text style={styles.suggestionAddress}>{item.address}</Text>
        <Text style={styles.suggestionCategory}>{item.category}</Text>
      </View>
      <View style={styles.suggestionIcon}>
        <Text style={styles.locationEmoji}>
          {getCategoryEmoji(item.category)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      restaurant: '🍽️',
      store: '🛒',
      entertainment: '🎭',
      service: '🛠️',
      transport: '🚗',
      healthcare: '🏥',
      education: '🎓',
      other: '📍',
    };
    return emojis[category] || '📍';
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={[styles.input, style]}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        multiline
        autoCapitalize="sentences"
        autoCorrect={true}
      />

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  suggestionIcon: {
    marginLeft: 12,
  },
  locationEmoji: {
    fontSize: 20,
  },
});