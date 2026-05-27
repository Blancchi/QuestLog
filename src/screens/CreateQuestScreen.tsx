import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';
import { createQuest } from '../services/questService';
import { QuestDifficulty } from '../models/Quest';
import { classifyQuestDifficulty } from '../utils/tagClassifier';
import { showAlert } from '../utils/alert';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const DIFFICULTIES: { key: QuestDifficulty; label: string; desc: string; color: string }[] = [
  { key: 'daily', label: 'Daily', desc: 'Quick recurring task', color: '#7ab8f5' },
  { key: 'side_quest', label: 'Side Quest', desc: 'Mid-effort task', color: '#c8b8ff' },
  { key: 'boss_fight', label: 'Boss Fight', desc: 'Big challenging task', color: '#f5a07a' },
];

const CreateQuestScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('daily');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTitleBlur = () => {
    if (title.trim()) setDifficulty(classifyQuestDifficulty(title, description));
  };

  const parseDeadline = (): Timestamp | null => {
    if (!deadline.trim()) return null;
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return null;
    date.setHours(23, 59, 59, 0);
    return Timestamp.fromDate(date);
  };

  const handleCreate = async () => {
    if (!title.trim()) { showAlert('Missing title', 'Please give your quest a name.'); return; }
    if (!user) { showAlert('Not logged in', 'You must be logged in to create quests.'); return; }
    if (deadline && isNaN(new Date(deadline).getTime())) { showAlert('Invalid date', 'Please enter YYYY-MM-DD.'); return; }
    setLoading(true);
    try {
      await createQuest({
        uid: user.uid,
        title: title.trim(),
        description: description.trim(),
        difficulty,
        status: 'active',
        category: difficulty,
        deadline: parseDeadline(),
        isArchived: false,
      });
      showAlert('Quest Created!', `"${title.trim()}" added to your quest log.`, () => navigation.goBack());
    } catch (err: any) {
      showAlert('Error', err?.message ?? 'Could not create quest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Quest</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Quest Title <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.input} placeholder='e.g. "Finish the report"' placeholderTextColor="#555" value={title} onChangeText={setTitle} onBlur={handleTitleBlur} maxLength={80} />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Add details..." placeholderTextColor="#555" value={description} onChangeText={setDescription} multiline numberOfLines={4} maxLength={300} />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Difficulty<Text style={styles.autoTag}> · auto-tagged from title</Text></Text>
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
          <Text style={styles.hint}>Leave blank for no deadline</Text>
        </View>
        <View style={styles.xpPreview}>
          <Text style={styles.xpPreviewLabel}>XP Reward on completion</Text>
          <Text style={styles.xpPreviewValue}>+{difficulty === 'daily' ? 50 : difficulty === 'side_quest' ? 100 : 150} XP</Text>
        </View>
        <TouchableOpacity style={[styles.btnCreate, loading && styles.btnDisabled]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnCreateText}>⚔️ Create Quest</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CreateQuestScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  backBtn: { width: 80 },
  backBtnText: { color: '#7b6fe0', fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#c8b8ff' },
  scroll: { padding: 20, paddingBottom: 48, gap: 20 },
  field: { gap: 6 },
  label: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  required: { color: '#e24b4a' },
  optional: { color: '#555', fontWeight: '400' },
  autoTag: { color: '#534AB7', fontSize: 11 },
  input: { backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2a2a3e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#fff' },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#444', textAlign: 'right' },
  hint: { fontSize: 11, color: '#444' },
  difficultyRow: { flexDirection: 'row', gap: 10 },
  diffCard: { flex: 1, backgroundColor: '#14141f', borderWidth: 1, borderColor: '#2a2a3e', borderRadius: 10, padding: 10, alignItems: 'center', gap: 4 },
  diffLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  diffDesc: { fontSize: 10, color: '#444', textAlign: 'center' },
  xpPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1a3a', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#534AB755' },
  xpPreviewLabel: { fontSize: 13, color: '#888' },
  xpPreviewValue: { fontSize: 16, fontWeight: '700', color: '#c8b8ff' },
  btnCreate: { backgroundColor: '#534AB7', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnCreateText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});