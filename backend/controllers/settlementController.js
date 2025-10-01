const SplitBill = require('../models/SplitBill');
const Group = require('../models/Group');
const {
  isValidObjectId,
  isAuthorizedForSplitBill,
  isGroupMember,
  buildDetailedSplitBillResponse
} = require('../utils/paymentUtils');

/**
 * Get payment summary for a split bill
 */
async function getPaymentSummary(req, res) {
  try {
    const { splitBillId } = req.params;

    if (!isValidObjectId(splitBillId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid split bill ID'
      });
    }

    const splitBill = await SplitBill.findById(splitBillId)
      .populate('participants.userId', 'name avatar')
      .populate('createdBy', 'name avatar')
      .populate('payments.fromUserId', 'name')
      .populate('payments.toUserId', 'name')
      .populate('payments.confirmedBy.userId', 'name');

    if (!splitBill) {
      return res.status(404).json({
        status: 'error',
        message: 'Split bill not found'
      });
    }

    // Check if user is authorized
    if (!isAuthorizedForSplitBill(splitBill, req.userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this split bill'
      });
    }

    const summary = splitBill.getPaymentSummary();
    const debts = splitBill.getDebts();

    res.json({
      status: 'success',
      data: {
        splitBill: buildDetailedSplitBillResponse(splitBill),
        summary,
        debts
      }
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

/**
 * Get group settlement plan
 */
async function getGroupSettlement(req, res) {
  try {
    const { groupId } = req.params;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user is member of the group
    if (!isGroupMember(group, req.userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view group settlement'
      });
    }

    const settlement = await SplitBill.calculateGroupSettlement(groupId);

    res.json({
      status: 'success',
      data: {
        settlement,
        group: {
          _id: group._id,
          name: group.name
        }
      }
    });
  } catch (error) {
    console.error('Get group settlement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
}

module.exports = {
  getPaymentSummary,
  getGroupSettlement
};