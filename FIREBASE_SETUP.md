# Firebase Google Authentication Setup

## 🔥 Features Implemented

### Authentication System
- **Google Sign-In** integration using Firebase Authentication
- User session persistence across page reloads
- Automatic redirect after successful login
- Sign out functionality

### Firestore Database
- **Users Collection** - Stores user information
- **Document ID**: User's email address
- **Stored Fields**:
  - `email` - User's email address
  - `displayName` - User's display name from Google
  - `photoURL` - User's profile photo URL
  - `createdAt` - Timestamp of first registration
  - `lastLoginAt` - Timestamp of most recent login

## 📁 Files Created/Modified

### New Files:
1. **`src/lib/firebase.ts`** - Firebase configuration and initialization
2. **`src/context/AuthContext.tsx`** - Authentication context provider
3. **`src/pages/LoginPage.tsx`** - User login page with Google sign-in
4. **`src/pages/AccountPage.tsx`** - User account dashboard

### Modified Files:
1. **`src/App.tsx`** - Added AuthProvider and new routes
2. **`src/components/Header.tsx`** - Integrated user authentication UI

## 🚀 How It Works

### Login Flow:
1. User clicks "Continue with Google" on `/login`
2. Firebase opens Google OAuth popup
3. User authenticates with Google
4. Firebase creates/updates user document in Firestore
5. Document ID = user's email
6. User redirected to home page
7. Header shows user avatar with dropdown menu

### User Data Storage:
```javascript
// Firestore Collection: Users
// Document ID: user@example.com
{
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  createdAt: "2026-01-31T...",
  lastLoginAt: "2026-01-31T..."
}
```

## 🎨 UI Components

### Login Page (`/login`)
- Elegant Mahamitra-themed design
- Google OAuth button with official logo
- Create account and guest checkout options
- Responsive with decorative background elements

### Account Page (`/account`)
- User profile information display
- Member since and last login dates
- Quick action buttons for orders, wishlist, etc.
- Sign out functionality

### Header Integration
- Shows user avatar when logged in
- Dropdown menu with:
  - My Account
  - My Orders
  - Wishlist
  - Admin Portal
  - Sign Out
- Shows login icon when not authenticated

## 🔐 Security
- Firebase handles all authentication securely
- Session tokens managed by Firebase SDK
- User data stored in Firestore with security rules
- Email used as document ID for easy querying

## 📍 Routes Added
- `/login` - User login page
- `/account` - User account dashboard

## 🎯 Next Steps
You can now:
- Set up Firestore security rules in Firebase Console
- Add more user fields as needed
- Implement orders, wishlist, and other features
- Configure email/password authentication if needed
- Add social auth providers (Facebook, Twitter, etc.)

## Firebase Console Setup Required
Make sure to enable:
1. **Authentication** → Sign-in method → Google (Enable)
2. **Firestore Database** → Create database
3. **Security Rules** (recommended):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /Users/{email} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == email;
    }
  }
}
```
