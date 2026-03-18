import React from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';
import QuantitySelector from '../../components/QuantitySelector';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/format';

export default function CartScreen({ navigation }) {
  const { user } = useAuthStore();
  const { items, loading, loadCart, updateQuantity, removeItem, subtotal } = useCartStore();

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadCart(user.id);
      }
    }, [loadCart, user?.id])
  );

  const handleRemove = async (itemId) => {
    try {
      await removeItem({ userId: user.id, itemId });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading && items.length === 0) {
    return <LoadingOverlay message="Loading cart..." />;
  }

  return (
    <View className="flex-1 bg-slate-100 p-4">
      <Text className="mb-3 text-2xl font-bold text-slate-900">Your Cart</Text>

      {items.length === 0 ? (
        <EmptyState title="Cart is empty" subtitle="Add products from home screen." />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 140 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            renderItem={({ item }) => {
              const variant = item.product_variants;
              const product = variant?.products;
              const price = variant?.price || product?.price || 0;

              return (
                <View className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Text className="text-base font-semibold text-slate-900">{product?.name || 'Product'}</Text>
                  <Text className="mt-1 text-sm text-slate-600">
                    {variant?.color || '-'} / {variant?.size || '-'}
                  </Text>
                  <Text className="mt-2 text-base font-bold text-brand-700">{formatCurrency(price)}</Text>

                  <View className="mt-3 flex-row items-center justify-between">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(newQty) => updateQuantity({ userId: user.id, itemId: item.id, quantity: newQty })}
                      max={Math.max(1, Number(variant?.stock_quantity || 1))}
                    />
                    <Pressable onPress={() => handleRemove(item.id)}>
                      <Text className="font-semibold text-red-600">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />

          <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base text-slate-700">Subtotal</Text>
              <Text className="text-lg font-bold text-slate-900">{formatCurrency(subtotal())}</Text>
            </View>
            <Pressable
              className="rounded-xl bg-brand-700 px-4 py-3"
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text className="text-center text-base font-semibold text-white">Proceed to Checkout</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
