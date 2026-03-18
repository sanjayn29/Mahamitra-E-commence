import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CartScreen from '../screens/CartScreen';

const Tab = createBottomTabNavigator();

const iconMap = {
  Home: 'home',
  Cart: 'shopping-cart',
  Orders: 'receipt',
  Profile: 'user-alt',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1f46d1',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => (
          <FontAwesome5 name={iconMap[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
