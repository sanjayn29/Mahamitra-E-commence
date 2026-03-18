import React, { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';
import { addAddress, fetchAddresses } from '../../services/addressService';
import { placeOrder } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/format';

const newAddressState = {
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

export default function CheckoutScreen({ navigation }) {
  const { user } = useAuthStore();
  const { items, loadCart, subtotal } = useCartStore();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState(newAddressState);

  const loadAddresses = React.useCallback(async () => {
    try {
      const list = await fetchAddresses(user.id);
      setAddresses(list);
      if (list[0]?.id) {
        setSelectedAddressId(list[0].id);
      }
    } catch (error) {
      Alert.alert('Address error', error.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  React.useEffect(() => {
    loadAddresses();
    if (user?.id) {
      loadCart(user.id);
    }
  }, [loadAddresses, loadCart, user?.id]);

  const updateAddressField = (key, value) => setNewAddress((prev) => ({ ...prev, [key]: value }));

  const handleAddAddress = async () => {
    if (!newAddress.full_name || !newAddress.phone || !newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.postal_code) {
      Alert.alert('Missing fields', 'Please fill all required address fields.');
      return;
    }

    try {
      const created = await addAddress({ ...newAddress, user_id: user.id });
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
      setNewAddress(newAddressState);
    } catch (error) {
      Alert.alert('Failed to add address', error.message);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Address required', 'Please select an address.');
      return;
    }

    try {
      setPlacingOrder(true);
      await placeOrder({
        userId: user.id,
        addressId: selectedAddressId,
        cartItems: items,
      });

      await loadCart(user.id);
      Alert.alert('Order placed', 'Your order has been placed successfully.', [
        { text: 'View Orders', onPress: () => navigation.navigate('MainTabs', { screen: 'Orders' }) },
      ]);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Order failed', error.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading checkout..." />;
  }

  return (
    <ScrollView className="flex-1 bg-slate-100" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <Text className="text-2xl font-bold text-slate-900">Checkout</Text>

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-slate-900">Select Address</Text>
          <Pressable onPress={() => setShowAddressForm((prev) => !prev)}>
            <Text className="font-semibold text-brand-700">{showAddressForm ? 'Cancel' : 'Add New'}</Text>
          </Pressable>
        </View>

        {addresses.length === 0 ? (
          <EmptyState title="No address found" subtitle="Add your delivery address to continue." />
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedAddressId(item.id)}
                className={`rounded-xl border p-3 ${selectedAddressId === item.id ? 'border-brand-700 bg-brand-50' : 'border-slate-200 bg-white'}`}
              >
                <Text className="font-semibold text-slate-900">{item.full_name}</Text>
                <Text className="text-slate-600">{item.line1}, {item.city}, {item.state} - {item.postal_code}</Text>
                <Text className="text-slate-600">{item.phone}</Text>
              </Pressable>
            )}
          />
        )}

        {showAddressForm && (
          <View className="mt-4 rounded-xl bg-slate-50 p-3">
            <TextInput className="mb-2 rounded-xl border border-slate-300 bg-white px-3 py-2" placeholder="Full name" value={newAddress.full_name} onChangeText={(v) => updateAddressField('full_name', v)} />
            <TextInput className="mb-2 rounded-xl border border-slate-300 bg-white px-3 py-2" placeholder="Phone" value={newAddress.phone} onChangeText={(v) => updateAddressField('phone', v)} keyboardType="phone-pad" />
            <TextInput className="mb-2 rounded-xl border border-slate-300 bg-white px-3 py-2" placeholder="Address line 1" value={newAddress.line1} onChangeText={(v) => updateAddressField('line1', v)} />
            <TextInput className="mb-2 rounded-xl border border-slate-300 bg-white px-3 py-2" placeholder="Address line 2" value={newAddress.line2} onChangeText={(v) => updateAddressField('line2', v)} />
            <TextInput className="mb-2 rounded-xl border border-slate-300 bg-white px-3 py-2" placeholder="City" value={newAddress.city} onChangeText={(v) => updateAddressField('city', v)} />
            <TextInput className="mb-2 rounded-xl border border-slate-300 bg-white px-3 py-2" placeholder="State" value={newAddress.state} onChangeText={(v) => updateAddressField('state', v)} />
            <TextInput className="mb-2 rounded-xl border border-slate-300 bg-white px-3 py-2" placeholder="Postal code" value={newAddress.postal_code} onChangeText={(v) => updateAddressField('postal_code', v)} keyboardType="number-pad" />
            <Pressable onPress={handleAddAddress} className="mt-2 rounded-xl bg-brand-700 px-3 py-3">
              <Text className="text-center font-semibold text-white">Save Address</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="text-lg font-semibold text-slate-900">Order Summary</Text>
        <Text className="mt-2 text-slate-700">Items: {items.length}</Text>
        <Text className="mt-1 text-xl font-bold text-slate-900">Total: {formatCurrency(subtotal())}</Text>

        <Pressable onPress={handlePlaceOrder} disabled={placingOrder || items.length === 0} className={`mt-4 rounded-xl px-4 py-3 ${items.length > 0 ? 'bg-brand-700' : 'bg-slate-300'}`}>
          <Text className="text-center text-base font-semibold text-white">{placingOrder ? 'Placing order...' : 'Place Order'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
