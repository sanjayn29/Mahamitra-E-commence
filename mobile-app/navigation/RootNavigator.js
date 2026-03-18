import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import MainTabs from './MainTabs';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AddressManagementScreen from '../screens/AddressManagementScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading, initialized, initialize } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize().catch(() => {
        // Keep app usable even if auth bootstrap has a transient failure.
      });
    }
  }, [initialize, initialized]);

  if (loading || !initialized) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Products' }} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
          <Stack.Screen name="AddressManagement" component={AddressManagementScreen} options={{ title: 'Addresses' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
