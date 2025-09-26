import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface CategoryBreakdownChartProps {
  data: any[];
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ data }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Breakdown</Text>
      <View style={[styles.chartContainer, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        <PieChart
          data={data}
          width={screenWidth - 60}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(${theme.text ? parseInt(theme.text.slice(1, 3), 16) : 30}, ${theme.text ? parseInt(theme.text.slice(3, 5), 16) : 41}, ${theme.text ? parseInt(theme.text.slice(5, 7), 16) : 59}, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default CategoryBreakdownChart;