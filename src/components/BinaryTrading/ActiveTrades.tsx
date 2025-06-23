
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Trade } from '@/pages/BinaryTrading';
import { formatCurrency } from '@/lib/utils';

interface ActiveTradesProps {
  trades: Trade[];
  onTradeComplete: (trade: Trade) => void;
}

const ActiveTrades = ({ trades, onTradeComplete }: ActiveTradesProps) => {
  useEffect(() => {
    const interval = setInterval(() => {
      trades.forEach(trade => {
        const now = new Date();
        const elapsed = (now.getTime() - trade.startTime.getTime()) / 1000;
        
        if (elapsed >= trade.duration) {
          // Simulate final price movement
          const volatility = 0.002;
          const random = (Math.random() - 0.5) * 2;
          const priceChange = random * volatility * trade.startPrice;
          const endPrice = trade.startPrice + priceChange;
          
          // Determine if trade won or lost
          const isWin = (trade.direction === 'up' && endPrice > trade.startPrice) ||
                       (trade.direction === 'down' && endPrice < trade.startPrice);
          
          const completedTrade: Trade = {
            ...trade,
            endPrice,
            endTime: now,
            status: isWin ? 'won' : 'lost',
            payout: isWin ? trade.amount * 1.85 : 0 // 85% payout rate
          };
          
          onTradeComplete(completedTrade);
        } else {
          // Update current price for active trades
          const currentVolatility = 0.001;
          const currentRandom = (Math.random() - 0.5) * 2;
          const currentPriceChange = currentRandom * currentVolatility * trade.startPrice;
          trade.currentPrice = trade.startPrice + currentPriceChange;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trades, onTradeComplete]);

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No active trades</p>
          <p className="text-sm mt-1">Place a trade to see it here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade) => {
        const now = new Date();
        const elapsed = (now.getTime() - trade.startTime.getTime()) / 1000;
        const remaining = Math.max(0, trade.duration - elapsed);
        const progress = (elapsed / trade.duration) * 100;
        
        const currentPrice = trade.currentPrice || trade.startPrice;
        const priceChange = currentPrice - trade.startPrice;
        const isCurrentlyWinning = (trade.direction === 'up' && priceChange > 0) ||
                                  (trade.direction === 'down' && priceChange < 0);

        return (
          <Card key={trade.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={trade.direction === 'up' ? 'default' : 'destructive'}
                    className={trade.direction === 'up' ? 'bg-emerald-500' : ''}
                  >
                    {trade.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {trade.direction.toUpperCase()}
                  </Badge>
                  <span className="font-medium">{trade.asset}</span>
                </div>
                
                <Badge variant={isCurrentlyWinning ? 'default' : 'destructive'} className={isCurrentlyWinning ? 'bg-emerald-500' : ''}>
                  {isCurrentlyWinning ? 'Winning' : 'Losing'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Investment</p>
                  <p className="font-medium">{formatCurrency(trade.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Potential Payout</p>
                  <p className="font-medium text-emerald-600">{formatCurrency(trade.amount * 1.85)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Start Price</p>
                  <p className="font-medium">{trade.startPrice.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Current Price</p>
                  <p className={`font-medium ${priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {currentPrice.toFixed(4)}
                    <span className="text-xs ml-1">
                      ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)})
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Time Remaining</span>
                  <span className="font-medium">
                    {Math.floor(remaining / 60)}:{(remaining % 60).toFixed(0).padStart(2, '0')}
                  </span>
                </div>
                
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ActiveTrades;
