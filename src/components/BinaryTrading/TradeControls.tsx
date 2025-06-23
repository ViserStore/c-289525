
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { Trade } from '@/pages/BinaryTrading';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface TradeControlsProps {
  onNewTrade: (trade: Omit<Trade, 'id' | 'startTime' | 'status'>) => void;
  userBalance: number;
}

const ASSETS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD', 'GOLD'
];

const DURATIONS = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const TradeControls = ({ onNewTrade, userBalance }: TradeControlsProps) => {
  const [selectedAsset, setSelectedAsset] = useState('EUR/USD');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(60);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const calculatePayout = (tradeAmount: number) => {
    const payoutRate = 0.85; // 85% payout rate
    return tradeAmount + (tradeAmount * payoutRate);
  };

  const handleTrade = () => {
    if (!direction) {
      toast.error('Please select a direction (Up or Down)');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const tradeAmount = parseFloat(amount);
    
    if (tradeAmount > userBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (tradeAmount < 10) {
      toast.error('Minimum trade amount is Rs. 10');
      return;
    }

    // Simulate current price (in real app, this would come from live data)
    const mockCurrentPrices: { [key: string]: number } = {
      'EUR/USD': 1.0850 + (Math.random() - 0.5) * 0.01,
      'GBP/USD': 1.2750 + (Math.random() - 0.5) * 0.01,
      'USD/JPY': 149.50 + (Math.random() - 0.5) * 1,
      'BTC/USD': 43500 + (Math.random() - 0.5) * 1000,
      'ETH/USD': 2650 + (Math.random() - 0.5) * 100,
      'GOLD': 2035 + (Math.random() - 0.5) * 20,
    };

    const trade = {
      asset: selectedAsset,
      direction,
      amount: tradeAmount,
      startPrice: mockCurrentPrices[selectedAsset] || 1.0850,
      duration,
    };

    onNewTrade(trade);
    
    // Reset form
    setAmount('');
    setDirection(null);
    
    toast.success(`Trade placed: ${direction.toUpperCase()} ${selectedAsset} for ${formatCurrency(tradeAmount)}`);
  };

  const tradeAmount = parseFloat(amount) || 0;
  const potentialPayout = calculatePayout(tradeAmount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Place New Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Selection */}
        <div className="space-y-2">
          <Label>Asset</Label>
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSETS.map((asset) => (
                <SelectItem key={asset} value={asset}>
                  {asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Trade Amount</Label>
          <div className="space-y-3">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="10"
                max={userBalance}
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  disabled={quickAmount > userBalance}
                  className="text-xs"
                >
                  {formatCurrency(quickAmount)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((dur) => (
                <SelectItem key={dur.value} value={dur.value.toString()}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {dur.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Direction Selection */}
        <div className="space-y-2">
          <Label>Direction</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={direction === 'up' ? 'default' : 'outline'}
              onClick={() => setDirection('up')}
              className={`h-16 ${direction === 'up' ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-600'}`}
            >
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="w-6 h-6" />
                <span className="font-semibold">UP</span>
              </div>
            </Button>
            
            <Button
              variant={direction === 'down' ? 'destructive' : 'outline'}
              onClick={() => setDirection('down')}
              className="h-16"
            >
              <div className="flex flex-col items-center gap-1">
                <TrendingDown className="w-6 h-6" />
                <span className="font-semibold">DOWN</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Trade Summary */}
        {tradeAmount > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Investment:</span>
              <span className="font-medium">{formatCurrency(tradeAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Potential Payout:</span>
              <span className="font-medium text-emerald-600">{formatCurrency(potentialPayout)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Potential Profit:</span>
              <span className="font-medium text-emerald-600">{formatCurrency(potentialPayout - tradeAmount)}</span>
            </div>
          </div>
        )}

        {/* Place Trade Button */}
        <Button
          onClick={handleTrade}
          disabled={!direction || !amount || tradeAmount <= 0 || tradeAmount > userBalance}
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600"
          size="lg"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Place Trade
          </div>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TradeControls;
