import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { login } from '../../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-white px-6"
    >
      <Text className="text-3xl font-bold text-slate-900">Welcome back</Text>
      <Text className="mt-2 text-slate-600">Sign in to continue shopping.</Text>

      <TextInput
        className="mt-8 rounded-xl border border-slate-300 px-4 py-3"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="mt-4 rounded-xl border border-slate-300 px-4 py-3"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        className="mt-6 rounded-xl bg-brand-700 px-4 py-3"
      >
        <Text className="text-center text-base font-semibold text-white">{loading ? 'Signing in...' : 'Login'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Signup')} className="mt-5">
        <Text className="text-center text-slate-700">
          New user? <Text className="font-semibold text-brand-700">Create account</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
