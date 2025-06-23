import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PriceData {
  time: string;
  price: number;
  timestamp: number;
}

interface Asset {
  symbol: string;
  name: string;
  basePrice: number;
}

const ASSETS: Asset[] = [
  { symbol: 'EUR/USD', name: 'Euro vs US Dollar', basePrice: 1.0850 },
  { symbol: 'GBP/USD', name: 'British Pound vs US Dollar', basePrice: 1.2750 },
  { symbol: 'USD/JPY', name: 'US Dollar vs Japanese Yen', basePrice: 149.50 },
  { symbol: 'BTC/USD', name: 'Bitcoin vs US Dollar', basePrice: 43500 },
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
    const volatility = 0.001; // 0.1% volatility
    const meanReversion = 0.05; // Pull towards base price
    const random = (Math.random() - 0.5) * 2;
    const meanReversionForce = (basePrice - lastPrice) * meanReversion;
    const change = random * volatility * basePrice + meanReversionForce;
    return Math.max(lastPrice + change, basePrice * 0.95); // Don't go below 95% of base price
  };

  // Initialize chart data
  useEffect(() => {
    const now = Date.now();
    const initialData: PriceData[] = [];
    let price = selectedAsset.basePrice;
    
    // Generate last 50 data points
    for (let i = 49; i >= 0; i--) {
      const timestamp = now - (i * 2000); // 2 second intervals
      price = generatePrice(price, selectedAsset.basePrice);
      initialData.push({
        time: new Date(timestamp).toLocaleTimeString(),
        price: parseFloat(price.toFixed(selectedAsset.symbol.includes('JPY') ? 2 : 4)),
        timestamp
      });
    }
    
    setPriceData(initialData);
    setCurrentPrice(price);
  }, [selectedAsset]);

  // Update price every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceData(prev => {
        const lastPrice = prev[prev.length - 1]?.price || selectedAsset.basePrice;
        const newPrice = generatePrice(lastPrice, selectedAsset.basePrice);
        const formattedPrice = parseFloat(newPrice.toFixed(selectedAsset.symbol.includes('JPY') ? 2 : 4));
        
        const newPoint: PriceData = {
          time: new Date().toLocaleTimeString(),
          price: formattedPrice,
          timestamp: Date.now()
        };
        
        setCurrentPrice(formattedPrice);
        setPriceChange(formattedPrice - lastPrice);
        
        // Keep only last 50 points for performance
        return [...prev.slice(-49), newPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedAsset]);

  const formatPrice = (price: number) => {
    if (selectedAsset.symbol.includes('USD') && !selectedAsset.symbol.includes('JPY')) {
      return price.toFixed(4);
    }
    return price.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Asset Selector */}
      <div className="flex items-center justify-between">
        <Select value={selectedAsset.symbol} onValueChange={(value) => {
          const asset = ASSETS.find(a => a.symbol === value);
          if (asset) setSelectedAsset(asset);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSETS.map((asset) => (
              <SelectItem key={asset.symbol} value={asset.symbol}>
                {asset.symbol} - {asset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="text-right">
          <div className="text-2xl font-bold">
            {formatPrice(currentPrice)}
          </div>
          <Badge variant={priceChange >= 0 ? "default" : "destructive"} className={priceChange >= 0 ? "bg-emerald-500" : ""}>
            {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)}
          </Badge>
        </div>
      </div>

      {/* Chart */}
      <Card className="p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData}>
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.split(':').slice(0, 2).join(':')}
            />
            <YAxis 
              domain={['dataMin - 0.001', 'dataMax + 0.001']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPrice(value)}
            />
            <Tooltip 
              formatter={(value: number) => [formatPrice(value), 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default TradingChart;
