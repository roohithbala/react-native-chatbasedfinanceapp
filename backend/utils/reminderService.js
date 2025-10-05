const mongoose = require('mongoose');
const SplitBill = require('../models/SplitBill');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationService');

class ReminderService {
  constructor() {
    this.reminderIntervals = {
      payment_due: 24 * 60 * 60 * 1000, // 24 hours
      settlement_reminder: 7 * 24 * 60 * 60 * 1000, // 7 days
      overdue_payment: 3 * 24 * 60 * 60 * 1000 // 3 days
    };
  }

  // Schedule reminders for a split bill
  async scheduleReminders(splitBillId, reminderSettings = {}) {
    try {
      const splitBill = await SplitBill.findById(splitBillId).populate('participants.userId');
      if (!splitBill) {
        throw new Error('Split bill not found');
      }

      const reminders = [];
      const now = new Date();

      // Default reminder settings
      const settings = {
        enablePaymentDueReminders: reminderSettings.enablePaymentDueReminders !== false,
        enableSettlementReminders: reminderSettings.enableSettlementReminders !== false,
        enableOverdueReminders: reminderSettings.enableOverdueReminders !== false,
        paymentDueReminderHours: reminderSettings.paymentDueReminderHours || 24,
        settlementReminderDays: reminderSettings.settlementReminderDays || 7,
        overdueReminderDays: reminderSettings.overdueReminderDays || 3,
        ...reminderSettings
      };

      // Schedule payment due reminders
      if (settings.enablePaymentDueReminders) {
        const paymentDueTime = new Date(splitBill.createdAt.getTime() + (settings.paymentDueReminderHours * 60 * 60 * 1000));

        if (paymentDueTime > now) {
          splitBill.participants.forEach(participant => {
            if (participant.amountOwed > 0) {
              reminders.push({
                userId: participant.userId._id,
                type: 'payment_due',
                message: `Payment of ₹${participant.amountOwed} is due for "${splitBill.description}"`,
                scheduledFor: paymentDueTime,
                escalationLevel: 1
              });
            }
          });
        }
      }

      // Schedule settlement reminders
      if (settings.enableSettlementReminders) {
        const settlementTime = new Date(splitBill.createdAt.getTime() + (settings.settlementReminderDays * 24 * 60 * 60 * 1000));

        if (settlementTime > now) {
          splitBill.participants.forEach(participant => {
            if (participant.amountOwed > 0) {
              reminders.push({
                userId: participant.userId._id,
                type: 'settlement_reminder',
                message: `Settlement reminder: ₹${participant.amountOwed} still pending for "${splitBill.description}"`,
                scheduledFor: settlementTime,
                escalationLevel: 1
              });
            }
          });
        }
      }

      // Add reminders to split bill
      splitBill.reminders = [...(splitBill.reminders || []), ...reminders];
      await splitBill.save();

      return reminders;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw error;
    }
  }

  // Process due reminders
  async processDueReminders() {
    try {
      const now = new Date();

      // Find all split bills with due reminders
      const splitBills = await SplitBill.find({
        'reminders.scheduledFor': { $lte: now },
        'reminders.sentAt': null
      }).populate('participants.userId');

      for (const splitBill of splitBills) {
        const dueReminders = splitBill.reminders.filter(
          reminder => reminder.scheduledFor <= now && !reminder.sentAt
        );

        for (const reminder of dueReminders) {
          await this.sendReminder(reminder, splitBill);
        }
      }

      return { processed: splitBills.length };
    } catch (error) {
      console.error('Error processing due reminders:', error);
      throw error;
    }
  }

