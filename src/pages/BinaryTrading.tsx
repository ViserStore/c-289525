
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import TradingChart from '@/components/BinaryTrading/TradingChart';
import TradeControls from '@/components/BinaryTrading/TradeControls';
import ActiveTrades from '@/components/BinaryTrading/ActiveTrades';
import TradeHistory from '@/components/BinaryTrading/TradeHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
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
    <AppLayout headerTitle="Binary Trading" className="bg-gray-50">
      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <div>
                  <p className="text-xs opacity-90">Balance</p>
                  <p className="text-lg font-bold">{formatCurrency(user?.available_balance || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${totalProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <div>
                  <p className="text-xs opacity-70">Total P&L</p>
                  <p className="text-lg font-bold">{formatCurrency(totalProfit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-100 text-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <div>
                  <p className="text-xs opacity-70">Win Rate</p>
                  <p className="text-lg font-bold">{winRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <TradingChart />
          </CardContent>
        </Card>

        {/* Trade Controls */}
        <TradeControls onNewTrade={handleNewTrade} userBalance={user?.available_balance || 0} />

        {/* Active Trades & History */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Trades ({activeTrades.length})
            </TabsTrigger>
            <TabsTrigger value="history">
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
