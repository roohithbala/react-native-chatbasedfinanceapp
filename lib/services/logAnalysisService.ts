import { openRouterAIService, LogAnalysis } from './openRouterAIService';

/**
 * Log Analysis Service for debugging and error analysis
 * Based on the Python Flask log analysis implementation
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  source?: string;
  userId?: string;
}

export interface SanitizedLog {
  original: string;
  sanitized: string;
  removedItems: string[];
  analysis?: LogAnalysis;
}

class LogAnalysisService {
  /**
   * Sanitize sensitive data from logs using patterns similar to the Python implementation
   */
  sanitizeLogContent(logContent: string): SanitizedLog {
    const removedItems: string[] = [];

    // Comprehensive removal patterns (adapted from Python code)
    const removalPatterns: { [key: string]: string } = {
      // Credit card information
      '\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b': '[REMOVED_CC_NUMBER]',
      '\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{3}\\b': '[REMOVED_CC_NUMBER]',

      // CVV/Security codes
      '(?i)(?:cvv|cvc|security code)[:=\\s]*\\d{3,4}\\b': '[REMOVED_CVV]',

      // Email addresses
      '\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b': '[REMOVED_EMAIL]',

      // Phone numbers
      '\\+\\d{1,4}[\\s.-]?\\(?\\d{1,4}\\)?[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,4}\\b': '[REMOVED_PHONE]',

      // API keys and tokens
      '\\b[a-zA-Z0-9_-]{32,}\\b': '[REMOVED_API_KEY]',
      'eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]*\\.?[a-zA-Z0-9_-]*': '[REMOVED_JWT]',

      // IP addresses
      '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b': '[REMOVED_IP]',

      // Passwords
      '(?i)password[:=\\s]*[^\\s"&]+': '[REMOVED_PASSWORD]',

      // User IDs and personal data
      '(?i)"userId"\\s*:\\s*"[^"]*"': '[REMOVED_USER_ID]',
      '(?i)"email"\\s*:\\s*"[^"]*"': '[REMOVED_EMAIL]',

      // Database URIs
      '(?:postgres|mysql|mongodb)://[^\\s]+': '[REMOVED_DB_URI]',

      // Session tokens
      '(?i)session_[a-zA-Z0-9_-]+': '[REMOVED_SESSION_KEY]',
    };

    let sanitized = logContent;

    // Apply all patterns
    Object.entries(removalPatterns).forEach(([pattern, replacement]) => {
      const regex = new RegExp(pattern, 'gi');
      const matches = sanitized.match(regex);
      if (matches) {
        removedItems.push(...matches);
        sanitized = sanitized.replace(regex, replacement);
      }
    });

    return {
      original: logContent,
      sanitized,
      removedItems: [...new Set(removedItems)], // Remove duplicates
    };
  }

  /**
   * Parse log content into structured entries
   */
  parseLogs(logContent: string): LogEntry[] {
    const lines = logContent.split('\n');
    const entries: LogEntry[] = [];

    const logPattern = /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)?\s*\[?(\w+)\]?\s*(ERROR|WARN|INFO|DEBUG|LOG)[:\s]*(.+)$/i;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(logPattern);
      if (match) {
        const [, timestamp, source, level, message] = match;
        entries.push({
          id: `log_${index}`,
          timestamp: timestamp || new Date().toISOString(),
          level: (level.toUpperCase() as LogEntry['level']) || 'INFO',
          message: message.trim(),
          source: source || 'unknown',
        });
      } else {
        // Fallback for unstructured logs
        entries.push({
          id: `log_${index}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: trimmed,
          source: 'unknown',
        });
      }
    });

    return entries;
  }

  /**
   * Analyze logs for errors and issues using OpenRouter AI
   */
  async analyzeLogs(logContent: string): Promise<{
    sanitizedLog: SanitizedLog;
    analysis: LogAnalysis[];
    summary: {
      totalEntries: number;
      errorCount: number;
      warningCount: number;
      issuesFound: number;
    };
  }> {
    // Sanitize the logs first
    const sanitizedLog = this.sanitizeLogContent(logContent);

    // Parse into structured entries
    const logEntries = this.parseLogs(sanitizedLog.sanitized);

    // Extract error messages for AI analysis
    const errorMessages = logEntries
      .filter(entry => entry.level === 'ERROR')
      .map(entry => entry.message)
      .slice(0, 10); // Limit to first 10 errors

    // Analyze with AI
    const analysis = await openRouterAIService.analyzeFinancialLogs(errorMessages);

    // Generate summary
    const summary = {
      totalEntries: logEntries.length,
      errorCount: logEntries.filter(e => e.level === 'ERROR').length,
      warningCount: logEntries.filter(e => e.level === 'WARN').length,
      issuesFound: analysis.length,
    };

    return {
      sanitizedLog,
      analysis,
      summary,
    };
  }

  /**
   * Get financial insights from app usage logs
   */
  async analyzeAppUsageLogs(logContent: string): Promise<{
    insights: string[];
    recommendations: string[];
    patterns: string[];
  }> {
    const sanitizedLog = this.sanitizeLogContent(logContent);

    try {
      const prompt = `Analyze these mobile app usage logs for user behavior patterns and provide insights:

${sanitizedLog.sanitized}

Focus on:
1. User interaction patterns
2. Feature usage frequency
3. Error patterns
4. Performance issues
5. User flow problems

Return a JSON object with:
- insights: Array of key insights about user behavior
- recommendations: Array of improvement suggestions
- patterns: Array of identified usage patterns`;

      const response = await openRouterAIService.makeOpenRouterRequest([
        { role: "user", content: prompt }
      ]);

      const parsed = JSON.parse(response);
      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        patterns: parsed.patterns || [],
      };
    } catch (error) {
      console.error('App usage log analysis failed:', error);
      return {
        insights: ['Unable to analyze usage patterns at this time'],
        recommendations: ['Ensure logs are properly formatted for analysis'],
        patterns: ['Basic pattern analysis unavailable'],
      };
    }
  }

  /**
   * Export sanitized logs for debugging
   */
  exportSanitizedLogs(logs: LogEntry[]): string {
    return logs.map(entry =>
      `[${entry.timestamp}] [${entry.level}] ${entry.source ? `[${entry.source}] ` : ''}${entry.message}`
    ).join('\n');
  }
}

export const logAnalysisService = new LogAnalysisService();
export default logAnalysisService;