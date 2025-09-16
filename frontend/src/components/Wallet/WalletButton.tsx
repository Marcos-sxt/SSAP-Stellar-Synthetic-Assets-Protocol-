import React from 'react';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

export const WalletButton: React.FC = () => {
  const { 
    isConnected, 
    publicKey, 
    balance, 
    isLoading, 
    error, 
    connect, 
    disconnect 
  } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  if (isLoading) {
    return (
      <Button disabled className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (error) {
    return (
      <Button 
        variant="destructive" 
        onClick={handleClick}
        className="bg-danger text-danger-foreground hover:bg-danger/90"
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        Retry
      </Button>
    );
  }

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-success text-success-foreground">
              Connected
            </Badge>
            <span className="text-sm font-mono text-foreground">
              {formatAddress(publicKey)}
            </span>
          </div>
          {balance && (
            <div className="text-xs text-muted-foreground">
              {balance} XLM
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleClick}
          className="text-danger hover:bg-danger hover:text-danger-foreground"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleClick}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
};
