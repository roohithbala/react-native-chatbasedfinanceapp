const SplitBill = require('../models/SplitBill');
const {
  validateReminderData,
  isAuthorizedToSendReminders
} = require('../utils/paymentUtils');

/**
 * Add payment reminder
 */
async function addPaymentReminder(req, res) {
  try {
    const { splitBillId } = req.params;
    const { userId, type, message } = req.body;

    // Validate input data
    const validation = validateReminderData({ splitBillId, userId, type, message });
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validation.errors.join(', ')
      });
    }

    const splitBill = await SplitBill.findById(splitBillId);

    if (!splitBill) {
      return res.status(404).json({
        status: 'error',
        message: 'Split bill not found'
      });
    }

    // Only creator can send reminders
    if (!isAuthorizedToSendReminders(splitBill, req.userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the bill creator can send reminders'
      });
    }

    await splitBill.addReminder(userId, type, message);

    res.json({
      status: 'success',
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    console.error('Add reminder error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
}

module.exports = {
  addPaymentReminder
};