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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { login, loginAsGuest } from '../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      });
    } catch (err: any) {
      Alert.alert('Login failed', err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not sign in as guest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>⚔️ QuestLog</Text>
        <Text style={styles.subtitle}>Your quests await, adventurer.</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
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
          placeholder="Enter your password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={styles.btnSecondaryText}>
            No account yet? Register
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.btnGuest}
          onPress={handleGuest}
          disabled={loading}
        >
          <Text style={styles.btnGuestText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    paddingHorizontal: 28,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 13,
  },
  btnGuest: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnGuestText: {
    color: '#aaa',
    fontSize: 15,
  },
});