  // Send individual reminder
  async sendReminder(reminder, splitBill) {
    try {
      const user = await User.findById(reminder.userId);
      if (!user) return;

      // Send push notification
      await sendNotification({
        userId: user._id,
        title: this.getReminderTitle(reminder.type),
        body: reminder.message,
        data: {
          type: 'split_bill_reminder',
          splitBillId: splitBill._id,
          reminderType: reminder.type
        }
      });

      // Mark reminder as sent
      reminder.sentAt = new Date();
      await splitBill.save();

      // Schedule escalation if overdue
      if (reminder.type === 'overdue_payment' && reminder.escalationLevel < 3) {
        await this.scheduleEscalationReminder(splitBill._id, reminder);
      }

    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  // Schedule escalation reminder
  async scheduleEscalationReminder(splitBillId, originalReminder) {
    try {
      const splitBill = await SplitBill.findById(splitBillId);
      if (!splitBill) return;

      const escalationTime = new Date(Date.now() + this.reminderIntervals[originalReminder.type]);
      const escalationMessage = this.getEscalationMessage(originalReminder);

      const escalationReminder = {
        userId: originalReminder.userId,
        type: 'overdue_payment',
        message: escalationMessage,
        scheduledFor: escalationTime,
        escalationLevel: originalReminder.escalationLevel + 1
      };

      splitBill.reminders.push(escalationReminder);
      await splitBill.save();

    } catch (error) {
      console.error('Error scheduling escalation reminder:', error);
    }
  }

  // Mark reminder as read
  async markReminderAsRead(splitBillId, reminderId, userId) {
    try {
      const splitBill = await SplitBill.findById(splitBillId);
      if (!splitBill) return false;

      const reminder = splitBill.reminders.id(reminderId);
      if (!reminder || reminder.userId.toString() !== userId.toString()) {
        return false;
      }

      reminder.isRead = true;
      reminder.readAt = new Date();
      await splitBill.save();

      return true;
    } catch (error) {
      console.error('Error marking reminder as read:', error);
      return false;
    }
  }

  // Get reminder title based on type
  getReminderTitle(type) {
    const titles = {
      payment_due: 'Payment Due',
      settlement_reminder: 'Settlement Reminder',
      overdue_payment: 'Overdue Payment'
    };
    return titles[type] || 'Split Bill Reminder';
  }

  // Get escalation message
  getEscalationMessage(reminder) {
    const messages = {
      2: `URGENT: Payment of ₹${reminder.message.match(/₹(\d+)/)?.[1] || 'amount'} is overdue. Please settle immediately.`,
      3: `FINAL NOTICE: Payment is severely overdue. Group settlement may be affected.`
    };
    return messages[reminder.escalationLevel + 1] || reminder.message;
  }

  // Get user's reminders
  async getUserReminders(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;

      const matchConditions = {
        'reminders.userId': userId
      };

      if (unreadOnly) {
        matchConditions['reminders.isRead'] = false;
      }

      const splitBills = await SplitBill.find(matchConditions)
        .populate('participants.userId', 'name email')
        .select('description totalAmount currency reminders createdAt')
        .sort({ 'reminders.scheduledFor': -1 })
        .limit(limit)
        .skip(offset);

      const userReminders = [];

      splitBills.forEach(splitBill => {
        splitBill.reminders.forEach(reminder => {
          if (reminder.userId.toString() === userId.toString()) {
            userReminders.push({
              id: reminder._id,
              splitBillId: splitBill._id,
              type: reminder.type,
              message: reminder.message,
              scheduledFor: reminder.scheduledFor,
              sentAt: reminder.sentAt,
              isRead: reminder.isRead,
              readAt: reminder.readAt,
              escalationLevel: reminder.escalationLevel,
              splitBill: {
                description: splitBill.description,
                totalAmount: splitBill.totalAmount,
                currency: splitBill.currency,
                createdAt: splitBill.createdAt
              }
            });
          }
        });
      });

      return userReminders;
    } catch (error) {
      console.error('Error getting user reminders:', error);
      throw error;
    }
  }

  // Update reminder settings for a split bill
  async updateReminderSettings(splitBillId, userId, settings) {
    try {
      const splitBill = await SplitBill.findById(splitBillId);
      if (!splitBill) {
        throw new Error('Split bill not found');
      }

      // Remove existing reminders for this user
      splitBill.reminders = splitBill.reminders.filter(
        reminder => reminder.userId.toString() !== userId.toString()
      );

      // Schedule new reminders with updated settings
      const newReminders = await this.scheduleReminders(splitBillId, settings);

      return newReminders;
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  }
}

module.exports = new ReminderService();