const express = require('express');
const router = express.Router();
const reminderService = require('../utils/reminderService');
const SplitBill = require('../models/SplitBill');
const auth = require('../middleware/auth');

// Schedule reminders for a split bill
router.post('/schedule/:splitBillId', auth, async (req, res) => {
  try {
    const { splitBillId } = req.params;
    const reminderSettings = req.body;

    // Verify user has access to this split bill
    const splitBill = await SplitBill.findById(splitBillId);
    if (!splitBill) {
      return res.status(404).json({ error: 'Split bill not found' });
    }

    const hasAccess = splitBill.participants.some(p => p.userId.toString() === req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reminders = await reminderService.scheduleReminders(splitBillId, reminderSettings);

    res.json({
      success: true,
      message: 'Reminders scheduled successfully',
      reminders: reminders.length
    });
  } catch (error) {
    console.error('Error scheduling reminders:', error);
    res.status(500).json({ error: 'Failed to schedule reminders' });
  }
});

// Get user's reminders
router.get('/my-reminders', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    const reminders = await reminderService.getUserReminders(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      reminders,
      count: reminders.length
    });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({ error: 'Failed to get reminders' });
  }
});

// Mark reminder as read
router.put('/:splitBillId/reminder/:reminderId/read', auth, async (req, res) => {
  try {
    const { splitBillId, reminderId } = req.params;

    const success = await reminderService.markReminderAsRead(splitBillId, reminderId, req.user.id);

    if (!success) {
      return res.status(404).json({ error: 'Reminder not found or access denied' });
    }

    res.json({ success: true, message: 'Reminder marked as read' });
  } catch (error) {
    console.error('Error marking reminder as read:', error);
    res.status(500).json({ error: 'Failed to mark reminder as read' });
  }
});

// Update reminder settings for a split bill
router.put('/settings/:splitBillId', auth, async (req, res) => {
  try {
    const { splitBillId } = req.params;
    const settings = req.body;

    // Verify user has access to this split bill
    const splitBill = await SplitBill.findById(splitBillId);
    if (!splitBill) {
      return res.status(404).json({ error: 'Split bill not found' });
    }

    const hasAccess = splitBill.participants.some(p => p.userId.toString() === req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reminders = await reminderService.updateReminderSettings(splitBillId, req.user.id, settings);

    res.json({
      success: true,
      message: 'Reminder settings updated',
      reminders: reminders.length
    });
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    res.status(500).json({ error: 'Failed to update reminder settings' });
  }
});

// Process due reminders (admin/cron job endpoint)
router.post('/process-due', async (req, res) => {
  try {
    // In production, this should be protected with admin authentication
    const result = await reminderService.processDueReminders();

    res.json({
      success: true,
      message: 'Due reminders processed',
      processed: result.processed
    });
  } catch (error) {
    console.error('Error processing due reminders:', error);
    res.status(500).json({ error: 'Failed to process due reminders' });
  }
});

module.exports = router;