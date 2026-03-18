import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { signup } from '../../services/authService';

const initialAddress = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
};

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);

  const updateAddress = (key, value) => setAddress((prev) => ({ ...prev, [key]: value }));

  const handleSignup = async () => {
    if (!fullName || !phone || !email || !password || !address.line1 || !address.city || !address.state || !address.postal_code) {
      Alert.alert('Missing fields', 'Please fill all required signup and address fields.');
      return;
    }

    try {
      setLoading(true);
      await signup({
        fullName,
        phone,
        email: email.trim(),
        password,
        address,
      });

      Alert.alert('Account created', 'Please verify your email if required, then login.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Signup failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-3xl font-bold text-slate-900">Create account</Text>

        <TextInput className="mt-6 rounded-xl border border-slate-300 px-4 py-3" placeholder="Full name" value={fullName} onChangeText={setFullName} />
        <TextInput className="mt-4 rounded-xl border border-slate-300 px-4 py-3" placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextInput className="mt-4 rounded-xl border border-slate-300 px-4 py-3" placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput className="mt-4 rounded-xl border border-slate-300 px-4 py-3" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

        <Text className="mt-6 text-lg font-semibold text-slate-900">Address</Text>
        <TextInput className="mt-3 rounded-xl border border-slate-300 px-4 py-3" placeholder="Address line 1" value={address.line1} onChangeText={(v) => updateAddress('line1', v)} />
        <TextInput className="mt-4 rounded-xl border border-slate-300 px-4 py-3" placeholder="Address line 2 (optional)" value={address.line2} onChangeText={(v) => updateAddress('line2', v)} />
        <TextInput className="mt-4 rounded-xl border border-slate-300 px-4 py-3" placeholder="City" value={address.city} onChangeText={(v) => updateAddress('city', v)} />
        <TextInput className="mt-4 rounded-xl border border-slate-300 px-4 py-3" placeholder="State" value={address.state} onChangeText={(v) => updateAddress('state', v)} />
        <TextInput className="mt-4 rounded-xl border border-slate-300 px-4 py-3" placeholder="Postal code" keyboardType="number-pad" value={address.postal_code} onChangeText={(v) => updateAddress('postal_code', v)} />

        <Pressable onPress={handleSignup} disabled={loading} className="mt-8 rounded-xl bg-brand-700 px-4 py-3">
          <Text className="text-center text-base font-semibold text-white">{loading ? 'Creating...' : 'Signup'}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-center text-slate-700">Back to login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
