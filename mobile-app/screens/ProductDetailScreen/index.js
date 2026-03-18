import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import LoadingOverlay from '../../components/LoadingOverlay';
import QuantitySelector from '../../components/QuantitySelector';
import VariantSelector from '../../components/VariantSelector';
import { fetchProductDetails } from '../../services/productService';
import { fetchProductReviews, upsertReview } from '../../services/reviewService';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/format';

export default function ProductDetailScreen({ route, navigation }) {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [productData, reviewData] = await Promise.all([fetchProductDetails(productId), fetchProductReviews(productId)]);
      setProduct(productData);
      setReviews(reviewData);

      const firstInStockVariant = (productData.variants || []).find((item) => item.stock_quantity > 0);
      if (firstInStockVariant) {
        setSelectedColor(firstInStockVariant.color);
        setSelectedSize(firstInStockVariant.size);
      }
    } catch (error) {
      Alert.alert('Unable to load product', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, productId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const colors = useMemo(() => {
    const allColors = (product?.variants || []).map((item) => item.color).filter(Boolean);
    return Array.from(new Set(allColors));
  }, [product]);

  const filteredSizes = useMemo(() => {
    return (product?.variants || []).filter((item) => item.color === selectedColor);
  }, [product, selectedColor]);

  const selectedVariant = useMemo(() => {
    return (product?.variants || []).find((item) => item.color === selectedColor && item.size === selectedSize);
  }, [product, selectedColor, selectedSize]);

  const inStock = Number(selectedVariant?.stock_quantity || 0) > 0;

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const firstAvailableSize = (product?.variants || []).find((item) => item.color === color && item.stock_quantity > 0);
    setSelectedSize(firstAvailableSize?.size || '');
  };

  const handleAddToCart = async () => {
    if (!user?.id) return;
    if (!selectedVariant?.id) {
      Alert.alert('Variant required', 'Please select a valid color and size.');
      return;
    }

    if (!inStock) {
      Alert.alert('Out of stock', 'Selected variant is unavailable.');
      return;
    }

    try {
      await addItem({ userId: user.id, variantId: selectedVariant.id, quantity });
      Alert.alert('Added to cart', 'Item added successfully.', [
        { text: 'Continue' },
        { text: 'Go to Cart', onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' }) },
      ]);
    } catch (error) {
      Alert.alert('Failed', error.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Empty review', 'Please write your review.');
      return;
    }

    try {
      setSubmittingReview(true);
      await upsertReview({
        productId,
        userId: user.id,
        rating,
        comment: reviewText.trim(),
      });
      setReviewText('');
      await loadData();
      Alert.alert('Saved', 'Your review has been saved.');
    } catch (error) {
      Alert.alert('Review error', error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !product) {
    return <LoadingOverlay message="Loading product..." />;
  }

  return (
    <ScrollView className="flex-1 bg-slate-100" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      <Image
        source={{ uri: product.image_url || 'https://placehold.co/700x500' }}
        className="h-72 w-full rounded-2xl bg-slate-200"
      />

      <Text className="mt-4 text-2xl font-bold text-slate-900">{product.name}</Text>
      <Text className="mt-1 text-lg font-semibold text-brand-700">{formatCurrency(product.price)}</Text>
      <Text className="mt-2 text-slate-700">{product.description || 'No description available.'}</Text>

      <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <VariantSelector
          colors={colors}
          sizes={filteredSizes}
          selectedColor={selectedColor}
          selectedSize={selectedSize}
          onColorSelect={handleColorSelect}
          onSizeSelect={setSelectedSize}
        />

        <View className="mt-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700">Quantity</Text>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            max={Math.max(1, Number(selectedVariant?.stock_quantity || 1))}
          />
        </View>

        <Text className="mt-3 text-sm text-slate-600">
          Stock: {selectedVariant ? selectedVariant.stock_quantity : 0}
        </Text>

        <Pressable
          onPress={handleAddToCart}
          disabled={!inStock || !selectedVariant}
          className={`mt-5 rounded-xl px-4 py-3 ${inStock && selectedVariant ? 'bg-brand-700' : 'bg-slate-300'}`}
        >
          <Text className="text-center text-base font-semibold text-white">Add to Cart</Text>
        </Pressable>
      </View>

      <View className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="text-lg font-bold text-slate-900">Ratings & Reviews</Text>

        <View className="mt-3 rounded-xl bg-slate-50 p-3">
          <Text className="text-sm text-slate-700">Your rating (1-5)</Text>
          <TextInput
            className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-2"
            keyboardType="number-pad"
            value={String(rating)}
            onChangeText={(value) => {
              const parsed = Math.max(1, Math.min(5, Number(value || 1)));
              setRating(Number.isNaN(parsed) ? 1 : parsed);
            }}
          />
          <TextInput
            className="mt-3 rounded-xl border border-slate-300 bg-white px-3 py-3"
            placeholder="Write your review"
            multiline
            numberOfLines={4}
            value={reviewText}
            onChangeText={setReviewText}
          />
          <Pressable onPress={handleSubmitReview} disabled={submittingReview} className="mt-3 rounded-xl bg-brand-700 px-4 py-3">
            <Text className="text-center font-semibold text-white">{submittingReview ? 'Saving...' : 'Submit / Edit Review'}</Text>
          </Pressable>
        </View>

        {reviews.length === 0 ? (
          <View className="mt-4">
            <EmptyState title="No reviews yet" subtitle="Be the first to review this product." />
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            className="mt-4"
            ItemSeparatorComponent={() => <View className="h-3" />}
            renderItem={({ item }) => (
              <View className="rounded-xl border border-slate-200 p-3">
                <Text className="font-semibold text-slate-800">Rating: {item.rating}/5</Text>
                <Text className="mt-1 text-slate-700">{item.comment}</Text>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}
