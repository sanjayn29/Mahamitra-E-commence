# Mahamitra Mobile App (Expo + React Native)

Production-ready mobile ecommerce app connected to the existing Supabase backend used by https://www.mahamitra.app.

## Tech Stack

- React Native + Expo
- Supabase JS
- React Navigation (Native Stack + Bottom Tabs)
- Zustand state management
- NativeWind (Tailwind for React Native)

## Project Structure

```text
mobile-app
├── App.js
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── global.css
├── eas.json
├── services
│   ├── supabaseClient.js
│   ├── authService.js
│   ├── productService.js
│   ├── cartService.js
│   ├── orderService.js
│   ├── reviewService.js
│   └── addressService.js
├── store
│   ├── authStore.js
│   └── cartStore.js
├── navigation
│   ├── RootNavigator.js
│   └── MainTabs.js
├── components
│   ├── EmptyState.js
│   ├── LoadingOverlay.js
│   ├── ProductCard.js
│   ├── QuantitySelector.js
│   ├── SkeletonCard.js
│   └── VariantSelector.js
├── screens
│   ├── SplashScreen/index.js
│   ├── LoginScreen/index.js
│   ├── SignupScreen/index.js
│   ├── HomeScreen/index.js
│   ├── ProductListScreen/index.js
│   ├── ProductDetailScreen/index.js
│   ├── CartScreen/index.js
│   ├── CheckoutScreen/index.js
│   ├── OrdersScreen/index.js
│   ├── ProfileScreen/index.js
│   └── AddressManagementScreen/index.js
└── utils
    └── format.js
```

## Environment Variables

Create a `.env` file in `mobile-app`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Install and Run

1. Open terminal inside `mobile-app`.
2. Install dependencies:

```bash
npm install
```

3. Start Expo:

```bash
npm run start
```

4. Run on Android emulator/device:

```bash
npm run android
```

## Implemented Features

- Supabase Auth: login, signup, logout
- Signup with address insertion into `addresses`
- Home screen with featured products, categories, search
- Product listing with category filter and search
- Product detail with:
  - variant color/size filtering
  - stock-aware disabled variants
  - quantity selector
  - add to cart using `variant_id`
  - rating/review create and edit (upsert)
- Cart persisted in Supabase `cart_items`
- Checkout:
  - address selection
  - add new address
  - place order to `orders` + `order_items`
- Orders history with status/details summary
- Profile with user info, addresses, order count, total spend
- Address management add/delete
- Bottom navigation, loading states, error alerts, skeleton loaders

## Build APK (EAS)

1. Install EAS CLI globally:

```bash
npm install -g eas-cli
```

2. Login to Expo:

```bash
eas login
```

3. Configure EAS project from `mobile-app` root:

```bash
eas build:configure
```

4. Build Android APK (preview profile):

```bash
eas build -p android --profile preview
```

5. Download APK from the Expo build URL shown in terminal.

## Production Notes

- Confirm your Supabase table column names match service queries exactly.
- Keep Row Level Security policies enabled for per-user access to `cart_items`, `orders`, `order_items`, `addresses`, and `reviews`.
- For production releases, use `production` profile (`.aab`) and publish to Play Console.
