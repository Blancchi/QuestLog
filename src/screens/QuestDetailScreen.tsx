import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { getQuest, completeQuest, archiveQuest } from '../services/questService';
import { addXP } from '../services/userService';
import { Quest, QuestDifficulty } from '../models/Quest';
import { Timestamp } from 'firebase/firestore';
import { showAlert } from '../utils/alert';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'QuestDetail'>;

const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = { daily: 'Daily', side_quest: 'Side Quest', boss_fight: 'Boss Fight' };
const DIFFICULTY_COLORS: Record<QuestDifficulty, { bg: string; text: string }> = {
  daily: { bg: '#1a2a3a', text: '#7ab8f5' },
  side_quest: { bg: '#1e1a3a', text: '#c8b8ff' },
  boss_fight: { bg: '#2a1a1a', text: '#f5a07a' },
};
const XP_REWARDS: Record<QuestDifficulty, number> = { daily: 50, side_quest: 100, boss_fight: 150 };

const formatDate = (ts: Timestamp | null): string => {
  if (!ts) return 'No deadline';
  return ts.toDate().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
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

const QuestDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { questId } = route.params;
  const { user } = useAuth();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchQuest(); }, [questId]);

  const fetchQuest = async () => {
    setLoading(true);
    try {
      const data = await getQuest(questId);
      setQuest(data);
    } catch (err) {
      showAlert('Error', 'Could not load quest.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!quest || !user) return;
    showAlert(
      'Complete Quest?',
      `You'll earn +${XP_REWARDS[quest.difficulty]} XP!`,
      async () => {
        setActionLoading(true);
        try {
          await completeQuest(quest.questId);
          await addXP(user.uid, XP_REWARDS[quest.difficulty]);
          showAlert('Quest Complete!', `+${XP_REWARDS[quest.difficulty]} XP earned!`, () => navigation.goBack());
        } catch (err) {
          showAlert('Error', 'Could not complete quest.');
        } finally {
          setActionLoading(false);
        }
      },
      () => {},
      'Complete!',
      'Cancel'
    );
  };

  const handleArchive = async () => {
    if (!quest) return;
    showAlert(
      'Archive Quest?',
      'This quest will be hidden. This cannot be undone.',
      async () => {
        setActionLoading(true);
        try {
          await archiveQuest(quest.questId);
          navigation.goBack();
        } catch (err) {
          showAlert('Error', 'Could not archive quest.');
        } finally {
          setActionLoading(false);
        }
      },
      () => {},
      'Archive',
      'Cancel',
      true
    );
  };

  const isOwner = user?.uid === quest?.uid;

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#c8b8ff" size="large" /></View>;
  if (!quest) return (
    <View style={styles.centered}>
      <Text style={styles.notFound}>Quest not found.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backLink}>← Go back</Text></TouchableOpacity>
    </View>
  );

  const diffColors = DIFFICULTY_COLORS[quest.difficulty];
  const isCompleted = quest.status === 'completed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        {isOwner && !isCompleted && (
          <TouchableOpacity onPress={() => navigation.navigate('EditQuest', { questId: quest.questId })}>
            <Text style={styles.editBtn}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, isCompleted && styles.titleDone]}>{quest.title}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: diffColors.bg }]}>
            <Text style={[styles.badgeText, { color: diffColors.text }]}>{DIFFICULTY_LABELS[quest.difficulty]}</Text>
          </View>
          <View style={[styles.badge, isCompleted ? styles.badgeDone : styles.badgeActive]}>
            <Text style={[styles.badgeText, isCompleted ? styles.badgeDoneText : styles.badgeActiveText]}>
              {isCompleted ? '✓ Completed' : '● Active'}
            </Text>
          </View>
        </View>
        {quest.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{quest.description}</Text>
          </View>
        ) : null}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Deadline</Text>
            <Text style={styles.infoValue}>{formatDate(quest.deadline)}</Text>
          </View>
          {!isCompleted && quest.deadline && <Text style={styles.deadlineCountdown}>{formatDeadline(quest.deadline)}</Text>}
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⭐ XP Reward</Text>
            <Text style={styles.xpValue}>+{XP_REWARDS[quest.difficulty]} XP</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🗓 Created</Text>
            <Text style={styles.infoValue}>{formatDate(quest.createdAt)}</Text>
          </View>
        </View>
        {isOwner && (
          <View style={styles.actions}>
            {!isCompleted ? (
              <TouchableOpacity style={[styles.btnComplete, actionLoading && styles.btnDisabled]} onPress={handleComplete} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnCompleteText}>⚔️ Mark as Complete</Text>}
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBanner}>
                <Text style={styles.completedBannerText}>🎉 This quest is complete!</Text>
              </View>
            )}
            <TouchableOpacity style={[styles.btnArchive, actionLoading && styles.btnDisabled]} onPress={handleArchive} disabled={actionLoading}>
              <Text style={styles.btnArchiveText}>Archive Quest</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default QuestDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center', gap: 12 },
  notFound: { color: '#aaa', fontSize: 16 },
  backLink: { color: '#7b6fe0', fontSize: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: '#7b6fe0', fontSize: 16 },
  editBtn: { color: '#c8b8ff', fontSize: 15, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 48, gap: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#e8e8f0', lineHeight: 32 },
  titleDone: { textDecorationLine: 'line-through', color: '#555' },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeActive: { backgroundColor: '#1a2a1a' },
  badgeActiveText: { color: '#6fcf97' },
  badgeDone: { backgroundColor: '#1a2a1a' },
  badgeDoneText: { color: '#6fcf97' },
  section: { gap: 6 },
  sectionLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.6 },
  description: { fontSize: 15, color: '#ccc', lineHeight: 22 },
  infoCard: { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a3e', gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#ccc', fontWeight: '500' },
  xpValue: { fontSize: 14, color: '#c8b8ff', fontWeight: '700' },
  deadlineCountdown: { fontSize: 12, color: '#f5a07a', marginTop: -4 },
  actions: { gap: 10, marginTop: 8 },
  btnComplete: { backgroundColor: '#534AB7', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnCompleteText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnArchive: { borderWidth: 1, borderColor: '#e24b4a55', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnArchiveText: { color: '#e24b4a', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  completedBanner: { backgroundColor: '#1a2a1a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#6fcf9744' },
  completedBannerText: { color: '#6fcf97', fontSize: 15, fontWeight: '600' },
});