import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { todosAPI } from '../services/api';
import { useFinanceStore } from '../../lib/store/financeStore';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: string;
  tags?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

interface TodoListProps {
  groupId?: string;
  showAddButton?: boolean;
  maxHeight?: number;
}

export default function TodoList({ groupId, showAddButton = true, maxHeight }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');

  const { currentUser } = useFinanceStore();

  useEffect(() => {
    loadTodos();
  }, [groupId]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      
      if (groupId) {
        params.groupId = groupId;
      }

      const response = await todosAPI.getTodos(params);
      setTodos(response.todos || []);
    } catch (error) {
      console.error('Error loading todos:', error);
      Alert.alert('Error', 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodos();
    setRefreshing(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setCategory('General');
    setTags('');
  };

  const handleAddTodo = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      const todoData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        category: category.trim(),
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
      };

      const response = await todosAPI.createTodo(todoData);
      setTodos(prev => [response.todo, ...prev]);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Todo created successfully');
    } catch (error) {
      console.error('Error creating todo:', error);
      Alert.alert('Error', 'Failed to create todo');
    }
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo || !title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      const todoData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        category: category.trim(),
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
      };

      const response = await todosAPI.updateTodo(editingTodo._id, todoData);
      setTodos(prev => prev.map(todo => 
        todo._id === editingTodo._id ? response.todo : todo
      ));
      setEditingTodo(null);
      resetForm();
      Alert.alert('Success', 'Todo updated successfully');
    } catch (error) {
      console.error('Error updating todo:', error);
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    Alert.alert(
      'Delete Todo',
      'Are you sure you want to delete this todo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await todosAPI.deleteTodo(todoId);
              setTodos(prev => prev.filter(todo => todo._id !== todoId));
              Alert.alert('Success', 'Todo deleted successfully');
            } catch (error) {
              console.error('Error deleting todo:', error);
              Alert.alert('Error', 'Failed to delete todo');
            }
          }
        }
      ]
    );
  };

  const handleToggleStatus = async (todo: Todo) => {
    try {
      const newStatus = todo.status === 'completed' ? 'not-started' : 'completed';
      const response = await todosAPI.updateTodo(todo._id, { status: newStatus });
      setTodos(prev => prev.map(t => 
        t._id === todo._id ? response.todo : t
      ));
    } catch (error) {
      console.error('Error updating todo status:', error);
      Alert.alert('Error', 'Failed to update todo status');
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setPriority(todo.priority);
    setDueDate(todo.dueDate || '');
    setCategory(todo.category || 'General');
    setTags(todo.tags ? todo.tags.join(', ') : '');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in-progress': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'pending':
        return todo.status !== 'completed' && todo.status !== 'cancelled';
      case 'completed':
        return todo.status === 'completed';
      default:
        return true;
    }
  });

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => handleToggleStatus(item)}
      >
        <Ionicons
          name={item.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.status === 'completed' ? '#22c55e' : '#6b7280'}
        />
      </TouchableOpacity>

      <View style={styles.todoContent}>
        <View style={styles.todoHeader}>
          <Text style={[
            styles.todoTitle,
            item.status === 'completed' && styles.completedText
          ]}>
            {item.title}
          </Text>
          <View style={styles.todoMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.replace('-', ' ').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={[
            styles.todoDescription,
            item.status === 'completed' && styles.completedText
          ]}>
            {item.description}
          </Text>
        )}

        <View style={styles.todoFooter}>
          {item.dueDate && (
            <Text style={styles.dueDate}>
              📅 {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
          {item.category && item.category !== 'General' && (
            <Text style={styles.category}>🏷️ {item.category}</Text>
          )}
          {item.tags && item.tags.length > 0 && (
            <Text style={styles.tags}>
              🏷️ {item.tags.slice(0, 2).join(', ')}
              {item.tags.length > 2 && ` +${item.tags.length - 2} more`}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.todoActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditTodo(item)}
        >
          <Ionicons name="pencil" size={20} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteTodo(item._id)}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading todos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterTab,
              filter === filterType && styles.activeFilterTab
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterText,
              filter === filterType && styles.activeFilterText
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType !== 'all' && ` (${todos.filter(t => {
                if (filterType === 'pending') return t.status !== 'completed' && t.status !== 'cancelled';
                if (filterType === 'completed') return t.status === 'completed';
                return false;
              }).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Todo List */}
      <FlatList
        data={filteredTodos}
        keyExtractor={(item) => item._id}
        renderItem={renderTodoItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        style={[maxHeight ? { maxHeight } : undefined]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No todos yet' : `No ${filter} todos`}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'Create your first todo to get started' : `Try changing the filter`}
            </Text>
          </View>
        }
      />

      {/* Add Todo Button */}
      {showAddButton && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Todo</Text>
        </TouchableOpacity>
      )}

      {/* Add/Edit Todo Modal */}
      <Modal
        visible={showAddModal || !!editingTodo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingTodo(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTodo ? 'Edit Todo' : 'Add New Todo'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setEditingTodo(null);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Todo title *"
                value={title}
                onChangeText={setTitle}
                maxLength={200}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={1000}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.pickerContainer}>
                    {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.priorityOption,
                          priority === p && { backgroundColor: getPriorityColor(p) }
                        ]}
                        onPress={() => setPriority(p)}
                      >
                        <Text style={[
                          styles.priorityOptionText,
                          priority === p && styles.priorityOptionTextActive
                        ]}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Due Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD (optional)"
                    value={dueDate}
                    onChangeText={setDueDate}
                  />
                </View>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Category (optional)"
                value={category}
                onChangeText={setCategory}
              />

              <TextInput
                style={styles.input}
                placeholder="Tags (comma separated)"
                value={tags}
                onChangeText={setTags}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editingTodo ? handleUpdateTodo : handleAddTodo}
              >
                <Text style={styles.submitButtonText}>
                  {editingTodo ? 'Update Todo' : 'Create Todo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilterTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  todoItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  todoMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  todoDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  todoFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  category: {
    fontSize: 12,
    color: '#6b7280',
  },
  tags: {
    fontSize: 12,
    color: '#6b7280',
  },
  todoActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  form: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  priorityOptionTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});