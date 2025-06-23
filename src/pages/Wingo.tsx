
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Coins, Timer, Play, History, TrendingUp } from 'lucide-react';
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
      case 'red': return 'bg-red-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      case 'violet': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getNumberColor = (num: number) => {
    if (num === 0 || num === 5) return 'violet';
    if ([1, 3, 7, 9].includes(num)) return 'green';
    return 'red';
  };

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4 pt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link to="/" className="mr-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-xl font-bold text-white">Wingo</h1>
            </div>
            <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full px-3 py-2 border border-white/30">
              <Coins className="w-4 h-4 text-yellow-300 mr-2" />
              <span className="text-white font-bold">{formatCurrencyWithSettings(user?.available_balance || 0, systemSettings)}</span>
            </div>
          </div>

          {/* Timer and Period */}
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Current Period</p>
                <p className="text-white text-lg font-bold">{currentPeriod}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center text-white mb-1">
                  <Timer className="w-4 h-4 mr-1" />
                  <span className="text-sm">Time Left</span>
                </div>
                <div className="text-2xl font-bold text-yellow-300">{timeLeft}s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Color Selection */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Select Color</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleColorSelect('green')}
                  className={`h-16 rounded-xl font-bold text-lg ${
                    selectedColor === 'green' 
                      ? 'bg-green-500 ring-4 ring-green-300' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  Green
                </Button>
                <Button
                  onClick={() => handleColorSelect('violet')}
                  className={`h-16 rounded-xl font-bold text-lg ${
                    selectedColor === 'violet' 
                      ? 'bg-purple-500 ring-4 ring-purple-300' 
                      : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  Violet
                </Button>
                <Button
                  onClick={() => handleColorSelect('red')}
                  className={`h-16 rounded-xl font-bold text-lg ${
                    selectedColor === 'red' 
                      ? 'bg-red-500 ring-4 ring-red-300' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  Red
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Number Selection */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Select Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleNumberSelect(num)}
                    className={`h-12 rounded-xl font-bold ${getColorStyle(getNumberColor(num))} ${
                      selectedNumber === num ? 'ring-4 ring-yellow-300' : ''
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bet Amount */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Bet Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="flex-1 p-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60"
                  placeholder="Enter amount"
                  min="1"
                  max={user?.available_balance || 0}
                />
                <Button
                  onClick={handlePlay}
                  disabled={isPlaying || (!selectedColor && selectedNumber === null) || timeLeft < 5}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6 py-3 rounded-xl font-bold"
                >
                  {isPlaying ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2 animate-spin" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Game History */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center">
                <History className="w-5 h-5 mr-2" />
                Recent Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gameHistory.slice(0, 5).map((game, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getColorStyle(getNumberColor(game.result_number))} px-2 py-1`}>
                        {game.result_number}
                      </Badge>
                      <span className="text-white text-sm">{game.period}</span>
                    </div>
                    <span className="text-white/80 text-sm">{new Date(game.created_at).toLocaleTimeString()}</span>
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
