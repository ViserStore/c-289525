
import React, { useState, useEffect } from 'react';
import { User, TrendingUp, TrendingDown, Coins } from 'lucide-react';

interface BetRecord {
  id: string;
  username: string;
  betAmount: number;
  multiplier: number;
  profit: number;
  timestamp: Date;
  isWin: boolean;
}

const LiveBettingDemo = () => {
  const [liveBets, setLiveBets] = useState<BetRecord[]>([]);
  const [activeBets, setActiveBets] = useState<Array<{id: string, username: string, betAmount: number}>>([]);

  // Demo usernames
  const demoUsers = [
    'CryptoKing', 'RocketRider', 'LuckyStrike', 'AviatorPro', 'SkyHunter',
    'StarGazer', 'MoonWalker', 'GalaxyGamer', 'CosmicBet', 'SpaceExplorer'
  ];

  // Generate random bet activity
  useEffect(() => {
    const generateActivity = () => {
      // Generate new bet
      if (Math.random() > 0.7 && activeBets.length < 10) {
        const username = demoUsers[Math.floor(Math.random() * demoUsers.length)];
        const betAmount = Math.floor(Math.random() * 500) + 10;
        
        setActiveBets(prev => [...prev, {
          id: Date.now().toString(),
          username,
          betAmount
        }]);
      }

      // Cash out random active bets
      if (activeBets.length > 0 && Math.random() > 0.6) {
        const randomIndex = Math.floor(Math.random() * activeBets.length);
        const bet = activeBets[randomIndex];
        const multiplier = Math.random() * 8 + 1.2; // 1.2x to 9.2x
        const profit = bet.betAmount * multiplier - bet.betAmount;
        
        const newRecord: BetRecord = {
          id: bet.id,
          username: bet.username,
          betAmount: bet.betAmount,
          multiplier: parseFloat(multiplier.toFixed(2)),
          profit: parseFloat(profit.toFixed(2)),
          timestamp: new Date(),
          isWin: profit > 0
        };

        setLiveBets(prev => [newRecord, ...prev.slice(0, 9)]);
        setActiveBets(prev => prev.filter((_, i) => i !== randomIndex));
      }
    };

    const interval = setInterval(generateActivity, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [activeBets]);

  return (
    <div className="space-y-4">
      {/* Active Bets */}
      {activeBets.length > 0 && (
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
          <h4 className="text-blue-300 font-semibold mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Flying Now ({activeBets.length})
          </h4>
          <div className="space-y-2 max-h-24 overflow-y-auto">
            {activeBets.slice(0, 5).map((bet) => (
              <div key={bet.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-2 text-blue-400" />
                  <span className="text-white font-medium">{bet.username}</span>
                </div>
                <div className="flex items-center text-blue-300">
                  <Coins className="w-3 h-3 mr-1" />
                  <span>Rs.{bet.betAmount}</span>
                  <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Betting History */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <h4 className="text-white font-semibold mb-3 flex items-center">
          <TrendingDown className="w-4 h-4 mr-2" />
          Live Results
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {liveBets.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-4">
              Waiting for live activity...
            </div>
          ) : (
            liveBets.map((record) => (
              <div 
                key={record.id} 
                className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                  record.isWin ? 'bg-green-500/20 border border-green-400/30' : 'bg-red-500/20 border border-red-400/30'
                }`}
              >
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-2 text-gray-300" />
                  <span className="text-white text-sm font-medium">{record.username}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-gray-300">Rs.{record.betAmount}</span>
                  <span className={`font-bold ${record.isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {record.multiplier.toFixed(2)}x
                  </span>
                  <span className={`font-semibold ${record.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {record.profit >= 0 ? '+' : ''}Rs.{record.profit.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveBettingDemo;
