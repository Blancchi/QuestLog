import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { useQuests } from '../hooks/useQuests';
import { Quest, QuestDifficulty } from '../models/Quest';
import { Timestamp } from 'firebase/firestore';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  daily: 'Daily',
  side_quest: 'Side Quest',
  boss_fight: 'Boss Fight',
};

const DIFFICULTY_COLORS: Record<QuestDifficulty, { bg: string; text: string }> = {
  daily:      { bg: '#1a2a3a', text: '#7ab8f5' },
  side_quest: { bg: '#1e1a3a', text: '#c8b8ff' },
  boss_fight: { bg: '#2a1a1a', text: '#f5a07a' },
};

const formatDeadline = (deadline: Timestamp | null): string => {
  if (!deadline) return 'No deadline';
  const date = deadline.toDate();
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMs < 0) return '⚠️ Overdue';
  if (diffHrs < 24) return `⏰ ${diffHrs}h left`;
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const QuestCard = ({ quest, onPress }: { quest: Quest; onPress: () => void }) => {
  const colors = DIFFICULTY_COLORS[quest.difficulty];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={1}>{quest.title}</Text>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {DIFFICULTY_LABELS[quest.difficulty]}
          </Text>
        </View>
      </View>
      {quest.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{quest.description}</Text>
      ) : null}
      <Text style={styles.cardDeadline}>{formatDeadline(quest.deadline)}</Text>
    </TouchableOpacity>
  );
};

const EmptyState = ({ isGuest, onLogin }: { isGuest: boolean; onLogin: () => void }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>🗺️</Text>
    <Text style={styles.emptyTitle}>No active quests</Text>
    {isGuest ? (
      <>
        <Text style={styles.emptySubtitle}>Login to start creating quests</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={onLogin}>
          <Text style={styles.emptyBtnText}>Login</Text>
        </TouchableOpacity>
      </>
    ) : (
      <Text style={styles.emptySubtitle}>Tap the + button to add your first quest</Text>
    )}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

const HomeScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { user, isGuest, isLoggedIn } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { quests, loading, error, refresh } = useQuests({
    uid: user?.uid ?? null,
    filterStatus: 'active',
    sortMode: 'newest',
  });

  const completedToday = useQuests({
    uid: user?.uid ?? null,
    filterStatus: 'completed',
    sortMode: 'newest',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    completedToday.refresh();
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.username}>
            {isGuest ? 'Adventurer' : user?.displayName ?? 'Adventurer'}
          </Text>
        </View>
        {isLoggedIn && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('CreateQuest')}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Content */}
      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} color="#c8b8ff" size="large" />
      ) : (
        <FlatList
          data={quests}
          keyExtractor={(item) => item.questId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#c8b8ff"
            />
          }
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              Active Quests ({quests.length})
            </Text>
          }
          ListEmptyComponent={
            <EmptyState
              isGuest={isGuest}
              onLogin={() => navigation.navigate('Login')}
            />
          }
          ListFooterComponent={
            completedToday.quests.length > 0 ? (
              <View style={styles.completedSection}>
                <Text style={styles.sectionTitle}>
                  Completed Today ({completedToday.quests.length})
                </Text>
                {completedToday.quests.slice(0, 3).map((q) => (
                  <TouchableOpacity
                    key={q.questId}
                    style={[styles.card, styles.cardCompleted]}
                    onPress={() =>
                      navigation.navigate('QuestDetail', { questId: q.questId })
                    }
                    activeOpacity={0.75}
                  >
                    <View style={styles.cardTop}>
                      <Text style={[styles.cardTitle, styles.cardTitleCompleted]}
                        numberOfLines={1}>
                        {q.title}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: '#1a2a1a' }]}>
                        <Text style={[styles.badgeText, { color: '#6fcf97' }]}>Done ✓</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <QuestCard
              quest={item}
              onPress={() =>
                navigation.navigate('QuestDetail', { questId: item.questId })
              }
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  greeting: {
    fontSize: 13,
    color: '#888',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c8b8ff',
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#534AB7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 30,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardCompleted: {
    opacity: 0.5,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e8e8f0',
    flex: 1,
    marginRight: 8,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  cardDesc: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardDeadline: {
    fontSize: 12,
    color: '#666',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#aaa',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: '#534AB7',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  completedSection: {
    marginTop: 24,
  },
  loader: {
    marginTop: 80,
  },
  errorBanner: {
    backgroundColor: '#2a1a1a',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e24b4a44',
  },
  errorText: {
    color: '#e24b4a',
    fontSize: 13,
    textAlign: 'center',
  },
});
