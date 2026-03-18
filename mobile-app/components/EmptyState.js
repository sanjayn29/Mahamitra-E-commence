import React from 'react';
import { Text, View } from 'react-native';

export default function EmptyState({ title, subtitle }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
      <Text className="text-lg font-semibold text-slate-800">{title}</Text>
      {!!subtitle && <Text className="mt-1 text-center text-slate-600">{subtitle}</Text>}
    </View>
  );
}
