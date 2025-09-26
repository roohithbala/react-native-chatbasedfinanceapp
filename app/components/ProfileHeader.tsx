import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface ProfileHeaderProps {
  currentUser: any;
  totalExpenses: number;
  totalSplitBills: number;
  groupsCount: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  currentUser,
  totalExpenses,
  totalSplitBills,
  groupsCount,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <LinearGradient colors={[theme.primary, theme.primaryLight]} style={styles.header}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[theme.surface, theme.surfaceSecondary]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {currentUser.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userEmail}>{currentUser.email}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{theme.currency}{totalExpenses.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalSplitBills}</Text>
          <Text style={styles.statLabel}>Split Bills</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{groupsCount}</Text>
          <Text style={styles.statLabel}>Groups</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.surface,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: theme.surfaceSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface + '40', // 40% opacity
    borderRadius: 16,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.surface,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.surfaceSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.surfaceSecondary + '60', // 60% opacity
    marginHorizontal: 16,
  },
});

export default ProfileHeader;