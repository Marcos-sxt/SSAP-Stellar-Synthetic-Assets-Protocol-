import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  isConnected, 
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress, 
  getNetwork,
  signTransaction
} from '@stellar/freighter-api';

// Debug: Log the imported functions
console.log('🔍 Freighter API imports:', {
  isConnected: typeof isConnected,
  isAllowed: typeof isAllowed,
  setAllowed: typeof setAllowed,
  requestAccess: typeof requestAccess,
  getAddress: typeof getAddress,
  getNetwork: typeof getNetwork,
  signTransaction: typeof signTransaction,
});

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  network: string | null;
  networkPassphrase: string | null;
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signTransaction: (transactionXdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    network: null,
    networkPassphrase: null,
    balance: null,
    isLoading: false,
    error: null,
  });

  // Check if Freighter is available
  const isFreighterAvailable = () => {
    console.log('🔍 Checking Freighter availability...');
    console.log('🔍 window exists:', typeof window !== 'undefined');
    console.log('🔍 window.freighter exists:', typeof window !== 'undefined' && (window as any).freighter);
    console.log('🔍 window.freighterApi exists:', typeof window !== 'undefined' && (window as any).freighterApi);
    console.log('🔍 window.stellarFreighterApi exists:', typeof window !== 'undefined' && (window as any).stellarFreighterApi);
    
    if (typeof window !== 'undefined') {
      console.log('🔍 All window properties:', Object.keys(window).filter(key => key.toLowerCase().includes('freighter')));
      console.log('🔍 All window properties:', Object.keys(window).filter(key => key.toLowerCase().includes('stellar')));
    }
    
    // Try to use the imported functions directly instead of checking window
    try {
      console.log('🔍 Testing isConnected function:', typeof isConnected);
      return typeof isConnected === 'function';
    } catch (error) {
      console.error('❌ Error testing Freighter functions:', error);
      return false;
    }
  };

  // Connect to Freighter wallet
  const connect = async () => {
    console.log('🔌 Starting Freighter connection...');
    
    if (!isFreighterAvailable()) {
      console.error('❌ Freighter not available');
      setState(prev => ({ ...prev, error: 'Freighter wallet not found. Please install Freighter extension.' }));
      return;
    }

    console.log('✅ Freighter is available');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if Freighter is connected
      console.log('🔍 Checking if Freighter is connected...');
      const connectedResult = await isConnected();
      console.log('🔍 isConnected result:', connectedResult);
      
      if (!connectedResult.isConnected) {
        console.error('❌ Freighter is not connected');
        setState(prev => ({ ...prev, error: 'Freighter is not connected. Please open Freighter extension.' }));
        return;
      }

      console.log('✅ Freighter is connected');

      // Check if app is allowed
      console.log('🔍 Checking if app is allowed...');
      const allowedResult = await isAllowed();
      console.log('🔍 isAllowed result:', allowedResult);
      
      if (!allowedResult.isAllowed) {
        console.log('⚠️ App not allowed, requesting access...');
        // Request access if not allowed
        const accessResult = await setAllowed();
        console.log('🔍 setAllowed result:', accessResult);
        
        if (!accessResult.isAllowed) {
          console.error('❌ User denied access to Freighter');
          setState(prev => ({ ...prev, error: 'User denied access to Freighter.' }));
          return;
        }
        console.log('✅ App access granted');
      } else {
        console.log('✅ App is already allowed');
      }

      // Get address
      console.log('🔍 Getting address...');
      const addressResult = await requestAccess();
      console.log('🔍 requestAccess result:', addressResult);
      
      if (addressResult.error) {
        console.error('❌ Error getting address:', addressResult.error);
        setState(prev => ({ ...prev, error: addressResult.error }));
        return;
      }

      console.log('✅ Address obtained:', addressResult.address);

      // Get network details
      console.log('🔍 Getting network details...');
      const networkResult = await getNetwork();
      console.log('🔍 getNetwork result:', networkResult);
      
      if (networkResult.error) {
        console.error('❌ Error getting network:', networkResult.error);
        setState(prev => ({ ...prev, error: networkResult.error }));
        return;
      }

      console.log('✅ Network details obtained:', networkResult.network, networkResult.networkPassphrase);

      setState(prev => ({
        ...prev,
        isConnected: true,
        publicKey: addressResult.address,
        network: networkResult.network,
        networkPassphrase: networkResult.networkPassphrase,
        isLoading: false,
        error: null,
      }));

      console.log('✅ Wallet state updated successfully');

      // Refresh balance after connecting
      console.log('🔍 Refreshing balance...');
      await refreshBalance();

    } catch (error) {
      console.error('❌ Error connecting to Freighter:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to wallet',
      }));
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setState({
      isConnected: false,
      publicKey: null,
      network: null,
      networkPassphrase: null,
      balance: null,
      isLoading: false,
      error: null,
    });
  };

  // Refresh XLM balance
  const refreshBalance = async () => {
    console.log('💰 Refreshing balance...');
    console.log('💰 Public key:', state.publicKey);
    console.log('💰 Network:', state.network);
    
    if (!state.publicKey || !state.network) {
      console.warn('⚠️ Missing public key or network for balance fetch');
      return;
    }

    try {
      // Determine Horizon URL based on network
      let horizonUrl = '';
      if (state.network === 'TESTNET') {
        horizonUrl = 'https://horizon-testnet.stellar.org';
      } else if (state.network === 'PUBLIC') {
        horizonUrl = 'https://horizon.stellar.org';
      } else {
        console.warn(`Unsupported network for balance fetch: ${state.network}`);
        setState(prev => ({ ...prev, error: `Unsupported network: ${state.network}` }));
        return;
      }

      console.log('💰 Fetching from Horizon URL:', horizonUrl);
      const response = await fetch(`${horizonUrl}/accounts/${state.publicKey}`);
      console.log('💰 Horizon response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch account balance');
      }

      const account = await response.json();
      console.log('💰 Account data:', account);
      
      const xlmBalance = account.balances.find((balance: any) => balance.asset_type === 'native');
      console.log('💰 XLM Balance found:', xlmBalance);
      
      const balance = xlmBalance ? parseFloat(xlmBalance.balance).toFixed(7) : '0.0000000';
      console.log('💰 Final balance:', balance);
      
      setState(prev => ({
        ...prev,
        balance: balance,
      }));

      console.log('✅ Balance updated successfully');

    } catch (error) {
      console.error('❌ Error fetching balance:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch balance',
      }));
    }
  };

  // Sign transaction
  const signTransactionXdr = async (transactionXdr: string): Promise<string> => {
    if (!isFreighterAvailable()) {
      throw new Error('Freighter wallet not available');
    }

    try {
      const signedResult = await signTransaction(transactionXdr, {
        networkPassphrase: state.networkPassphrase || 'Test SDF Network ; September 2015',
        address: state.publicKey || '',
      });

      if (signedResult.error) {
        throw new Error(signedResult.error);
      }

      return signedResult.signedTxXdr;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw new Error('Failed to sign transaction');
    }
  };

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      console.log('🔄 Checking initial connection status...');
      
      if (!isFreighterAvailable()) {
        console.log('❌ Freighter not available on mount');
        return;
      }

      console.log('✅ Freighter available on mount');

      try {
        // Check if connected
        console.log('🔍 Checking if connected on mount...');
        const connectedResult = await isConnected();
        console.log('🔍 isConnected on mount result:', connectedResult);
        
        if (!connectedResult.isConnected) {
          console.log('❌ Not connected on mount');
          return;
        }

        console.log('✅ Connected on mount');

        // Check if allowed
        console.log('🔍 Checking if allowed on mount...');
        const allowedResult = await isAllowed();
        console.log('🔍 isAllowed on mount result:', allowedResult);
        
        if (!allowedResult.isAllowed) {
          console.log('❌ Not allowed on mount');
          return;
        }

        console.log('✅ Allowed on mount');

        // Get address
        console.log('🔍 Getting address on mount...');
        const addressResult = await getAddress();
        console.log('🔍 getAddress on mount result:', addressResult);
        
        if (addressResult.error) {
          console.error('❌ Error getting address on mount:', addressResult.error);
          return;
        }

        console.log('✅ Address obtained on mount:', addressResult.address);

        // Get network
        console.log('🔍 Getting network on mount...');
        const networkResult = await getNetwork();
        console.log('🔍 getNetwork on mount result:', networkResult);
        
        if (networkResult.error) {
          console.error('❌ Error getting network on mount:', networkResult.error);
          return;
        }

        console.log('✅ Network obtained on mount:', networkResult.network);

        setState(prev => ({
          ...prev,
          isConnected: true,
          publicKey: addressResult.address,
          network: networkResult.network,
          networkPassphrase: networkResult.networkPassphrase,
        }));

        console.log('✅ State updated on mount');

        // Refresh balance
        console.log('🔍 Refreshing balance on mount...');
        await refreshBalance();

      } catch (error) {
        console.error('❌ Error checking connection on mount:', error);
      }
    };

    checkConnection();
  }, []);

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    signTransaction: signTransactionXdr,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};