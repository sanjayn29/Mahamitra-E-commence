import React from 'react';
import { Pressable, Text, View } from 'react-native';

function Chip({ label, active, disabled, onPress }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`mr-2 mb-2 rounded-xl border px-3 py-2 ${
        active ? 'border-brand-700 bg-brand-50' : 'border-slate-300 bg-white'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`font-medium ${active ? 'text-brand-700' : 'text-slate-700'}`}>{label}</Text>
    </Pressable>
  );
}

export default function VariantSelector({
  colors,
  sizes,
  selectedColor,
  selectedSize,
  onColorSelect,
  onSizeSelect,
}) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-slate-700">Select Color</Text>
      <View className="mb-4 flex-row flex-wrap">
        {colors.map((color) => (
          <Chip
            key={color}
            label={color}
            active={selectedColor === color}
            onPress={() => onColorSelect(color)}
          />
        ))}
      </View>

      <Text className="mb-2 text-sm font-semibold text-slate-700">Select Size</Text>
      <View className="flex-row flex-wrap">
        {sizes.map((sizeOption) => (
          <Chip
            key={sizeOption.size}
            label={`${sizeOption.size}${sizeOption.stock_quantity <= 0 ? ' (Out)' : ''}`}
            active={selectedSize === sizeOption.size}
            disabled={sizeOption.stock_quantity <= 0}
            onPress={() => onSizeSelect(sizeOption.size)}
          />
        ))}
      </View>
    </View>
  );
}
