import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface SpendingTrendChartProps {
  data: any;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ data }) => {
  const { theme } = useTheme();
  
  // Extract primary color components for rgba
  const primaryColor = theme.primary || '#2563EB';
  const primaryR = parseInt(primaryColor.slice(1, 3), 16);
  const primaryG = parseInt(primaryColor.slice(3, 5), 16);
  const primaryB = parseInt(primaryColor.slice(5, 7), 16);
  
  const chartConfig = {
    backgroundColor: theme.surface || '#ffffff',
    backgroundGradientFrom: theme.surface || '#ffffff',
    backgroundGradientTo: theme.surface || '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.text ? parseInt(theme.text.slice(1, 3), 16) : 30}, ${theme.text ? parseInt(theme.text.slice(3, 5), 16) : 41}, ${theme.text ? parseInt(theme.text.slice(5, 7), 16) : 59}, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: primaryColor,
      fill: primaryColor,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: theme.border || '#E2E8F0',
    },
  };
  
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending Trend</Text>
      <View style={[styles.chartContainer, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        <LineChart
          data={data}
          width={screenWidth - 60}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
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
  chart: {
    borderRadius: 16,
  },
});

export default SpendingTrendChart;