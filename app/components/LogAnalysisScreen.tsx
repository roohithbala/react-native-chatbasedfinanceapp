import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import logAnalysisService from '../../lib/services/logAnalysisService';

interface LogAnalysisScreenProps {
  onClose: () => void;
}

const LogAnalysisScreen: React.FC<LogAnalysisScreenProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const [logContent, setLogContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyzeLogs = async () => {
    if (!logContent.trim()) {
      Alert.alert('Error', 'Please enter log content to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await logAnalysisService.analyzeLogs(logContent);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Log analysis failed:', error);
      Alert.alert('Analysis Failed', 'Unable to analyze logs. Please check your OpenRouter API key configuration.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setLogContent('');
    setAnalysisResult(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Log Analysis</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Paste your log content here:</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            multiline
            placeholder="Paste error logs, console output, or app logs here..."
            placeholderTextColor={theme.textSecondary}
            value={logContent}
            onChangeText={setLogContent}
            textAlignVertical="top"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.analyzeButton, { backgroundColor: theme.primary }]}
              onPress={handleAnalyzeLogs}
              disabled={isAnalyzing || !logContent.trim()}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="analytics" size={20} color="white" />
                  <Text style={styles.buttonText}>Analyze Logs</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={handleClear}
            >
              <Ionicons name="trash" size={20} color={theme.text} />
              <Text style={[styles.buttonText, { color: theme.text }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {analysisResult && (
          <View style={styles.resultsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Analysis Results</Text>

            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {analysisResult.summary.totalEntries}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Entries</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#EF4444' }]}>
                    {analysisResult.summary.errorCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Errors</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                    {analysisResult.summary.warningCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Warnings</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#10B981' }]}>
                    {analysisResult.summary.issuesFound}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Issues Found</Text>
                </View>
              </View>
            </View>

            {/* Sanitization Info */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Data Sanitization</Text>
              <Text style={[styles.cardText, { color: theme.textSecondary }]}>
                Removed {analysisResult.sanitizedLog.removedItems.length} sensitive items from logs
              </Text>
              {analysisResult.sanitizedLog.removedItems.length > 0 && (
                <Text style={[styles.removedItems, { color: theme.textSecondary }]}>
                  Items removed: {analysisResult.sanitizedLog.removedItems.join(', ')}
                </Text>
              )}
            </View>

            {/* Issues Found */}
            {analysisResult.analysis.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Issues Identified</Text>
                {analysisResult.analysis.map((issue: any, index: number) => (
                  <View key={index} style={[styles.issueItem, { borderLeftColor: getSeverityColor(issue.severity) }]}>
                    <View style={styles.issueHeader}>
                      <Text style={[styles.issueType, { color: theme.text }]}>{issue.issue_type}</Text>
                      <Text style={[styles.severity, { color: getSeverityColor(issue.severity) }]}>
                        {issue.severity}
                      </Text>
                    </View>
                    <Text style={[styles.rootCause, { color: theme.textSecondary }]}>
                      {issue.root_cause}
                    </Text>
                    <Text style={[styles.suggestedFix, { color: theme.primary }]}>
                      💡 {issue.suggested_fix}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {analysisResult.analysis.length === 0 && (
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.noIssues, { color: theme.textSecondary }]}>
                  ✅ No significant issues detected in the provided logs.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
    default: return '#64748B';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  analyzeButton: {
    backgroundColor: '#3B82F6',
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  removedItems: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  issueItem: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueType: {
    fontSize: 16,
    fontWeight: '600',
  },
  severity: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rootCause: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  suggestedFix: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  noIssues: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default LogAnalysisScreen;