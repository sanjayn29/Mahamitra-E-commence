import React from 'react';
import { View } from 'react-native';

export default function SkeletonCard() {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
      <View className="h-36 w-full rounded-xl bg-slate-200" />
      <View className="mt-3 h-4 w-4/5 rounded bg-slate-200" />
      <View className="mt-2 h-4 w-2/5 rounded bg-slate-200" />
      <View className="mt-2 h-4 w-1/3 rounded bg-slate-200" />
    </View>
  );
}
