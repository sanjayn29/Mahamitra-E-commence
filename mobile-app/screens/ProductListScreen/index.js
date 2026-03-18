import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';
import { fetchCategories, fetchProducts } from '../../services/productService';

export default function ProductListScreen({ route, navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'All');
  const [search, setSearch] = useState(route.params?.search || '');
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        fetchProducts({ search, category: selectedCategory }),
        fetchCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(['All', ...fetchedCategories]);
    } catch (error) {
      Alert.alert('Load error', error.message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <View className="flex-1 bg-slate-100 px-4 pt-4">
      <View className="mb-4 flex-row gap-2">
        <TextInput
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3"
          placeholder="Search by name"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadProducts}
        />
        <Pressable onPress={loadProducts} className="rounded-xl bg-brand-700 px-4 py-3">
          <Text className="font-semibold text-white">Search</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 max-h-12"
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedCategory(item)}
            className={`mr-2 rounded-full px-4 py-2 ${item === selectedCategory ? 'bg-brand-700' : 'border border-slate-300 bg-white'}`}
          >
            <Text className={`${item === selectedCategory ? 'text-white' : 'text-slate-700'} font-medium`}>{item}</Text>
          </Pressable>
        )}
      />

      {loading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : products.length === 0 ? (
        <EmptyState title="No products found" subtitle="Try changing category or search text." />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
          )}
        />
      )}
    </View>
  );
}
