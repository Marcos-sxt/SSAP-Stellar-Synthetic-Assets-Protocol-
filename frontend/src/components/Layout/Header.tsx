import { Activity, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletButton } from '@/components/Wallet/WalletButton';

export function Header() {

  return (
    <header className="h-16 border-b border-trading-border bg-trading-surface flex items-center justify-between px-6">
      {/* Logo and Brand */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">SAPP</h1>
            <p className="text-xs text-muted-foreground -mt-1">Synthetic Asset Protocol</p>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-status-online" />
          <span className="text-sm text-muted-foreground">Live</span>
          <Badge variant="outline" className="text-xs border-status-online text-status-online">
            Testnet
          </Badge>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="flex items-center space-x-4">
        <WalletButton />
        
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}