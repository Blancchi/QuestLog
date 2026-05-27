import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { useQuests } from '../hooks/useQuests';
import { Quest, QuestDifficulty, QuestStatus } from '../models/Quest';
import { Timestamp } from 'firebase/firestore';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type SortMode = 'newest' | 'deadline';
type FilterDifficulty = QuestDifficulty | null;
type FilterStatus = QuestStatus | null;

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

const QuestCard = ({ quest, onPress }: { quest: Quest; onPress: () => void }) => {
  const diffColors = DIFFICULTY_COLORS[quest.difficulty];
  const isCompleted = quest.status === 'completed';
  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, isCompleted && styles.cardTitleDone]} numberOfLines={1}>
          {quest.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: diffColors.bg }]}>
          <Text style={[styles.badgeText, { color: diffColors.text }]}>
            {DIFFICULTY_LABELS[quest.difficulty]}
          </Text>
        </View>
      </View>
      {quest.description ? (
        <Text style={styles.cardDesc} numberOfLines={1}>{quest.description}</Text>
      ) : null}
      <View style={styles.cardBottom}>
        <Text style={styles.cardDeadline}>{formatDeadline(quest.deadline)}</Text>
        <View style={[styles.statusDot, { backgroundColor: quest.status === 'active' ? '#6fcf97' : '#555' }]} />
      </View>
    </TouchableOpacity>
  );
};

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>🔍</Text>
    <Text style={styles.emptyTitle}>No quests found</Text>
    <Text style={styles.emptySubtitle}>Try adjusting your filters or search</Text>
  </View>
);

const FilterChip = ({ label, active, onPress, activeColor = '#534AB7' }: {
  label: string; active: boolean; onPress: () => void; activeColor?: string;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const QuestListScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { user, isLoggedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [refreshing, setRefreshing] = useState(false);

  const { quests, loading, error, refresh } = useQuests({
    uid: user?.uid ?? null,
    filterDifficulty,
    filterStatus,
    sortMode,
    searchQuery,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  };

  const toggleDifficulty = (d: QuestDifficulty) => {
    setFilterDifficulty(prev => (prev === d ? null : d));
    setFilterStatus(null);
  };

  const toggleStatus = (s: QuestStatus) => {
    setFilterStatus(prev => (prev === s ? null : s));
    setFilterDifficulty(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Quests</Text>
        {isLoggedIn && (
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateQuest')}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search quests..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Difficulty</Text>
        <View style={styles.chipRow}>
          <FilterChip label="Daily" active={filterDifficulty === 'daily'} onPress={() => toggleDifficulty('daily')} activeColor="#1a4a6a" />
          <FilterChip label="Side Quest" active={filterDifficulty === 'side_quest'} onPress={() => toggleDifficulty('side_quest')} activeColor="#3a2a6a" />
          <FilterChip label="Boss Fight" active={filterDifficulty === 'boss_fight'} onPress={() => toggleDifficulty('boss_fight')} activeColor="#5a2a1a" />
        </View>
        <Text style={styles.filterLabel}>Status</Text>
        <View style={styles.chipRow}>
          <FilterChip label="Active" active={filterStatus === 'active'} onPress={() => toggleStatus('active')} activeColor="#1a4a2a" />
          <FilterChip label="Completed" active={filterStatus === 'completed'} onPress={() => toggleStatus('completed')} activeColor="#1a4a2a" />
        </View>
        <View style={styles.sortRow}>
          <Text style={styles.filterLabel}>Sort:</Text>
          <TouchableOpacity style={[styles.sortBtn, sortMode === 'newest' && styles.sortBtnActive]} onPress={() => setSortMode('newest')}>
            <Text style={[styles.sortBtnText, sortMode === 'newest' && styles.sortBtnTextActive]}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortBtn, sortMode === 'deadline' && styles.sortBtnActive]} onPress={() => setSortMode('deadline')}>
            <Text style={[styles.sortBtnText, sortMode === 'deadline' && styles.sortBtnTextActive]}>Deadline ↑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!loading && (
        <Text style={styles.resultsCount}>
          {quests.length} quest{quests.length !== 1 ? 's' : ''} found
        </Text>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} color="#c8b8ff" size="large" />
      ) : (
        <FlatList
          data={quests}
          keyExtractor={(item) => item.questId}
          renderItem={({ item }) => (
            <QuestCard quest={item} onPress={() => navigation.navigate('QuestDetail', { questId: item.questId })} />
          )}
          ListEmptyComponent={<EmptyState />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#c8b8ff" />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

export default QuestListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#c8b8ff' },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 30 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e2e', marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a3e' },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 11 },
  clearBtn: { color: '#555', fontSize: 14, paddingLeft: 8 },
  filterSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1e1e2e', gap: 8 },
  filterLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#2a2a3e', backgroundColor: 'transparent' },
  chipText: { fontSize: 12, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#2a2a3e' },
  sortBtnActive: { borderColor: '#534AB7', backgroundColor: '#1e1a3a' },
  sortBtnText: { fontSize: 12, color: '#555' },
  sortBtnTextActive: { color: '#c8b8ff' },
  resultsCount: { fontSize: 12, color: '#444', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a3e' },
  cardCompleted: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#e8e8f0', flex: 1, marginRight: 8 },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#555' },
  cardDesc: { fontSize: 13, color: '#666', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDeadline: { fontSize: 12, color: '#555' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#aaa' },
  emptySubtitle: { fontSize: 13, color: '#555' },
  loader: { marginTop: 60 },
  errorBanner: { backgroundColor: '#2a1a1a', padding: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e24b4a44' },
  errorText: { color: '#e24b4a', fontSize: 13, textAlign: 'center' },
});
