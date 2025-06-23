
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import TradingChart from '@/components/BinaryTrading/TradingChart';
import TradeControls from '@/components/BinaryTrading/TradeControls';
import ActiveTrades from '@/components/BinaryTrading/ActiveTrades';
import TradeHistory from '@/components/BinaryTrading/TradeHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

export interface Trade {
  id: string;
  asset: string;
  direction: 'up' | 'down';
  amount: number;
  startPrice: number;
  currentPrice?: number;
  endPrice?: number;
  duration: number;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'won' | 'lost';
  payout?: number;
}

const BinaryTrading = () => {
  const { user } = useAuth();
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [winRate, setWinRate] = useState(0);

  // Calculate stats when trade history changes
  useEffect(() => {
    const completedTrades = tradeHistory.filter(trade => trade.status !== 'active');
    const wonTrades = completedTrades.filter(trade => trade.status === 'won');
    const totalPnL = completedTrades.reduce((sum, trade) => {
      return sum + (trade.payout || 0) - trade.amount;
    }, 0);
    
    setTotalProfit(totalPnL);
    setWinRate(completedTrades.length > 0 ? (wonTrades.length / completedTrades.length) * 100 : 0);
  }, [tradeHistory]);

  const handleNewTrade = (trade: Omit<Trade, 'id' | 'startTime' | 'status'>) => {
    const newTrade: Trade = {
      ...trade,
      id: Date.now().toString(),
      startTime: new Date(),
      status: 'active'
    };
    
    setActiveTrades(prev => [...prev, newTrade]);
  };

  const handleTradeComplete = (completedTrade: Trade) => {
    setActiveTrades(prev => prev.filter(trade => trade.id !== completedTrade.id));
    setTradeHistory(prev => [completedTrade, ...prev]);
  };

  return (
    <AppLayout headerTitle="Binary Trading" className="bg-gray-950 min-h-screen">
      <div className="p-4 space-y-4">
        {/* Balance Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6" />
              <span className="text-lg font-semibold">{formatCurrency(user?.available_balance || 0)}</span>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Win Rate</div>
              <div className="text-lg font-bold">{winRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Trading Chart */}
        <TradingChart />

        {/* Trade Controls */}
        <TradeControls onNewTrade={handleNewTrade} userBalance={user?.available_balance || 0} />

        {/* Active Trades & History */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="active" className="text-white data-[state=active]:bg-gray-700">
              Active Trades ({activeTrades.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white data-[state=active]:bg-gray-700">
              History ({tradeHistory.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            <ActiveTrades 
              trades={activeTrades} 
              onTradeComplete={handleTradeComplete}
            />
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <TradeHistory trades={tradeHistory} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default BinaryTrading;
