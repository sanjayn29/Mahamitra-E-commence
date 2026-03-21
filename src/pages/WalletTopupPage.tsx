import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Wallet } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { initiateWalletTopupPayment } from '@/services/razorpayService';
import { toast } from 'sonner';

const QUICK_AMOUNTS = [250, 500, 1000, 2000, 5000];

const WalletTopupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [walletBalance, setWalletBalance] = useState(0);
  const [amountInput, setAmountInput] = useState('500');
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [processing, setProcessing] = useState(false);

  const topupAmount = useMemo(() => {
    const parsed = Number(amountInput);
    return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
  }, [amountInput]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadWalletBalance = async () => {
      try {
        setLoadingBalance(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setWalletBalance(Number(data?.wallet_balance || 0));
      } catch (error) {
        console.error('Error loading wallet balance:', error);
        toast.error('Unable to load wallet balance');
      } finally {
        setLoadingBalance(false);
      }
    };

    loadWalletBalance();
  }, [user, navigate]);

  const handleTopup = () => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (topupAmount < 100) {
      toast.error('Minimum top-up amount is ₹100');
      return;
    }

    setProcessing(true);

    initiateWalletTopupPayment(
      {
        amount: topupAmount,
        customerName: user.user_metadata?.full_name || user.user_metadata?.name || 'Customer',
        customerEmail: user.email || '',
        customerPhone: user.user_metadata?.phone || '',
      },
      (paymentId, newBalance) => {
        setWalletBalance(newBalance);
        setProcessing(false);
        toast.success(`Top-up successful. ₹${topupAmount.toLocaleString()} added. Payment ID: ${paymentId}`);
      },
      (error) => {
        setProcessing(false);
        toast.error(error);
      }
    );
  };

  return (
    <MainLayout>
      <SEO
        title="Wallet Top-up | Mahamitra Boutique"
        description="Add funds to your Mahamitra wallet and use balance for your next purchase."
      />
      <div className="container mx-auto px-4 py-8 min-h-[60vh]">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft size={18} /> Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wallet size={22} /> Wallet Top-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md border p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">Current Wallet Balance</p>
                {loadingBalance ? (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading balance...
                  </div>
                ) : (
                  <p className="text-3xl font-bold mt-1">₹{walletBalance.toLocaleString('en-IN')}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="wallet-topup-amount">Top-up Amount (INR)</Label>
                <Input
                  id="wallet-topup-amount"
                  type="number"
                  min={100}
                  step={1}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Enter amount"
                />
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAmountInput(String(amount))}
                    >
                      ₹{amount.toLocaleString('en-IN')}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Minimum top-up is ₹100.</p>
              </div>

              <Button className="w-full" size="lg" onClick={handleTopup} disabled={processing || topupAmount < 100}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening payment...
                  </>
                ) : (
                  `Top-up Wallet - ₹${Math.max(0, topupAmount).toLocaleString('en-IN')}`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default WalletTopupPage;
