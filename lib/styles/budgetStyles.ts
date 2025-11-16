import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  viewModeSelector: { flexDirection: 'row', padding: 16, marginHorizontal: 16, marginTop: 8, borderRadius: 8 },
  viewModeButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 },
  selectedViewModeButton: { },
  viewModeButtonText: { fontSize: 14, fontWeight: '500' },
  selectedViewModeButtonText: { fontWeight: '600' },
  categoriesSection: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  stickyPeriodHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E6E9EE',
    // keep header compact
  },
  stickyPeriodTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stickyPeriodSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  periodSelector: { padding: 16, borderRadius: 8, margin: 16 },
  periodButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  periodButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  selectedPeriodButton: { backgroundColor: '#007bff' },
  periodButtonText: { fontSize: 16, fontWeight: '500' },
  selectedPeriodButtonText: { color: '#fff' },
  dateSelectors: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateButton: { padding: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateButtonText: { fontSize: 16, fontWeight: '500' },
  dateDisplay: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1 },
  dateText: { fontSize: 16, fontWeight: 'bold' },
  dropdownIcon: { marginLeft: 8, fontSize: 12 },
  monthPicker: { marginTop: 8, borderRadius: 8, borderWidth: 1, padding: 16 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthButton: { width: '30%', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  selectedMonthButton: { backgroundColor: '#007bff' },
  monthButtonText: { fontSize: 14, fontWeight: '500' },
  selectedMonthButtonText: { color: '#fff' },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  analyticsButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  analyticsButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  settingsButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  settingsButtonText: { fontSize: 14, fontWeight: '500' },
  analyticsModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
});

export default styles;
