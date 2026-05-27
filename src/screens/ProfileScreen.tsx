import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { useQuests } from '../hooks/useQuests';
import { logout } from '../services/authService';
import { getUser } from '../services/userService';
import { User } from '../models/User';
import { getLevelFromXP, getLevelProgress, getXPToNextLevel, getLevelTitle } from '../utils/xpCalculator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const getInitials = (name: string): string => {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const StatCard = ({ label, value, color = '#c8b8ff' }: {
  label: string; value: string | number; color?: string;
}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const XPBar = ({ xp }: { xp: number }) => {
  const progress = getLevelProgress(xp);
  const level = getLevelFromXP(xp);
  const toNext = getXPToNextLevel(xp);
  const title = getLevelTitle(level);
  return (
    <View style={styles.xpCard}>
      <View style={styles.xpHeader}>
        <View>
          <Text style={styles.xpLevel}>Level {level}</Text>
          <Text style={styles.xpTitle}>{title}</Text>
        </View>
        <Text style={styles.xpTotal}>{xp} XP</Text>
      </View>
      <View style={styles.xpBarBg}>
        <View style={[styles.xpBarFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
      <Text style={styles.xpToNext}>{toNext} XP to Level {level + 1}</Text>
    </View>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { user, isGuest, isLoggedIn } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeQuests = useQuests({ uid: user?.uid ?? null, filterStatus: 'active' });
  const completedQuests = useQuests({ uid: user?.uid ?? null, filterStatus: 'completed' });
  const bossQuests = useQuests({
    uid: user?.uid ?? null,
    filterDifficulty: 'boss_fight',
    filterStatus: 'completed',
  });

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchProfile();
    }
  }, [user, isLoggedIn]);

  const fetchProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const data = await getUser(user.uid);
      setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('logout pressed');
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.log('logout error', err);
    } finally {
      setLoggingOut(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  if (isGuest || !isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.guestState}>
          <Text style={styles.guestIcon}>🧭</Text>
          <Text style={styles.guestTitle}>You're browsing as a guest</Text>
          <Text style={styles.guestSubtitle}>
            Create an account to track your quests, earn XP, and level up!
          </Text>
          <TouchableOpacity style={styles.btnLogin} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnLoginText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnRegister} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.btnRegisterText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#c8b8ff" size="large" />
      </View>
    );
  }

  const displayName = profile?.displayName ?? user?.displayName ?? 'Adventurer';
  const email = profile?.email ?? user?.email ?? '';
  const xp = profile?.xp ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <XPBar xp={xp} />

        <Text style={styles.sectionLabel}>Quest Stats</Text>
        <View style={styles.statsRow}>
          <StatCard label="Active" value={activeQuests.quests.length} color="#7ab8f5" />
          <StatCard label="Completed" value={completedQuests.quests.length} color="#6fcf97" />
          <StatCard label="Boss Fights" value={bossQuests.quests.length} color="#f5a07a" />
        </View>

        <Text style={styles.sectionLabel}>Achievements</Text>
        <View style={styles.achievementsCard}>
          {completedQuests.quests.length >= 1 && (
            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>🗡️</Text>
              <View>
                <Text style={styles.achievementTitle}>First Blood</Text>
                <Text style={styles.achievementDesc}>Completed your first quest</Text>
              </View>
            </View>
          )}
          {completedQuests.quests.length >= 5 && (
            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>⚔️</Text>
              <View>
                <Text style={styles.achievementTitle}>Seasoned Adventurer</Text>
                <Text style={styles.achievementDesc}>Completed 5 quests</Text>
              </View>
            </View>
          )}
          {bossQuests.quests.length >= 1 && (
            <View style={styles.achievement}>
              <Text style={styles.achievementIcon}>🏆</Text>
              <View>
                <Text style={styles.achievementTitle}>Boss Slayer</Text>
                <Text style={styles.achievementDesc}>Defeated your first Boss Fight</Text>
              </View>
            </View>
          )}
          {completedQuests.quests.length === 0 && (
            <View style={styles.noAchievements}>
              <Text style={styles.noAchievementsText}>Complete quests to unlock achievements!</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btnLogout, loggingOut && styles.btnDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#e24b4a" />
          ) : (
            <Text style={styles.btnLogoutText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#c8b8ff' },
  scroll: { padding: 20, paddingBottom: 48, gap: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1e1a3a', borderWidth: 2, borderColor: '#534AB7', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#c8b8ff' },
  displayName: { fontSize: 20, fontWeight: 'bold', color: '#e8e8f0' },
  email: { fontSize: 13, color: '#555' },
  xpCard: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2a2a3e', gap: 10 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  xpLevel: { fontSize: 16, fontWeight: '700', color: '#c8b8ff' },
  xpTitle: { fontSize: 12, color: '#666', marginTop: 2 },
  xpTotal: { fontSize: 18, fontWeight: '700', color: '#534AB7' },
  xpBarBg: { height: 8, backgroundColor: '#14141f', borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: 8, backgroundColor: '#534AB7', borderRadius: 4 },
  xpToNext: { fontSize: 11, color: '#555', textAlign: 'right' },
  sectionLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: -4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3e', gap: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },
  achievementsCard: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a3e', gap: 12 },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  achievementIcon: { fontSize: 28 },
  achievementTitle: { fontSize: 14, fontWeight: '600', color: '#e8e8f0' },
  achievementDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  noAchievements: { alignItems: 'center', paddingVertical: 12 },
  noAchievementsText: { fontSize: 13, color: '#444', fontStyle: 'italic' },
  btnLogout: { borderWidth: 1, borderColor: '#e24b4a55', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnLogoutText: { color: '#e24b4a', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  guestState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  guestIcon: { fontSize: 52, marginBottom: 8 },
  guestTitle: { fontSize: 18, fontWeight: '700', color: '#aaa', textAlign: 'center' },
  guestSubtitle: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  btnLogin: { backgroundColor: '#534AB7', borderRadius: 10, paddingVertical: 13, paddingHorizontal: 48, alignItems: 'center', width: '100%' },
  btnLoginText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnRegister: { borderWidth: 1, borderColor: '#2a2a3e', borderRadius: 10, paddingVertical: 13, paddingHorizontal: 48, alignItems: 'center', width: '100%' },
  btnRegisterText: { color: '#888', fontSize: 15 },
});