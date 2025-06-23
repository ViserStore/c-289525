import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Coins, Gift, Play, RotateCcw, Plus, Gamepad2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import { gameService, GameSettings, GameStats } from '@/services/gameService';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatCurrencyWithSettings } from '@/lib/utils';

const Game = () => {
  const { user, refreshUser } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [spinAnimation, setSpinAnimation] = useState(false);
  const [winnings, setWinnings] = useState(0);

  useEffect(() => {
    if (user) {
      loadGameData();
    }
  }, [user]);

  const loadGameData = async () => {
    try {
      const [gameSettings, gameStats] = await Promise.all([
        gameService.getGameSettings(),
        gameService.getUserDailyStats(user!.id)
      ]);
      
      setSettings(gameSettings);
      setStats(gameStats);
    } catch (error) {
      console.error('Error loading game data:', error);
      toast.error('Failed to load game data');
    }
  };

  const playGame = async () => {
    if (!user || !settings) return;
    
    setIsPlaying(true);
    setSpinAnimation(true);
    setGameResult(null); // Reset previous result
    
    try {
      const result = await gameService.playGame(user.id);
      
      setTimeout(async () => {
        if (result.success) {
          setGameResult(result.isWin ? 'win' : 'lose');
          setWinnings(result.prize);
          toast.success(result.message);
          
          // Refresh user data to get updated balance and stats
          await Promise.all([
            refreshUser(), // This will update the user balance in context
            loadGameData() // This will update the game stats
          ]);
        } else {
          toast.error(result.message);
        }
        
        setSpinAnimation(false);
        setIsPlaying(false);
      }, 2000);
    } catch (error) {
      console.error('Error playing game:', error);
      toast.error('Error playing game');
      setSpinAnimation(false);
      setIsPlaying(false);
    }
  };

  const resetGame = () => {
    setGameResult(null);
    setWinnings(0);
  };

  const canPlay = () => {
    if (!settings || !stats || !user) return false;
    return settings.game_enabled && 
           !stats.daily_limit_reached && 
           user.available_balance >= settings.game_cost_per_play;
  };

  const getPlayButtonText = () => {
    if (!settings) return 'Loading...';
    if (isPlaying) return 'Playing...';
    if (!settings.game_enabled) return 'Game Disabled';
    if (stats?.daily_limit_reached) return 'Daily Limit Reached';
    if (!user || user.available_balance < settings.game_cost_per_play) return 'Insufficient Balance';
    return `Play (${formatCurrencyWithSettings(settings.game_cost_per_play, systemSettings)})`;
  };

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-3 pt-6 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Link to="/" className="mr-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Link>
              <h1 className="text-lg font-bold text-white">{formatCurrencyWithSettings(settings?.game_cost_per_play || 1, systemSettings)} Game</h1>
            </div>
            <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full px-2 py-1 border border-white/30">
              <Coins className="w-3 h-3 text-yellow-300 mr-1" />
              <span className="text-white font-bold text-sm">{formatCurrencyWithSettings(user?.available_balance || 0, systemSettings)}</span>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 border border-white/30">
            <p className="text-emerald-100 text-xs">Current Balance</p>
            <p className="text-white text-lg font-bold">{formatCurrencyWithSettings(user?.available_balance || 0, systemSettings)}</p>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 p-3 space-y-3 mt-1">
          {/* Game Status Alert */}
          {(!settings?.game_enabled || stats?.daily_limit_reached) && (
            <Card className="border-0 shadow-lg bg-orange-50 border-orange-200 rounded-xl">
              <CardContent className="p-3 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-orange-800 font-medium text-sm">
                    {!settings?.game_enabled ? 'Game is temporarily disabled' : 
                     `Daily limit reached (${stats?.today_plays}/${settings?.game_daily_play_limit} plays)`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Game Card */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <Gamepad2 className="w-4 h-4 mr-2 text-emerald-600" />
                Spin to Win!
              </CardTitle>
              <p className="text-gray-600 text-xs">
                Pay {formatCurrencyWithSettings(settings?.game_cost_per_play || 1, systemSettings)}, win up to {formatCurrencyWithSettings(settings?.game_max_prize || 11, systemSettings)}!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Spinning Wheel */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 flex items-center justify-center shadow-2xl ${spinAnimation ? 'animate-spin' : ''} transition-all duration-2000`}>
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-inner">
                      {gameResult === 'win' ? (
                        <div className="text-center animate-bounce">
                          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                          <div className="text-lg font-bold text-green-600">+{formatCurrencyWithSettings(winnings, systemSettings)}</div>
                          <div className="text-xs text-green-600">You Won!</div>
                        </div>
                      ) : gameResult === 'lose' ? (
                        <div className="text-center">
                          <div className="text-2xl mb-1">😔</div>
                          <div className="text-xs text-gray-500">Try Again</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Star className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                          <div className="text-xs text-gray-500">Ready</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                    <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-emerald-600"></div>
                  </div>
                </div>
              </div>

              {/* Game Result Display */}
              {gameResult && !spinAnimation && (
                <div className={`text-center p-3 rounded-xl ${gameResult === 'win' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {gameResult === 'win' ? (
                    <div className="space-y-1">
                      <div className="text-green-600 font-bold text-base">🎉 Congratulations!</div>
                      <div className="text-green-700 text-sm">You won {formatCurrencyWithSettings(winnings, systemSettings)}!</div>
                      <div className="text-xs text-green-600">Your balance has been updated.</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-red-600 font-bold text-base">Better luck next time!</div>
                      <div className="text-xs text-red-600">Try again for a chance to win!</div>
                    </div>
                  )}
                </div>
              )}

              {/* Game Buttons */}
              <div className="flex justify-center space-x-2">
                <Button 
                  onClick={playGame}
                  disabled={isPlaying || !canPlay()}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-4 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isPlaying ? (
                    <>
                      <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      {getPlayButtonText()}
                    </>
                  )}
                </Button>
                
                {gameResult && !isPlaying && (
                  <Button 
                    onClick={resetGame}
                    variant="outline"
                    className="px-3 py-2 rounded-xl border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 text-sm"
                  >
                    Play Again
                  </Button>
                )}
              </div>

              {user && user.available_balance < (settings?.game_cost_per_play || 1) && (
                <div className="text-center bg-red-50 p-3 rounded-xl border border-red-200">
                  <p className="text-red-600 font-medium mb-2 text-sm">Insufficient balance!</p>
                  <Link to="/deposit">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Money
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Rules */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <Gift className="w-4 h-4 mr-2 text-emerald-600" />
                How to Play
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start space-x-2">
                <Badge className="bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 text-xs font-semibold">1</Badge>
                <p className="text-xs text-gray-600">Pay {formatCurrencyWithSettings(settings?.game_cost_per_play || 1, systemSettings)} to spin the wheel</p>
              </div>
              <div className="flex items-start space-x-2">
                <Badge className="bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 text-xs font-semibold">2</Badge>
                <p className="text-xs text-gray-600">Wait for the wheel to stop spinning</p>
              </div>
              <div className="flex items-start space-x-2">
                <Badge className="bg-teal-100 text-teal-700 rounded-full px-1.5 py-0.5 text-xs font-semibold">3</Badge>
                <p className="text-xs text-gray-600">Win {formatCurrencyWithSettings(settings?.game_min_prize || 2, systemSettings)}-{formatCurrencyWithSettings(settings?.game_max_prize || 11, systemSettings)} instantly or try again!</p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold">{formatCurrencyWithSettings(user?.available_balance || 0, systemSettings)}</div>
                <div className="text-xs opacity-90">Balance</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold">{stats?.today_plays || 0}/{settings?.game_daily_play_limit || 50}</div>
                <div className="text-xs opacity-90">Today's Plays</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Game;
