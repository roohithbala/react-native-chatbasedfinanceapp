import api from './apiConfig';

// Expenses API
export const expensesAPI = {
  getExpenses: async (params?: any) => {
    try {
      console.log('🔍 Starting expenses API call...');
      console.log('Calling expenses API with params:', params);
      const response = await api.get('/expenses', { params });
      console.log('✅ Expenses API call completed');
      console.log('Expenses API raw response:', response);
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : []);
      console.log('Response headers:', response.headers);

      // Check if response.data is a string (HTML error page)
      if (typeof response.data === 'string') {
        console.error('Received string response instead of JSON object:', response.data.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }

      // Simple validation - handle the standard backend response format
      if (!response.data) {
        console.warn('No response data from expenses API');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }

      // The backend returns: { status: 'success', data: { expenses: [...], totalPages: X, currentPage: X, total: X }, message: '...' }
      let expensesData;
      if (response.data && response.data.data && response.data.data.expenses) {
        // Backend response format: { status: 'success', data: { expenses: [...], ... }, message: '...' }
        expensesData = response.data.data;
        console.log('Using nested data format from backend');
      } else if (response.data && response.data.expenses) {
        // Alternative format: { expenses: [...], totalPages: X, ... }
        expensesData = response.data;
        console.log('Using direct data format from backend');
      } else if (response.data && response.data.status === 'success' && !response.data.data) {
        // Empty success response
        console.log('Received empty success response from backend');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      } else {
        console.warn('Unexpected response format from expenses API:', response.data);
        console.warn('Response structure:', {
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          dataType: typeof response.data,
          fullResponse: response
        });
        // Instead of returning empty data, let's try to extract expenses from any possible location
        const possibleExpenses = response.data?.data?.expenses || response.data?.expenses || [];
        if (Array.isArray(possibleExpenses)) {
          console.log('Found expenses in alternative location, using them');
          return {
            expenses: possibleExpenses,
            totalPages: response.data?.data?.totalPages || response.data?.totalPages || 0,
            currentPage: response.data?.data?.currentPage || response.data?.currentPage || 1,
            total: response.data?.data?.total || response.data?.total || 0
          };
        }
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }

      const { expenses, totalPages, currentPage, total } = expensesData;

      // Ensure expenses is always an array
      const expensesArray = Array.isArray(expenses) ? expenses : [];

      console.log(`Processing ${expensesArray.length} expenses from API response`);
      console.log('Expenses data structure:', {
        expensesCount: expensesArray.length,
        totalPages: totalPages || 0,
        currentPage: currentPage || 1,
        total: total || 0,
        firstExpense: expensesArray[0] ? {
          id: expensesArray[0]._id,
          description: expensesArray[0].description,
          amount: expensesArray[0].amount
        } : null
      });

      // Basic validation - only check for required fields if we have data
      if (expensesArray.length > 0) {
        const validExpenses = expensesArray.filter(expense => {
          const hasId = expense && (expense._id || expense.id);
          const hasDescription = expense && expense.description;
          const hasAmount = expense && typeof expense.amount === 'number';

          if (!hasId) {
            console.warn('Expense missing ID:', expense);
          }
          if (!hasDescription) {
            console.warn('Expense missing description:', expense);
          }
          if (!hasAmount) {
            console.warn('Expense missing valid amount:', expense);
          }

          return hasId && hasDescription && hasAmount;
        });

        console.log(`Validated ${validExpenses.length} out of ${expensesArray.length} expenses`);

        return {
          expenses: validExpenses,
          totalPages: totalPages || 0,
          currentPage: currentPage || 1,
          total: total || 0
        };
      }

      console.log(`Returning ${expensesArray.length} expenses (no validation needed)`);

      return {
        expenses: expensesArray,
        totalPages: totalPages || 0,
        currentPage: currentPage || 1,
        total: total || 0
      };
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        dataType: typeof error.response?.data,
        fullError: error
      });

      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for expenses API');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0,
          rateLimited: true
        };
      }

      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        console.warn('Authentication error - user may need to log in again');
        // Don't throw, return empty data to prevent app crash
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0,
          authError: true
        };
      }

      // Handle server errors (4xx, 5xx) by returning empty data instead of throwing
      if (error.response && error.response.status >= 400) {
        console.warn('Server error fetching expenses:', error.response.status, error.response.statusText);
        console.warn('Server response data:', error.response.data);
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0,
          serverError: true,
          errorStatus: error.response.status
        };
      }

      // Handle network errors
      if (error.name === 'NetworkError' || !error.response) {
        console.warn('Network error fetching expenses, returning empty data');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0,
          networkError: true
        };
      }

      // For other errors, still return empty data but log the error
      console.error('Non-network error in expenses API, returning empty data:', error.message);
      return {
        expenses: [],
        totalPages: 0,
        currentPage: 1,
        total: 0,
        unknownError: true
      };
    }
  },

  addExpense: async (expenseData: any) => {
    const response = await api.post('/expenses', expenseData);

    // Handle backend response format: { message: '...', data: expense }
    if (response.data && response.data.data) {
      return response.data;
    }

    // Fallback for unexpected response format
    return response.data;
  },

  updateExpense: async (id: string, expenseData: any) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  getStats: async (period?: string) => {
    const response = await api.get('/expenses/stats', { params: { period } });
    return response.data;
  },

  resetExpenses: async () => {
    try {
      const response = await api.delete('/expenses/reset');
      return response.data;
    } catch (error: any) {
      console.error('Error resetting expenses:', error);
      throw error;
    }
  },
};