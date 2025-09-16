import { useState } from 'react';
import { TrendingUp, TrendingDown, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Position {
  id: string;
  asset: string;
  type: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  collateral: number;
  pnl: number;
  pnlPercent: number;
  liquidationPrice: number;
  timestamp: Date;
}

// Mock positions data
const mockPositions: Position[] = [
  {
    id: '1',
    asset: 'BTC',
    type: 'long',
    size: 0.1,
    entryPrice: 64500.00,
    currentPrice: 65420.50,
    leverage: 3,
    collateral: 215.00,
    pnl: 92.05,
    pnlPercent: 4.28,
    liquidationPrice: 58050.00,
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    asset: 'ETH',
    type: 'short',
    size: 2.5,
    entryPrice: 3280.00,
    currentPrice: 3245.75,
    leverage: 2,
    collateral: 410.00,
    pnl: 85.63,
    pnlPercent: 2.09,
    liquidationPrice: 3936.00,
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    id: '3',
    asset: 'WTI',
    type: 'long',
    size: 10,
    entryPrice: 62.80,
    currentPrice: 63.45,
    leverage: 5,
    collateral: 125.60,
    pnl: 6.50,
    pnlPercent: 1.04,
    liquidationPrice: 50.24,
    timestamp: new Date(Date.now() - 1800000),
  },
];

export function PositionsList() {
  const [positions, setPositions] = useState<Position[]>(mockPositions);

  const handleClosePosition = (positionId: string) => {
    setPositions(prev => prev.filter(p => p.id !== positionId));
  };

  const getRiskLevel = (currentPrice: number, liquidationPrice: number, type: 'long' | 'short') => {
    const distancePercent = type === 'long' 
      ? ((currentPrice - liquidationPrice) / currentPrice) * 100
      : ((liquidationPrice - currentPrice) / currentPrice) * 100;
    
    if (distancePercent < 10) return 'high';
    if (distancePercent < 25) return 'medium';
    return 'low';
  };

  if (positions.length === 0) {
    return (
      <Card className="trading-panel">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Active Positions</h3>
            <p className="text-muted-foreground">Open your first position to start trading synthetic assets.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="trading-panel">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>Active Positions</span>
          <Badge variant="secondary">{positions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => {
            const isProfitable = position.pnl >= 0;
            const riskLevel = getRiskLevel(position.currentPrice, position.liquidationPrice, position.type);
            
            return (
              <div
                key={position.id}
                className="border border-trading-border rounded-lg p-4 bg-trading-bg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">{position.asset}</span>
                      <Badge
                        variant={position.type === 'long' ? 'default' : 'secondary'}
                        className={cn(
                          position.type === 'long'
                            ? "bg-success text-success-foreground"
                            : "bg-danger text-danger-foreground"
                        )}
                      >
                        {position.type === 'long' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {position.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {position.leverage}x
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {riskLevel === 'high' && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClosePosition(position.id)}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-mono font-medium">{position.size} {position.asset}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Entry Price</p>
                    <p className="font-mono font-medium">${position.entryPrice.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Current Price</p>
                    <p className="font-mono font-medium">${position.currentPrice.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Collateral</p>
                    <p className="font-mono font-medium">{position.collateral.toFixed(2)} XLM</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-trading-border">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-muted-foreground text-xs">P&L</p>
                      <p className={cn(
                        "font-mono font-bold",
                        isProfitable ? "text-success" : "text-danger"
                      )}>
                        {isProfitable ? '+' : ''}${position.pnl.toFixed(2)}
                        <span className="text-xs ml-1">
                          ({isProfitable ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground text-xs">Liquidation</p>
                      <p className={cn(
                        "font-mono text-sm",
                        riskLevel === 'high' ? "text-warning" : "text-muted-foreground"
                      )}>
                        ${position.liquidationPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClosePosition(position.id)}
                    className="border-danger text-danger hover:bg-danger hover:text-danger-foreground"
                  >
                    Close Position
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}