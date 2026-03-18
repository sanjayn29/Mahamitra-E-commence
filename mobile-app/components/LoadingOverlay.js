import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2157f2" />
      <Text className="mt-3 text-base text-slate-700">{message}</Text>
    </View>
  );
}
