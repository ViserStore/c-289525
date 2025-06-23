
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Trophy, X } from 'lucide-react';
import { Trade } from '@/pages/BinaryTrading';
import { formatCurrency } from '@/lib/utils';

interface TradeHistoryProps {
  trades: Trade[];
}

const TradeHistory = ({ trades }: TradeHistoryProps) => {
  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No trade history</p>
          <p className="text-sm mt-1">Completed trades will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade) => {
        const profit = (trade.payout || 0) - trade.amount;
        const priceChange = (trade.endPrice || 0) - trade.startPrice;
        
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
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={trade.status === 'won' ? 'default' : 'destructive'}
                    className={trade.status === 'won' ? 'bg-emerald-500' : ''}
                  >
                    {trade.status === 'won' ? (
                      <Trophy className="w-3 h-3 mr-1" />
                    ) : (
                      <X className="w-3 h-3 mr-1" />
                    )}
                    {trade.status === 'won' ? 'Won' : 'Lost'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <p className="text-gray-500">Investment</p>
                  <p className="font-medium">{formatCurrency(trade.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payout</p>
                  <p className={`font-medium ${trade.status === 'won' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {formatCurrency(trade.payout || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Start Price</p>
                  <p className="font-medium">{trade.startPrice.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-500">End Price</p>
                  <p className={`font-medium ${priceChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trade.endPrice?.toFixed(4)}
                    <span className="text-xs ml-1">
                      ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)})
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="text-sm text-gray-500">
                  {trade.endTime?.toLocaleString()}
                </div>
                <div className={`text-sm font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  P&L: {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TradeHistory;
