
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Timer } from 'lucide-react';
import { Trade } from '@/pages/BinaryTrading';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface TradeControlsProps {
  onNewTrade: (trade: Omit<Trade, 'id' | 'startTime' | 'status'>) => void;
  userBalance: number;
}

const ASSETS = [
  'BTC/USDT', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'ETH/USD', 'GOLD'
];

const DURATIONS = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
];

const TradeControls = ({ onNewTrade, userBalance }: TradeControlsProps) => {
  const [selectedAsset, setSelectedAsset] = useState('BTC/USDT');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(60);

  const handleTrade = (direction: 'up' | 'down') => {
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

    // Simulate current prices
    const mockCurrentPrices: { [key: string]: number } = {
      'BTC/USDT': 101137.68 + (Math.random() - 0.5) * 100,
      'EUR/USD': 1.0850 + (Math.random() - 0.5) * 0.01,
      'GBP/USD': 1.2750 + (Math.random() - 0.5) * 0.01,
      'USD/JPY': 149.50 + (Math.random() - 0.5) * 1,
      'ETH/USD': 2650 + (Math.random() - 0.5) * 100,
      'GOLD': 2035 + (Math.random() - 0.5) * 20,
    };

    const trade = {
      asset: selectedAsset,
      direction,
      amount: tradeAmount,
      startPrice: mockCurrentPrices[selectedAsset] || 101137.68,
      duration,
    };

    onNewTrade(trade);
    setAmount('');
    
    toast.success(`Trade placed: ${direction.toUpperCase()} ${selectedAsset} for ${formatCurrency(tradeAmount)}`);
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4 space-y-4">
      {/* Timer Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Timer className="w-4 h-4" />
          <span>Select Timer</span>
        </div>
        <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            {DURATIONS.map((dur) => (
              <SelectItem key={dur.value} value={dur.value.toString()} className="text-white hover:bg-gray-700">
                {dur.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="text-sm text-gray-400">Enter Amount</div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white text-center text-xl h-12 pr-12"
            min="10"
            max={userBalance}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-xs">ℹ</span>
          </div>
        </div>
      </div>

      {/* Trade Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => handleTrade('down')}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > userBalance}
          className="h-14 bg-red-500 hover:bg-red-600 text-white font-semibold"
        >
          <div className="flex flex-col items-center gap-1">
            <TrendingDown className="w-5 h-5" />
            <span>Down</span>
          </div>
        </Button>
        
        <Button
          onClick={() => handleTrade('up')}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > userBalance}
          className="h-14 bg-green-500 hover:bg-green-600 text-white font-semibold"
        >
          <div className="flex flex-col items-center gap-1">
            <TrendingUp className="w-5 h-5" />
            <span>Up</span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default TradeControls;
