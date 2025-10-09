// Split Bill Validator - Data validation logic
import { CreateSplitBillParams } from './SplitBillTypes';

export class SplitBillValidator {
  static validateCreateSplitBillData(data: CreateSplitBillParams): void {
    if (!data.description || !data.description.trim()) {
      throw new Error('Description is required');
    }
    if (!data.totalAmount || data.totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }
    if (!data.participants || !Array.isArray(data.participants) || data.participants.length === 0) {
      throw new Error('At least one participant is required');
    }

    // Validate participants
    for (const participant of data.participants) {
      if (!participant.userId || !participant.amount || participant.amount <= 0) {
        throw new Error('Each participant must have a valid userId and amount greater than 0');
      }
    }

    // Validate total amount matches sum of participant amounts
    const totalParticipantAmount = data.participants.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(data.totalAmount - totalParticipantAmount) > 0.01) {
      console.warn('Amount mismatch:', { totalAmount: data.totalAmount, participantSum: totalParticipantAmount });
      throw new Error(`Total amount (${data.totalAmount}) must equal sum of participant amounts (${totalParticipantAmount})`);
    }
  }

  static validateSplitBillId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Valid split bill ID is required');
    }
  }

  static validateGroupId(groupId: string): void {
    if (!groupId || typeof groupId !== 'string' || groupId.trim().length === 0) {
      throw new Error('Valid group ID is required');
    }
  }
}