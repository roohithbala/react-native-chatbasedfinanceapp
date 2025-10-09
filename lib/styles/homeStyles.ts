import { StyleSheet } from 'react-native';

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: theme.error, textAlign: 'center' },
  loadingText: { fontSize: 16, color: theme.textSecondary, marginTop: 16, textAlign: 'center' },
  retryButton: { backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  retryButtonText: { color: theme.surface, fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
});

export default getStyles;
