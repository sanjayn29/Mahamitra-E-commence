import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function QuantitySelector({ value, onChange, max = 10 }) {
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => onChange(Math.max(1, value - 1))}
        className="h-10 w-10 items-center justify-center rounded-xl border border-slate-300"
      >
        <Text className="text-lg font-bold text-slate-800">-</Text>
      </Pressable>
      <Text className="text-lg font-semibold text-slate-900">{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        className="h-10 w-10 items-center justify-center rounded-xl border border-slate-300"
      >
        <Text className="text-lg font-bold text-slate-800">+</Text>
      </Pressable>
    </View>
  );
}
