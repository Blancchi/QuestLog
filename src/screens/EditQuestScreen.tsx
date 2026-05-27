import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { getQuest, updateQuest, archiveQuest } from '../services/questService';
import { Quest, QuestDifficulty } from '../models/Quest';
import { showAlert } from '../utils/alert';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'EditQuest'>;

const DIFFICULTIES: { key: QuestDifficulty; label: string; desc: string; color: string }[] = [
  { key: 'daily', label: 'Daily', desc: 'Quick recurring task', color: '#7ab8f5' },
  { key: 'side_quest', label: 'Side Quest', desc: 'Mid-effort task', color: '#c8b8ff' },
  { key: 'boss_fight', label: 'Boss Fight', desc: 'Big challenging task', color: '#f5a07a' },
];

const timestampToDateString = (ts: Timestamp | null): string => {
  if (!ts) return '';
  const d = ts.toDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EditQuestScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { questId } = route.params;
  const { user } = useAuth();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('daily');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    if (user !== undefined) {
      fetchQuest();
    }
  }, [questId, user]);

  const fetchQuest = async () => {
    setLoading(true);
    try {
      const data = await getQuest(questId);
      if (!data) { showAlert('Error', 'Quest not found.', () => navigation.goBack()); return; }
      console.log('Quest uid:', data.uid);      console.log('User uid:', user?.uid);
      if (user &&data.uid !== user?.uid) { showAlert('Unauthorized', 'You can only edit your own quests.', () => navigation.goBack()); return; }
      setQuest(data);
      setTitle(data.title);
      setDescription(data.description);
      setDifficulty(data.difficulty);
      setDeadline(timestampToDateString(data.deadline));
    } catch (err) {
      showAlert('Error', 'Could not load quest.', () => navigation.goBack());
    } finally {
      setLoading(false);
    }
  };

  const parseDeadline = (): Timestamp | null => {
    if (!deadline.trim()) return null;
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return null;
    date.setHours(23, 59, 59, 0);
    return Timestamp.fromDate(date);
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Missing title', 'Quest title cannot be empty.'); return; }
    if (deadline && isNaN(new Date(deadline).getTime())) { showAlert('Invalid date', 'Please enter YYYY-MM-DD.'); return; }
    setSaving(true);
    try {
      await updateQuest(questId, { title: title.trim(), description: description.trim(), difficulty, deadline: parseDeadline() });
      showAlert('Quest Updated!', 'Your changes have been saved.', () => navigation.goBack());
    } catch (err: any) {
      showAlert('Error', err?.message ?? 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showAlert(
      'Archive Quest?',
      'This will hide the quest. This cannot be undone.',
      async () => {
        setSaving(true);
        try {
          await archiveQuest(questId);
          navigation.goBack();
          navigation.goBack();
        } catch (err) {
          showAlert('Error', 'Could not archive quest.');
        } finally {
          setSaving(false);
        }
      },
      () => {},
      'Archive',
      'Cancel',
      true
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#c8b8ff" size="large" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Quest</Text>
        <TouchableOpacity onPress={handleDelete} disabled={saving}>
          <Text style={styles.deleteBtn}>🗑</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Quest Title <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Quest title" placeholderTextColor="#555" value={title} onChangeText={setTitle} maxLength={80} />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Add details..." placeholderTextColor="#555" value={description} onChangeText={setDescription} multiline numberOfLines={4} maxLength={300} />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity key={d.key} style={[styles.diffCard, difficulty === d.key && { borderColor: d.color, backgroundColor: '#1e1e2e' }]} onPress={() => setDifficulty(d.key)} activeOpacity={0.7}>
                <Text style={[styles.diffLabel, difficulty === d.key && { color: d.color }]}>{d.label}</Text>
                <Text style={styles.diffDesc}>{d.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Deadline <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#555" value={deadline} onChangeText={setDeadline} maxLength={10} />
          {deadline ? (
            <TouchableOpacity onPress={() => setDeadline('')}><Text style={styles.clearDeadline}>✕ Clear deadline</Text></TouchableOpacity>
          ) : (
            <Text style={styles.hint}>Leave blank for no deadline</Text>
          )}
        </View>
        <View style={styles.xpPreview}>
          <Text style={styles.xpPreviewLabel}>XP Reward on completion</Text>
          <Text style={styles.xpPreviewValue}>+{difficulty === 'daily' ? 50 : difficulty === 'side_quest' ? 100 : 150} XP</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.btnCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSave, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditQuestScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { width: 80 },
  backBtnText: { color: '#7b6fe0', fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#c8b8ff' },
  deleteBtn: { fontSize: 20, width: 60, textAlign: 'right' },
  scroll: { padding: 20, paddingBottom: 48, gap: 20 },
  field: { gap: 6 },
  label: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  required: { color: '#e24b4a' },
  optional: { color: '#555', fontWeight: '400' },
  input: { backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2a2a3e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#fff' },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#444', textAlign: 'right' },
  hint: { fontSize: 11, color: '#444' },
  clearDeadline: { fontSize: 12, color: '#e24b4a' },
  difficultyRow: { flexDirection: 'row', gap: 10 },
  diffCard: { flex: 1, backgroundColor: '#14141f', borderWidth: 1, borderColor: '#2a2a3e', borderRadius: 10, padding: 10, alignItems: 'center', gap: 4 },
  diffLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  diffDesc: { fontSize: 10, color: '#444', textAlign: 'center' },
  xpPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1a3a', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#534AB755' },
  xpPreviewLabel: { fontSize: 13, color: '#888' },
  xpPreviewValue: { fontSize: 16, fontWeight: '700', color: '#c8b8ff' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancel: { flex: 1, borderWidth: 1, borderColor: '#2a2a3e', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnCancelText: { color: '#888', fontSize: 15 },
  btnSave: { flex: 2, backgroundColor: '#534AB7', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});