import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  searchContainer: { 
    marginTop: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  tabsContainer: { 
    marginTop: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { 
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: { 
    flex: 1,
    marginTop: 8,
  },
  emptyContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: { 
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default styles;
