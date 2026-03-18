import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { formatCurrency } from '../utils/format';

export default function ProductCard({ product, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 w-[48%] overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <Image
        source={{ uri: product.image_url || 'https://placehold.co/600x400' }}
        className="h-36 w-full"
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="text-sm text-slate-500">{product.category || 'General'}</Text>
        <Text className="mt-1 text-base font-semibold text-slate-900" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="mt-1 text-base font-bold text-brand-700">{formatCurrency(product.price)}</Text>
        <View className="mt-2 flex-row items-center gap-1">
          <FontAwesome name="star" size={14} color="#f59e0b" />
          <Text className="text-sm text-slate-600">{Number(product.rating || 0).toFixed(1)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
