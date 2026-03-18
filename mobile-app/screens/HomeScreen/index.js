import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import { fetchCategories, fetchFeaturedProducts } from '../../services/productService';

export default function HomeScreen({ navigation }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [featured, fetchedCategories] = await Promise.all([fetchFeaturedProducts(), fetchCategories()]);
      setFeaturedProducts(featured);
      setCategories(fetchedCategories);
    } catch (error) {
      Alert.alert('Failed to load home', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onSearch = () => {
    navigation.navigate('ProductList', { search, category: 'All' });
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-100"
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      <Text className="text-3xl font-bold text-slate-900">Mahamitra</Text>
      <Text className="mt-1 text-slate-600">Find your next favorite item.</Text>

      <View className="mt-5 flex-row gap-2">
        <TextInput
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3"
          placeholder="Search products"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearch}
        />
        <Pressable onPress={onSearch} className="rounded-xl bg-brand-700 px-4 py-3">
          <Text className="font-semibold text-white">Go</Text>
        </Pressable>
      </View>

      <View className="mt-7">
        <Text className="text-xl font-bold text-slate-900">Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <Pressable
            onPress={() => navigation.navigate('ProductList', { category: 'All', search: '' })}
            className="mr-2 rounded-full bg-brand-700 px-4 py-2"
          >
            <Text className="font-medium text-white">All</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => navigation.navigate('ProductList', { category, search: '' })}
              className="mr-2 rounded-full border border-slate-300 bg-white px-4 py-2"
            >
              <Text className="font-medium text-slate-700">{category}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="mt-7">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-slate-900">Featured products</Text>
          <Pressable onPress={() => navigation.navigate('ProductList', { category: 'All', search: '' })}>
            <Text className="font-semibold text-brand-700">See all</Text>
          </Pressable>
        </View>

        {loading ? (
          <View>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <FlatList
            data={featuredProducts}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}
