import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PriceData {
  time: string;
  price: number;
  volume: number;
  timestamp: number;
}

interface Asset {
  symbol: string;
  name: string;
  basePrice: number;
}

const ASSETS: Asset[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin / TetherUS', basePrice: 101137.68 },
  { symbol: 'EUR/USD', name: 'Euro vs US Dollar', basePrice: 1.0850 },
  { symbol: 'GBP/USD', name: 'British Pound vs US Dollar', basePrice: 1.2750 },
  { symbol: 'USD/JPY', name: 'US Dollar vs Japanese Yen', basePrice: 149.50 },
  { symbol: 'ETH/USD', name: 'Ethereum vs US Dollar', basePrice: 2650 },
  { symbol: 'GOLD', name: 'Gold Spot Price', basePrice: 2035 },
];

const TradingChart = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSETS[0]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(selectedAsset.basePrice);
  const [priceChange, setPriceChange] = useState(0);

  // Generate realistic price movement
  const generatePrice = (lastPrice: number, basePrice: number) => {
    const volatility = 0.0005; // 0.05% volatility
    const meanReversion = 0.02; // Pull towards base price
    const random = (Math.random() - 0.5) * 2;
    const meanReversionForce = (basePrice - lastPrice) * meanReversion;
    const change = random * volatility * basePrice + meanReversionForce;
    return Math.max(lastPrice + change, basePrice * 0.98);
  };

  // Generate volume data
  const generateVolume = () => {
    return Math.random() * 100 + 10;
  };

  // Initialize chart data
  useEffect(() => {
    const now = Date.now();
    const initialData: PriceData[] = [];
    let price = selectedAsset.basePrice;
    
    // Generate last 60 data points
    for (let i = 59; i >= 0; i--) {
      const timestamp = now - (i * 1000); // 1 second intervals
      price = generatePrice(price, selectedAsset.basePrice);
      initialData.push({
        time: new Date(timestamp).toLocaleTimeString('en-US', { hour12: false }),
        price: parseFloat(price.toFixed(2)),
        volume: generateVolume(),
        timestamp
      });
    }
    
    setPriceData(initialData);
    setCurrentPrice(price);
  }, [selectedAsset]);

  // Update price every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceData(prev => {
        const lastPrice = prev[prev.length - 1]?.price || selectedAsset.basePrice;
        const newPrice = generatePrice(lastPrice, selectedAsset.basePrice);
        const formattedPrice = parseFloat(newPrice.toFixed(2));
        
        const newPoint: PriceData = {
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          price: formattedPrice,
          volume: generateVolume(),
          timestamp: Date.now()
        };
        
        setCurrentPrice(formattedPrice);
        setPriceChange(formattedPrice - lastPrice);
        
        // Keep only last 60 points for performance
        return [...prev.slice(-59), newPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedAsset]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const priceChangePercent = ((priceChange / (currentPrice - priceChange)) * 100);

  return (
    <div className="bg-gray-900 text-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <Select value={selectedAsset.symbol} onValueChange={(value) => {
            const asset = ASSETS.find(a => a.symbol === value);
            if (asset) setSelectedAsset(asset);
          }}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {ASSETS.map((asset) => (
                <SelectItem key={asset.symbol} value={asset.symbol} className="text-white hover:bg-gray-700">
                  {asset.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatPrice(currentPrice)}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)}
              </span>
              <Badge variant={priceChange >= 0 ? "default" : "destructive"} 
                     className={`text-xs ${priceChange >= 0 ? "bg-green-500" : "bg-red-500"}`}>
                {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-400">
          Vol • {selectedAsset.symbol.split('/')[0]} • 2
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 relative">
        <ResponsiveContainer width="100%" height="70%">
          <LineChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickFormatter={(value) => value.slice(0, 5)}
            />
            <YAxis 
              domain={['dataMin - 20', 'dataMax + 20']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              tickFormatter={(value) => formatPrice(value)}
              orientation="right"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '6px',
                color: 'white'
              }}
              formatter={(value: number) => [formatPrice(value), 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Volume Chart */}
        <ResponsiveContainer width="100%" height="30%">
          <BarChart data={priceData} margin={{ top: 0, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={false}
            />
            <YAxis hide />
            <Bar 
              dataKey="volume" 
              fill="#374151"
              radius={[1, 1, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Current Price Line */}
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
            {formatPrice(currentPrice)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingChart;
