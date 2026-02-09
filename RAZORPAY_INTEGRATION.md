# Razorpay Integration Guide (Test Mode)

## 🎯 Overview
This guide provides complete instructions for integrating Razorpay payment gateway in **Test Mode** for your Mahamitra E-commerce site.

---

## 📋 Requirements

### 1. Razorpay Account Setup
1. Visit [https://razorpay.com](https://razorpay.com) and create a free account
2. Complete email verification
3. Navigate to **Settings** → **API Keys**
4. Click on **Generate Test Keys**
5. Copy the **Key ID** (starts with `rzp_test_`)
6. Copy the **Key Secret** (for backend verification - optional)

### 2. Environment Configuration
Update your `.env` file with the Razorpay test key:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID_HERE
```

**⚠️ Important:** Replace `rzp_test_YOUR_KEY_ID_HERE` with your actual Razorpay test key ID.

---

## 🚀 Setup Steps

### Step 1: Database Setup
Run the SQL script to create the orders table in your Supabase database:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `database/create-orders-table.sql`
4. Execute the SQL script

### Step 2: Environment Variables
1. Open `.env` file
2. Add your Razorpay test key:
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_test_AbCdEfGhIjKlMnOp
   ```
3. Save the file
4. **Restart your dev server** for changes to take effect

### Step 3: Install Dependencies (Already Done)
The Razorpay script is loaded via CDN in `index.html`. No npm packages needed!

---

## 🧪 Testing

### Test Mode Features
- ✅ No real money is charged
- ✅ Auto-updates payment status in database
- ✅ Test cards work without validation
- ✅ Full payment flow simulation

### Test Card Details
Use these test card numbers in Razorpay checkout:

**Success Scenarios:**
- **Card Number:** `4111 1111 1111 1111` (Visa)
- **Card Number:** `5555 5555 5555 4444` (Mastercard)
- **CVV:** Any 3 digits (e.g., `123`)
- **Expiry:** Any future date (e.g., `12/25`)
- **Cardholder Name:** Any name

**Failure Scenarios:**
- **Card Number:** `4000 0000 0000 0002` (Decline)

**UPI Test:**
- **UPI ID:** `success@razorpay`
- For failure: `failure@razorpay`

**Netbanking Test:**
- Select any bank from the list
- Use "Success" or "Failure" buttons in test mode

---

## 🎮 How It Works

### User Flow
1. User fills checkout form on BuyNowPage
2. Clicks **"Pay Now"** button
3. Razorpay payment modal opens
4. User selects payment method and completes payment
5. On success:
   - Order is saved to database
   - Success toast notification appears
   - User is redirected to profile page
6. On failure/cancellation:
   - Error message is shown
   - User can retry payment

### Payment Auto-Update
The integration automatically:
- ✅ Pre-fills customer name, email, phone
- ✅ Calculates amount in paise (₹1 = 100 paise)
- ✅ Captures payment ID from Razorpay
- ✅ Saves complete order details to database
- ✅ Updates payment status to 'completed'
- ✅ Sets order status to 'pending'

---

## 📁 Files Modified/Created

### New Files:
1. **`src/services/razorpayService.ts`** - Payment initialization logic
2. **`database/create-orders-table.sql`** - Database schema
3. **`RAZORPAY_INTEGRATION.md`** - This guide

### Modified Files:
1. **`src/pages/BuyNowPage.tsx`** - Added payment integration
2. **`index.html`** - Added Razorpay script
3. **`.env`** - Added Razorpay keys
4. **`src/vite-env.d.ts`** - TypeScript declarations

---

## 🔧 Configuration

### Customization Options

**1. Brand Color:**
Edit `src/services/razorpayService.ts`, line ~85:
```typescript
theme: {
  color: '#000000', // Change to your brand color
}
```

**2. Company Logo:**
Edit `src/services/razorpayService.ts`, line ~77:
```typescript
image: '/logo.png', // Add your logo in public folder
```

**3. Currency:**
Default is INR. To change:
```typescript
currency: 'USD', // or 'EUR', 'GBP', etc.
```

---

## 🐛 Troubleshooting

### Issue: "Razorpay configuration is missing"
**Solution:** Ensure `.env` file has `VITE_RAZORPAY_KEY_ID` and restart dev server

### Issue: "Payment gateway is not available"
**Solution:** Check if Razorpay script is loaded in `index.html`. Clear browser cache.

### Issue: Payment success but order not saved
**Solution:** Check Supabase connection and ensure orders table exists

### Issue: TypeScript errors with Razorpay
**Solution:** Restart TypeScript server in VSCode (Cmd/Ctrl + Shift + P → "Restart TS Server")

---

## 🔐 Security Notes

### Test Mode
- ✅ Safe for development
- ✅ No real transactions
- ✅ Keys can be public

### Production Mode (Future)
- ⚠️ **Never** expose Key Secret in frontend
- ⚠️ Create backend API for payment verification
- ⚠️ Implement signature verification
- ⚠️ Use environment variables properly

---

## 📊 Database Schema

The `orders` table stores:
- User details
- Product information
- Delivery address
- Payment ID (from Razorpay)
- Payment status (pending/completed/failed)
- Order status (pending/confirmed/shipped/delivered)
- Timestamps

---

## 🎯 Next Steps

1. **Get Razorpay Test Keys** from dashboard
2. **Update `.env`** with your test key
3. **Run SQL script** in Supabase
4. **Restart dev server**
5. **Test payment flow** with test cards
6. **Verify orders** are saved in database

---

## 📞 Support

### Razorpay Documentation
- [Razorpay Test Mode](https://razorpay.com/docs/payments/payments/test-mode/)
- [Checkout Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

### Questions?
- Check Razorpay dashboard for test transactions
- View browser console for error logs
- Check Supabase logs for database errors

---

## ✅ Checklist

- [ ] Created Razorpay account
- [ ] Generated test API keys
- [ ] Updated `.env` file with test key ID
- [ ] Restarted development server
- [ ] Ran database migration SQL
- [ ] Tested payment with test card
- [ ] Verified order in database
- [ ] Checked auto-update functionality

---

**🎉 You're all set! Your Razorpay test mode integration is complete.**
