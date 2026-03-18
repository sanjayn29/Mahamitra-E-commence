import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';
import { fetchAddresses } from '../../services/addressService';
import { logout } from '../../services/authService';
import { fetchProfileSummary } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/format';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState([]);
  const [summary, setSummary] = useState({ orderCount: 0, totalSpent: 0, statuses: {} });
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const [addressData, summaryData] = await Promise.all([
        fetchAddresses(user.id),
        fetchProfileSummary(user.id),
      ]);
      setAddresses(addressData);
      setSummary(summaryData);
    } catch (error) {
      Alert.alert('Profile error', error.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Logout failed', error.message);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading profile..." />;
  }

  return (
    <View className="flex-1 bg-slate-100 p-4">
      <Text className="text-2xl font-bold text-slate-900">Profile</Text>
      <Text className="mt-1 text-slate-700">{user?.email}</Text>

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="text-lg font-semibold text-slate-900">Financial Summary</Text>
        <Text className="mt-2 text-slate-700">Orders: {summary.orderCount}</Text>
        <Text className="mt-1 text-xl font-bold text-brand-700">Total Spent: {formatCurrency(summary.totalSpent)}</Text>
      </View>

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-slate-900">Saved Addresses</Text>
          <Pressable onPress={() => navigation.navigate('AddressManagement')}>
            <Text className="font-semibold text-brand-700">Manage</Text>
          </Pressable>
        </View>

        {addresses.length === 0 ? (
          <EmptyState title="No saved addresses" subtitle="Add one for faster checkout." />
        ) : (
          <FlatList
            data={addresses.slice(0, 2)}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item }) => (
              <View className="rounded-xl bg-slate-50 p-3">
                <Text className="font-semibold text-slate-800">{item.full_name}</Text>
                <Text className="text-slate-600">{item.line1}, {item.city}, {item.state}</Text>
              </View>
            )}
          />
        )}
      </View>

      <Pressable onPress={handleLogout} className="mt-4 rounded-xl bg-red-600 px-4 py-3">
        <Text className="text-center text-base font-semibold text-white">Logout</Text>
      </Pressable>
    </View>
  );
}
