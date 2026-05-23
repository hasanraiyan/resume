import {
  createDeleteTransactionTool,
  createUpdateTransactionTool,
  createGetTransactionsTool,
} from './finance-tools';
import * as service from '@/lib/apps/pocketly/service/service';

jest.mock('@/lib/apps/pocketly/service/service');

describe('Finance Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDeleteTransactionTool', () => {
    it('should ask for confirmation when confirmed=false', async () => {
      const tool = createDeleteTransactionTool();
      const result = await tool.invoke({
        transactionId: '507f1f77bcf86cd799439011',
        confirmed: false,
      });

      expect(result).toContain('requiresConfirmation');
      expect(result).toContain('Please confirm');
      expect(service.deleteTransaction).not.toHaveBeenCalled();
    });

    it('should delete transaction when confirmed=true', async () => {
      service.deleteTransaction.mockResolvedValue(true);

      const tool = createDeleteTransactionTool();
      const result = await tool.invoke({
        transactionId: '507f1f77bcf86cd799439011',
        confirmed: true,
      });

      expect(service.deleteTransaction).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toContain('deleted successfully');
    });

    it('should throw error if transaction not found during deletion', async () => {
      service.deleteTransaction.mockResolvedValue(false);

      const tool = createDeleteTransactionTool();
      await expect(
        tool.invoke({ transactionId: '507f1f77bcf86cd799439011', confirmed: true })
      ).rejects.toThrow('not found or already deleted');
    });

    it('should default confirmed to false', async () => {
      const tool = createDeleteTransactionTool();
      const result = await tool.invoke({ transactionId: '507f1f77bcf86cd799439011' });

      expect(result).toContain('requiresConfirmation');
    });
  });

  describe('createUpdateTransactionTool', () => {
    it('should ask for confirmation when confirmed=false', async () => {
      const tool = createUpdateTransactionTool();
      const result = await tool.invoke({
        transactionId: '507f1f77bcf86cd799439011',
        description: 'Updated description',
        confirmed: false,
      });

      expect(result).toContain('requiresConfirmation');
      expect(result).toContain('Please confirm');
      expect(service.updateTransaction).not.toHaveBeenCalled();
    });

    it('should update transaction when confirmed=true', async () => {
      const mockUpdated = {
        description: 'Updated description',
        amount: 100,
        date: '2024-05-20',
        category: { name: 'Food & Dining' },
        account: { name: 'PNB' },
      };

      service.updateTransaction.mockResolvedValue(mockUpdated);

      const tool = createUpdateTransactionTool();
      const result = await tool.invoke({
        transactionId: '507f1f77bcf86cd799439011',
        description: 'Updated description',
        confirmed: true,
      });

      expect(service.updateTransaction).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        description: 'Updated description',
      });
      expect(result).toContain('updated successfully');
    });

    it('should update amount when confirmed=true', async () => {
      const mockUpdated = {
        description: 'Test',
        amount: 150,
        date: '2024-05-20',
        category: { name: 'Food & Dining' },
        account: { name: 'PNB' },
      };

      service.updateTransaction.mockResolvedValue(mockUpdated);

      const tool = createUpdateTransactionTool();
      const result = await tool.invoke({
        transactionId: '507f1f77bcf86cd799439011',
        amount: 150,
        confirmed: true,
      });

      expect(service.updateTransaction).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        amount: 150,
      });
      expect(result).toContain('updated successfully');
    });

    it('should throw error if no fields to update', async () => {
      const tool = createUpdateTransactionTool();
      await expect(
        tool.invoke({
          transactionId: '507f1f77bcf86cd799439011',
          confirmed: true,
        })
      ).rejects.toThrow('No fields to update provided');
    });

    it('should default confirmed to false', async () => {
      const tool = createUpdateTransactionTool();
      const result = await tool.invoke({
        transactionId: '507f1f77bcf86cd799439011',
        description: 'Updated description',
      });

      expect(result).toContain('requiresConfirmation');
    });
  });

  describe('createGetTransactionsTool', () => {
    it('should get transactions with date filtering', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'expense',
          amount: 84,
          description: 'Smart Mart',
          category: { name: 'Food & Dining' },
          account: { name: 'PNB' },
          date: '2024-05-20',
        },
      ];

      service.getTransactions.mockResolvedValue(mockTransactions);

      const tool = createGetTransactionsTool();
      const result = await tool.invoke({
        startDate: '2024-05-20',
        endDate: '2024-05-20',
      });

      expect(service.getTransactions).toHaveBeenCalledWith({
        type: undefined,
        limit: 20,
        startDate: '2024-05-20',
        endDate: '2024-05-20',
        account: undefined,
        category: undefined,
      });
      expect(result).toContain('Smart Mart');
    });

    it('should get transactions with category filter', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'expense',
          amount: 84,
          description: 'Smart Mart',
          category: { name: 'Food & Dining' },
          account: { name: 'PNB' },
          date: '2024-05-20',
        },
      ];

      service.getTransactions.mockResolvedValue(mockTransactions);

      const tool = createGetTransactionsTool();
      const result = await tool.invoke({
        category: '507f1f77bcf86cd799439011',
      });

      expect(service.getTransactions).toHaveBeenCalledWith({
        type: undefined,
        limit: 20,
        startDate: undefined,
        endDate: undefined,
        account: undefined,
        category: '507f1f77bcf86cd799439011',
      });
      expect(result).toContain('Smart Mart');
    });

    it('should get transactions with account filter', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'expense',
          amount: 84,
          description: 'Smart Mart',
          category: { name: 'Food & Dining' },
          account: { name: 'PNB' },
          date: '2024-05-20',
        },
      ];

      service.getTransactions.mockResolvedValue(mockTransactions);

      const tool = createGetTransactionsTool();
      const result = await tool.invoke({
        account: '507f1f77bcf86cd799439012',
      });

      expect(service.getTransactions).toHaveBeenCalledWith({
        type: undefined,
        limit: 20,
        startDate: undefined,
        endDate: undefined,
        account: '507f1f77bcf86cd799439012',
        category: undefined,
      });
      expect(result).toContain('Smart Mart');
    });
  });
});
