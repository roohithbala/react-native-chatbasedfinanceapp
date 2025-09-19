const express = require('express');
const Todo = require('../models/Todo');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user todos with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      tags,
      dueBefore,
      dueAfter,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (tags) {
      filters.tags = Array.isArray(tags) ? tags : tags.split(',');
    }
    if (dueBefore) filters.dueBefore = new Date(dueBefore);
    if (dueAfter) filters.dueAfter = new Date(dueAfter);

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const todos = await Todo.find({ userId: req.userId, ...filters })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name avatar username')
      .populate('sharedWith.userId', 'name avatar username');

    const total = await Todo.countDocuments({ userId: req.userId, ...filters });

    res.json({
      todos,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      filters: {
        status,
        priority,
        category,
        tags: filters.tags,
        dueBefore,
        dueAfter
      }
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get overdue todos
router.get('/overdue', auth, async (req, res) => {
  try {
    const overdueTodos = await Todo.getOverdueTodos(req.userId);
    res.json({ todos: overdueTodos });
  } catch (error) {
    console.error('Get overdue todos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get todos due soon
router.get('/due-soon', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const dueSoonTodos = await Todo.getTodosDueSoon(req.userId, parseInt(days));
    res.json({ todos: dueSoonTodos });
  } catch (error) {
    console.error('Get due soon todos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single todo
router.get('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { 'sharedWith.userId': req.userId }
      ]
    })
    .populate('userId', 'name avatar username')
    .populate('sharedWith.userId', 'name avatar username');

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ todo });
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new todo
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      tags,
      category,
      isRecurring,
      recurringPattern,
      location
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Title must be less than 200 characters' });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({ message: 'Description must be less than 1000 characters' });
    }

    // Validate due date
    let parsedDueDate = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid due date format' });
      }
    }

    const todo = new Todo({
      userId: req.userId,
      title: title.trim(),
      description: description?.trim(),
      priority: priority || 'medium',
      dueDate: parsedDueDate,
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(tag => tag) : [],
      category: category?.trim() || 'General',
      isRecurring: Boolean(isRecurring),
      recurringPattern: isRecurring ? recurringPattern : undefined,
      location
    });

    await todo.save();
    await todo.populate('userId', 'name avatar username');

    res.status(201).json({
      message: 'Todo created successfully',
      todo
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update todo
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      tags,
      category,
      isRecurring,
      recurringPattern,
      location
    } = req.body;

    const todo = await Todo.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { 'sharedWith.userId': req.userId, 'sharedWith.permission': 'edit' }
      ]
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found or insufficient permissions' });
    }

    // Validation
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      if (title.length > 200) {
        return res.status(400).json({ message: 'Title must be less than 200 characters' });
      }
      todo.title = title.trim();
    }

    if (description !== undefined) {
      if (description && description.length > 1000) {
        return res.status(400).json({ message: 'Description must be less than 1000 characters' });
      }
      todo.description = description?.trim();
    }

    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority value' });
      }
      todo.priority = priority;
    }

    if (status !== undefined) {
      const validStatuses = ['not-started', 'in-progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      todo.status = status;
      if (status === 'completed') {
        todo.completedAt = new Date();
      } else {
        todo.completedAt = undefined;
      }
    }

    if (dueDate !== undefined) {
      if (dueDate) {
        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({ message: 'Invalid due date format' });
        }
        todo.dueDate = parsedDueDate;
      } else {
        todo.dueDate = undefined;
      }
    }

    if (tags !== undefined) {
      todo.tags = Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(tag => tag) : [];
    }

    if (category !== undefined) {
      todo.category = category?.trim() || 'General';
    }

    if (isRecurring !== undefined) {
      todo.isRecurring = Boolean(isRecurring);
      if (isRecurring && recurringPattern) {
        todo.recurringPattern = recurringPattern;
      } else if (!isRecurring) {
        todo.recurringPattern = undefined;
      }
    }

    if (location !== undefined) {
      todo.location = location;
    }

    await todo.save();
    await todo.populate('userId', 'name avatar username');
    await todo.populate('sharedWith.userId', 'name avatar username');

    res.json({
      message: 'Todo updated successfully',
      todo
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete todo
router.delete('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { 'sharedWith.userId': req.userId, 'sharedWith.permission': 'edit' }
      ]
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found or insufficient permissions' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark todo as completed
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { 'sharedWith.userId': req.userId, 'sharedWith.permission': 'edit' }
      ]
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found or insufficient permissions' });
    }

    await todo.markCompleted();
    await todo.populate('userId', 'name avatar username');

    res.json({
      message: 'Todo marked as completed',
      todo
    });
  } catch (error) {
    console.error('Complete todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark todo as in progress
router.patch('/:id/start', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { 'sharedWith.userId': req.userId, 'sharedWith.permission': 'edit' }
      ]
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found or insufficient permissions' });
    }

    await todo.markInProgress();
    await todo.populate('userId', 'name avatar username');

    res.json({
      message: 'Todo marked as in progress',
      todo
    });
  } catch (error) {
    console.error('Start todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share todo with another user
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { userId, permission = 'view' } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const todo = await Todo.findOne({
      _id: req.params.id,
      userId: req.userId // Only owner can share
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Check if user is already shared with
    const existingShare = todo.sharedWith.find(share =>
      share.userId.toString() === userId
    );

    if (existingShare) {
      existingShare.permission = permission;
    } else {
      todo.sharedWith.push({ userId, permission });
    }

    await todo.save();
    await todo.populate('sharedWith.userId', 'name avatar username');

    res.json({
      message: 'Todo shared successfully',
      todo
    });
  } catch (error) {
    console.error('Share todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove share from todo
router.delete('/:id/share/:userId', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      userId: req.userId // Only owner can remove shares
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.sharedWith = todo.sharedWith.filter(share =>
      share.userId.toString() !== req.params.userId
    );

    await todo.save();

    res.json({ message: 'Share removed successfully' });
  } catch (error) {
    console.error('Remove share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get todo statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Todo.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$dueDate', null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, completed: 0, inProgress: 0, overdue: 0 };
    result.pending = result.total - result.completed - result.inProgress;

    res.json({ stats: result });
  } catch (error) {
    console.error('Get todo stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;