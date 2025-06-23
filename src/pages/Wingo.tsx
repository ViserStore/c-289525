
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Coins, Timer, Play, History, TrendingUp, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import { wingoService } from '@/services/wingoService';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const Wingo = () => {
  const { user, refreshUser } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  const [selectedColor, setSelectedColor] = useState<'red' | 'green' | 'violet' | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  useEffect(() => {
    loadGameData();
    startTimer();
  }, []);

  const loadGameData = async () => {
    try {
      const history = await wingoService.getGameHistory(10);
      setGameHistory(history);
      setCurrentPeriod(wingoService.getCurrentPeriod());
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto play if user has placed a bet
          if (selectedColor || selectedNumber) {
            handlePlay();
          }
          return 30; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const handleColorSelect = (color: 'red' | 'green' | 'violet') => {
    setSelectedColor(selectedColor === color ? null : color);
    setSelectedNumber(null);
  };

  const handleNumberSelect = (number: number) => {
    setSelectedNumber(selectedNumber === number ? null : number);
    setSelectedColor(null);
  };

  const handlePlay = async () => {
    if (!user || (!selectedColor && selectedNumber === null)) {
      toast.error('Please select a color or number');
      return;
    }

    if (betAmount < 1 || betAmount > user.available_balance) {
      toast.error('Invalid bet amount');
      return;
    }

    setIsPlaying(true);
    
    try {
      const result = await wingoService.placeBet({
        userId: user.id,
        betType: selectedColor ? 'color' : 'number',
        betValue: selectedColor || selectedNumber!,
        amount: betAmount,
        period: currentPeriod
      });

      if (result.success) {
        setGameResult(result);
        await refreshUser();
        await loadGameData();
        
        if (result.isWin) {
          toast.success(`You won ${formatCurrencyWithSettings(result.winAmount, systemSettings)}!`);
        } else {
          toast.error('Better luck next time!');
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error playing game:', error);
      toast.error('Error placing bet');
    } finally {
      setIsPlaying(false);
      setSelectedColor(null);
      setSelectedNumber(null);
    }
  };

  const getColorStyle = (color: string) => {
    switch (color) {
      case 'red': return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30';
      case 'green': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30';
      case 'violet': return 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30';
    }
  };

  const getNumberColor = (num: number) => {
    if (num === 0 || num === 5) return 'violet';
    if ([1, 3, 7, 9].includes(num)) return 'green';
    return 'red';
  };

  const quickAmounts = [10, 50, 100, 500];

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-emerald-400 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-32 right-16 w-1 h-1 bg-green-300 rounded-full animate-ping opacity-40"></div>
          <div className="absolute bottom-32 left-20 w-3 h-3 bg-teal-400 rounded-full animate-bounce opacity-50"></div>
          <div className="absolute top-64 left-1/2 w-1 h-1 bg-emerald-300 rounded-full animate-pulse opacity-70"></div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-4 pt-8 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Link to="/" className="mr-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 hover:scale-110">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="flex items-center space-x-2">
                  <Crown className="w-6 h-6 text-yellow-300" />
                  <h1 className="text-2xl font-bold text-white">Wingo</h1>
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full px-4 py-2 border border-yellow-300 shadow-lg">
                <Coins className="w-5 h-5 text-yellow-900 mr-2" />
                <span className="text-yellow-900 font-bold text-lg">{formatCurrencyWithSettings(user?.available_balance || 0, systemSettings)}</span>
              </div>
            </div>

            {/* Timer and Period */}
            <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Current Period</p>
                  <p className="text-white text-xl font-bold">{currentPeriod}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center text-white mb-2">
                    <Timer className="w-5 h-5 mr-2 text-emerald-300" />
                    <span className="text-sm font-medium">Time Left</span>
                  </div>
                  <div className={`text-3xl font-bold ${timeLeft <= 10 ? 'text-red-300 animate-pulse' : 'text-yellow-300'} drop-shadow-lg`}>
                    {timeLeft}s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 p-4 space-y-6">
          {/* Color Selection */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                Select Color
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={() => handleColorSelect('green')}
                  className={`h-20 rounded-2xl font-bold text-xl transition-all duration-300 ${
                    selectedColor === 'green' 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 ring-4 ring-emerald-300 scale-105 shadow-2xl shadow-emerald-500/50' 
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105 shadow-lg shadow-emerald-500/30'
                  }`}
                >
                  Green
                </Button>
                <Button
                  onClick={() => handleColorSelect('violet')}
                  className={`h-20 rounded-2xl font-bold text-xl transition-all duration-300 ${
                    selectedColor === 'violet' 
                      ? 'bg-gradient-to-r from-purple-500 to-violet-600 ring-4 ring-purple-300 scale-105 shadow-2xl shadow-purple-500/50' 
                      : 'bg-gradient-to-r from-purple-500 to-violet-600 hover:scale-105 shadow-lg shadow-purple-500/30'
                  }`}
                >
                  Violet
                </Button>
                <Button
                  onClick={() => handleColorSelect('red')}
                  className={`h-20 rounded-2xl font-bold text-xl transition-all duration-300 ${
                    selectedColor === 'red' 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 ring-4 ring-red-300 scale-105 shadow-2xl shadow-red-500/50' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:scale-105 shadow-lg shadow-red-500/30'
                  }`}
                >
                  Red
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Number Selection */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl">Select Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleNumberSelect(num)}
                    className={`h-16 rounded-2xl font-bold text-lg transition-all duration-300 ${getColorStyle(getNumberColor(num))} ${
                      selectedNumber === num ? 'ring-4 ring-yellow-300 scale-110 shadow-2xl' : 'hover:scale-105'
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bet Amount */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl">Bet Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="flex-1 p-4 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/60 text-lg font-medium backdrop-blur-sm"
                  placeholder="Enter amount"
                  min="1"
                  max={user?.available_balance || 0}
                />
                <Button
                  onClick={handlePlay}
                  disabled={isPlaying || (!selectedColor && selectedNumber === null) || timeLeft < 5}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2 animate-spin" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              </div>
              
              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl py-2 transition-all duration-300"
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game History */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl flex items-center">
                <History className="w-6 h-6 mr-2 text-emerald-400" />
                Recent Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gameHistory.slice(0, 5).map((game, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                    <div className="flex items-center space-x-4">
                      <Badge className={`${getColorStyle(getNumberColor(game.result_number))} px-3 py-2 text-lg font-bold rounded-xl`}>
                        {game.result_number}
                      </Badge>
                      <span className="text-white font-medium">{game.period}</span>
                    </div>
                    <span className="text-emerald-300 text-sm font-medium">{new Date(game.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Wingo;
