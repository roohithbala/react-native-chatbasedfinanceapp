import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';
import { useBudgetsStore } from '@/lib/store/budgetsStore';

export default function PeriodSelector() {
  const { theme } = useTheme();
  const {
    selectedPeriod,
    selectedYear,
    selectedMonth,
    setSelectedPeriod,
    setSelectedYear,
    setSelectedMonth,
    loadHistoricalBudgets,
  } = useBudgetsStore();

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const handlePeriodChange = (period: 'monthly'|'yearly') => {
    setSelectedPeriod(period);
    if (period === 'yearly') {
      loadHistoricalBudgets({ period: 'yearly', year: selectedYear });
    } else {
      loadHistoricalBudgets({ period: 'monthly', year: selectedYear, month: selectedMonth });
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (selectedPeriod === 'yearly') {
      loadHistoricalBudgets({ period: 'yearly', year });
    } else {
      loadHistoricalBudgets({ period: 'monthly', year, month: selectedMonth });
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setShowMonthPicker(false);
    if (selectedPeriod === 'monthly') {
      loadHistoricalBudgets({ period: 'monthly', year: selectedYear, month });
    }
  };

  return (
    <View style={{ padding: 16, backgroundColor: theme.card, margin: 16, borderRadius: 12 }}>
      {/* Period Toggle */}
      <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            backgroundColor: selectedPeriod === 'monthly' ? theme.primary : theme.background,
            alignItems: 'center'
          }}
          onPress={() => handlePeriodChange('monthly')}
        >
          <Text style={{ color: selectedPeriod === 'monthly' ? '#fff' : theme.text, fontWeight: '600' }}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            backgroundColor: selectedPeriod === 'yearly' ? theme.primary : theme.background,
            alignItems: 'center'
          }}
          onPress={() => handlePeriodChange('yearly')}
        >
          <Text style={{ color: selectedPeriod === 'yearly' ? '#fff' : theme.text, fontWeight: '600' }}>
            Yearly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Year Selector */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: selectedPeriod === 'monthly' ? 12 : 0 }}>
        <TouchableOpacity
          onPress={() => handleYearChange(selectedYear - 1)}
          style={{ padding: 8, backgroundColor: theme.background, borderRadius: 8 }}
        >
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>
          {selectedYear}
        </Text>
        <TouchableOpacity
          onPress={() => handleYearChange(selectedYear + 1)}
          style={{ padding: 8, backgroundColor: theme.background, borderRadius: 8 }}
          disabled={selectedYear >= new Date().getFullYear()}
        >
          <Text style={{ color: selectedYear >= new Date().getFullYear() ? theme.textSecondary : theme.text, fontSize: 18, fontWeight: 'bold' }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Month Selector (only for monthly view) */}
      {selectedPeriod === 'monthly' && (
        <>
          <TouchableOpacity
            onPress={() => setShowMonthPicker(!showMonthPicker)}
            style={{
              padding: 12,
              backgroundColor: theme.background,
              borderRadius: 8,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>
              {monthNames[selectedMonth - 1]}
            </Text>
            <Text style={{ color: theme.textSecondary }}>▼</Text>
          </TouchableOpacity>

          {showMonthPicker && (
            <View style={{ marginTop: 12, backgroundColor: theme.background, borderRadius: 8, padding: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {monthNames.map((month, index) => {
                  const monthNum = index + 1;
                  const isSelected = monthNum === selectedMonth;
                  const isFuture = selectedYear === new Date().getFullYear() && monthNum > new Date().getMonth() + 1;
                  
                  return (
                    <TouchableOpacity
                      key={month}
                      onPress={() => !isFuture && handleMonthChange(monthNum)}
                      disabled={isFuture}
                      style={{
                        width: '22%',
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: isSelected ? theme.primary : theme.card,
                        alignItems: 'center',
                        opacity: isFuture ? 0.4 : 1
                      }}
                    >
                      <Text style={{ color: isSelected ? '#fff' : theme.text, fontSize: 12, fontWeight: isSelected ? '600' : '400' }}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}
