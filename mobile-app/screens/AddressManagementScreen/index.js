import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';
import { addAddress, deleteAddress, fetchAddresses } from '../../services/addressService';
import { useAuthStore } from '../../store/authStore';

const initialForm = {
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: false,
};

export default function AddressManagementScreen() {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);

  const loadAddresses = useCallback(async () => {
    try {
      const data = await fetchAddresses(user.id);
      setAddresses(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  React.useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.full_name || !form.phone || !form.line1 || !form.city || !form.state || !form.postal_code) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }

    try {
      const created = await addAddress({ ...form, user_id: user.id });
      setAddresses((prev) => [created, ...prev]);
      setForm(initialForm);
    } catch (error) {
      Alert.alert('Add failed', error.message);
    }
  };

  const remove = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      Alert.alert('Delete failed', error.message);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading addresses..." />;
  }

  return (
    <ScrollView className="flex-1 bg-slate-100" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <Text className="text-2xl font-bold text-slate-900">Address Management</Text>

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="mb-3 text-lg font-semibold text-slate-900">Add Address</Text>
        <TextInput className="mb-2 rounded-xl border border-slate-300 px-3 py-2" placeholder="Full name" value={form.full_name} onChangeText={(v) => update('full_name', v)} />
        <TextInput className="mb-2 rounded-xl border border-slate-300 px-3 py-2" placeholder="Phone" value={form.phone} onChangeText={(v) => update('phone', v)} />
        <TextInput className="mb-2 rounded-xl border border-slate-300 px-3 py-2" placeholder="Line 1" value={form.line1} onChangeText={(v) => update('line1', v)} />
        <TextInput className="mb-2 rounded-xl border border-slate-300 px-3 py-2" placeholder="Line 2" value={form.line2} onChangeText={(v) => update('line2', v)} />
        <TextInput className="mb-2 rounded-xl border border-slate-300 px-3 py-2" placeholder="City" value={form.city} onChangeText={(v) => update('city', v)} />
        <TextInput className="mb-2 rounded-xl border border-slate-300 px-3 py-2" placeholder="State" value={form.state} onChangeText={(v) => update('state', v)} />
        <TextInput className="mb-2 rounded-xl border border-slate-300 px-3 py-2" placeholder="Postal code" value={form.postal_code} onChangeText={(v) => update('postal_code', v)} />

        <Pressable onPress={submit} className="mt-2 rounded-xl bg-brand-700 px-4 py-3">
          <Text className="text-center font-semibold text-white">Save Address</Text>
        </Pressable>
      </View>

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="mb-3 text-lg font-semibold text-slate-900">Saved Addresses</Text>
        {addresses.length === 0 ? (
          <EmptyState title="No addresses" subtitle="Add an address above." />
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item }) => (
              <View className="rounded-xl border border-slate-200 p-3">
                <Text className="font-semibold text-slate-900">{item.full_name}</Text>
                <Text className="text-slate-600">{item.line1}, {item.city}, {item.state}, {item.postal_code}</Text>
                <Pressable onPress={() => remove(item.id)} className="mt-2">
                  <Text className="font-semibold text-red-600">Delete</Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}
