import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';
import { fetchOrders } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDate } from '../../utils/format';

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const list = await fetchOrders(user.id);
      setOrders(list);
    } catch (error) {
      Alert.alert('Orders error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return <LoadingOverlay message="Loading orders..." />;
  }

  return (
    <View className="flex-1 bg-slate-100 p-4">
      <Text className="mb-3 text-2xl font-bold text-slate-900">Orders</Text>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" subtitle="Your order history will show up here." />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <View className="rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-slate-500">#{item.id}</Text>
                <Text className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                  {item.status}
                </Text>
              </View>
              <Text className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(item.total_amount)}</Text>
              <Text className="text-slate-600">Placed on {formatDate(item.created_at)}</Text>
              <Text className="mt-2 text-sm text-slate-700">Items: {(item.order_items || []).length}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
