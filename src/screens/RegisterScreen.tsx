import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { register } from '../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

const RegisterScreen = ({ navigation }: Props) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Your passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      });
    } catch (err: any) {
      Alert.alert('Registration failed', err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚔️ QuestLog</Text>
          <Text style={styles.subtitle}>Create your adventurer profile.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Adventurer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="What should we call you?"
            placeholderTextColor="#888"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={[
              styles.input,
              confirmPassword.length > 0 && password !== confirmPassword
                ? styles.inputError
                : null,
            ]}
            placeholder="Re-enter your password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Begin your quest</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.btnSecondaryText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#c8b8ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  form: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 2,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1e1e2e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
  },
  inputError: {
    borderColor: '#e24b4a',
  },
  errorText: {
    fontSize: 12,
    color: '#e24b4a',
    marginTop: -4,
  },
  btnPrimary: {
    backgroundColor: '#534AB7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondary: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  btnSecondaryText: {
    color: '#7b6fe0',
    fontSize: 14,
  },
});
