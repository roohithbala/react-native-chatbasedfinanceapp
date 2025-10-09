import { StyleSheet } from 'react-native';

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: theme.error, textAlign: 'center' },
  content: { flex: 1, padding: 20 },
  versionText: { textAlign: 'center', fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
});

export default getStyles;
