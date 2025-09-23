import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Alert,
} from 'react-native';
import FormInput from './FormInput';
import AmountInput from './AmountInput';
import CategorySelector from './CategorySelector';
import PaymentMethodSelector from './PaymentMethodSelector';
import DatePicker from './DatePicker';
import RecurringExpenseToggle from './RecurringExpenseToggle';
import TagsInput from './TagsInput';

interface ExpenseFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (expenseData: any) => void;
  loading: boolean;
  initialData?: any;
  isEdit?: boolean;
}

export default function ExpenseForm({
  visible,
  onClose,
  onSave,
  loading,
  initialData,
  isEdit = false
}: ExpenseFormProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || 'Food');
  const [location, setLocation] = useState(initialData?.location || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [date, setDate] = useState(initialData?.createdAt ? new Date(initialData.createdAt) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  // Smart categorization keywords
  const categoryKeywords = {
    Food: ['lunch', 'dinner', 'breakfast', 'coffee', 'tea', 'restaurant', 'food', 'meal', 'snack', 'drink', 'beverage', 'cafe', 'pizza', 'burger', 'sandwich', 'sushi', 'pasta', 'steak', 'chicken', 'fish', 'salad', 'dessert', 'ice cream', 'cake', 'cookie', 'bread', 'milk', 'juice', 'soda', 'beer', 'wine', 'alcohol', 'bar', 'pub', 'groceries', 'supermarket', 'market'],
    Transport: ['taxi', 'uber', 'lyft', 'bus', 'train', 'metro', 'subway', 'flight', 'plane', 'airport', 'gas', 'fuel', 'petrol', 'parking', 'toll', 'car', 'bike', 'scooter', 'ride', 'travel', 'commute'],
    Entertainment: ['movie', 'cinema', 'theater', 'concert', 'music', 'game', 'gaming', 'party', 'event', 'festival', 'club', 'nightclub', 'show', 'performance', 'ticket', 'amusement', 'park', 'zoo', 'museum', 'art', 'gallery'],
    Shopping: ['clothes', 'clothing', 'shirt', 'pants', 'shoes', 'bag', 'accessories', 'jewelry', 'watch', 'electronics', 'phone', 'laptop', 'computer', 'tablet', 'book', 'gift', 'present', 'shopping', 'store', 'mall', 'amazon', 'ebay'],
    Bills: ['electricity', 'water', 'internet', 'phone', 'mobile', 'rent', 'mortgage', 'insurance', 'subscription', 'netflix', 'spotify', 'amazon prime', 'utility', 'bill', 'payment', 'fee'],
    Health: ['doctor', 'hospital', 'clinic', 'medicine', 'pharmacy', 'drug', 'medical', 'dental', 'dentist', 'therapy', 'gym', 'fitness', 'health', 'wellness', 'supplement', 'vitamin'],
    Education: ['school', 'college', 'university', 'course', 'class', 'book', 'tuition', 'exam', 'test', 'study', 'learning', 'education', 'training', 'workshop', 'seminar'],
    Travel: ['hotel', 'resort', 'vacation', 'trip', 'tour', 'holiday', 'accommodation', 'lodging', 'booking', 'reservation', 'travel', 'journey', 'destination'],
    Utilities: ['electric', 'gas', 'water', 'internet', 'cable', 'phone', 'utility', 'maintenance', 'repair', 'service', 'cleaning']
  };

  // Smart categorization function
  const suggestCategory = (description: string): string => {
    if (!description) return 'Food';

    const lowerDescription = description.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerDescription.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Food';
  };

  // Auto-categorize when description changes
  const handleDescriptionChange = (text: string) => {
    setDescription(text);

    // Only auto-categorize if category is still the default 'Food' or if it's 'Other'
    if (category === 'Food' || category === 'Other') {
      const suggestedCategory = suggestCategory(text);
      if (suggestedCategory !== 'Food') {
        setCategory(suggestedCategory);
      }
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('Food');
    setLocation('');
    setTags('');
    setPaymentMethod('Cash');
    setIsRecurring(false);
    setRecurringFrequency('monthly');
    setDate(new Date());
    setNotes('');
  };

  const validateForm = () => {
    if (!description.trim()) {
      Alert.alert('Please enter a description');
      return false;
    }

    if (!amount.trim()) {
      Alert.alert('Please enter an amount');
      return false;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert('Please enter a valid amount greater than 0');
      return false;
    }

    if (expenseAmount > 1000000) {
      Alert.alert('Amount seems too high. Please verify the amount.');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const expenseAmount = parseFloat(amount);
    const tagArray = tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);

    const expenseData = {
      description: description.trim(),
      amount: expenseAmount,
      category,
      tags: tagArray,
      location: location.trim() || undefined,
      paymentMethod,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      date: date.toISOString(),
      notes: notes.trim() || undefined,
    };

    onSave(expenseData);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      transparent={false}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEdit ? '✏️ Edit Expense' : '➕ Add Expense'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Text style={[styles.modalSave, loading && styles.disabledText]}>
                {loading ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update' : 'Save')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <FormInput
              label="📝 Description"
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="What did you spend on?"
              maxLength={100}
              required
            />

            <AmountInput
              value={amount}
              onChangeText={setAmount}
            />

            <CategorySelector
              selectedCategory={category}
              onCategoryChange={setCategory}
            />

            <FormInput
              label="📍 Location"
              value={location}
              onChangeText={setLocation}
              placeholder="Where did you make this purchase?"
              maxLength={50}
            />

            <TagsInput
              value={tags}
              onChangeText={setTags}
            />

            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />

            <DatePicker
              date={date}
              onDateChange={setDate}
              showPicker={showDatePicker}
              onTogglePicker={() => setShowDatePicker(!showDatePicker)}
            />

            <RecurringExpenseToggle
              isRecurring={isRecurring}
              onToggle={() => setIsRecurring(!isRecurring)}
              frequency={recurringFrequency}
              onFrequencyChange={setRecurringFrequency}
            />

            <FormInput
              label="📝 Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748B',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  disabledText: {
    color: '#94A3B8',
  },
});