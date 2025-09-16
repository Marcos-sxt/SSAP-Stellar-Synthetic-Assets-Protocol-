import { StellarSDK } from '@stellar/stellar-sdk';

export interface ContractConfig {
  contractId: string;
  network: string;
  rpcUrl: string;
}

export interface PositionData {
  id: string;
  user: string;
  asset: string;
  size: number;
  leverage: number;
  collateral: number;
  isLong: boolean;
  entryPrice: number;
  timestamp: number;
}

export class StellarContractService {
  private contractId: string;
  private network: string;
  private rpcUrl: string;
  private server: any;

  constructor(config: ContractConfig) {
    this.contractId = config.contractId;
    this.network = config.network;
    this.rpcUrl = config.rpcUrl;
    
    // Initialize Stellar server
    this.server = new StellarSDK.Server(this.rpcUrl);
  }

  /**
   * Open a position on the smart contract
   */
  async openPosition(
    userPublicKey: string,
    asset: string,
    size: number,
    leverage: number,
    isLong: boolean,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log('🔗 Opening position on contract:', {
        contractId: this.contractId,
        user: userPublicKey,
        asset,
        size,
        leverage,
        isLong
      });

      // Get user account
      const account = await this.server.loadAccount(userPublicKey);
      
      // Create transaction
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: this.network === 'TESTNET' 
          ? StellarSDK.Networks.TESTNET 
          : StellarSDK.Networks.PUBLIC,
      })
      .addOperation(
        StellarSDK.Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'open_position',
          args: [
            StellarSDK.xdr.ScVal.scvString(asset),
            StellarSDK.xdr.ScVal.scvI128(StellarSDK.xdr.Int128Parts.fromString(size.toString())),
            StellarSDK.xdr.ScVal.scvU32(leverage),
            StellarSDK.xdr.ScVal.scvBool(isLong),
          ],
        })
      )
      .setTimeout(30)
      .build();

      // Sign transaction
      const signedXdr = await signTransaction(transaction.toXDR());
      
      // Submit transaction
      const result = await this.server.submitTransaction(
        StellarSDK.TransactionBuilder.fromXDR(signedXdr, this.network === 'TESTNET' 
          ? StellarSDK.Networks.TESTNET 
          : StellarSDK.Networks.PUBLIC)
      );

      console.log('✅ Position opened successfully:', result.hash);
      
      return {
        success: true,
        transactionHash: result.hash
      };

    } catch (error) {
      console.error('❌ Error opening position:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Close a position on the smart contract
   */
  async closePosition(
    userPublicKey: string,
    positionId: string,
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log('🔗 Closing position on contract:', {
        contractId: this.contractId,
        user: userPublicKey,
        positionId
      });

      // Get user account
      const account = await this.server.loadAccount(userPublicKey);
      
      // Create transaction
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: this.network === 'TESTNET' 
          ? StellarSDK.Networks.TESTNET 
          : StellarSDK.Networks.PUBLIC,
      })
      .addOperation(
        StellarSDK.Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'close_position',
          args: [
            StellarSDK.xdr.ScVal.scvString(positionId),
          ],
        })
      )
      .setTimeout(30)
      .build();

      // Sign transaction
      const signedXdr = await signTransaction(transaction.toXDR());
      
      // Submit transaction
      const result = await this.server.submitTransaction(
        StellarSDK.TransactionBuilder.fromXDR(signedXdr, this.network === 'TESTNET' 
          ? StellarSDK.Networks.TESTNET 
          : StellarSDK.Networks.PUBLIC)
      );

      console.log('✅ Position closed successfully:', result.hash);
      
      return {
        success: true,
        transactionHash: result.hash
      };

    } catch (error) {
      console.error('❌ Error closing position:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user positions from the smart contract
   */
  async getUserPositions(userPublicKey: string): Promise<PositionData[]> {
    try {
      console.log('🔗 Getting user positions from contract:', {
        contractId: this.contractId,
        user: userPublicKey
      });

      // Create read-only transaction
      const transaction = new StellarSDK.TransactionBuilder(
        new StellarSDK.Account(userPublicKey, '0'),
        {
          fee: StellarSDK.BASE_FEE,
          networkPassphrase: this.network === 'TESTNET' 
            ? StellarSDK.Networks.TESTNET 
            : StellarSDK.Networks.PUBLIC,
        }
      )
      .addOperation(
        StellarSDK.Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'get_user_positions',
          args: [
            StellarSDK.xdr.ScVal.scvString(userPublicKey),
          ],
        })
      )
      .setTimeout(30)
      .build();

      // Simulate transaction to get data
      const result = await this.server.simulateTransaction(transaction);
      
      // Parse the result (this would need to be implemented based on the actual contract response)
      console.log('📊 User positions result:', result);
      
      // For now, return empty array - this would need to be parsed from the actual contract response
      return [];

    } catch (error) {
      console.error('❌ Error getting user positions:', error);
      return [];
    }
  }

  /**
   * Get asset price from the smart contract
   */
  async getAssetPrice(asset: string): Promise<number> {
    try {
      console.log('🔗 Getting asset price from contract:', {
        contractId: this.contractId,
        asset
      });

      // Create read-only transaction
      const transaction = new StellarSDK.TransactionBuilder(
        new StellarSDK.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
        {
          fee: StellarSDK.BASE_FEE,
          networkPassphrase: this.network === 'TESTNET' 
            ? StellarSDK.Networks.TESTNET 
            : StellarSDK.Networks.PUBLIC,
        }
      )
      .addOperation(
        StellarSDK.Operation.invokeContractFunction({
          contract: this.contractId,
          function: 'get_asset_price',
          args: [
            StellarSDK.xdr.ScVal.scvString(asset),
          ],
        })
      )
      .setTimeout(30)
      .build();

      // Simulate transaction to get data
      const result = await this.server.simulateTransaction(transaction);
      
      // Parse the result (this would need to be implemented based on the actual contract response)
      console.log('💰 Asset price result:', result);
      
      // For now, return 0 - this would need to be parsed from the actual contract response
      return 0;

    } catch (error) {
      console.error('❌ Error getting asset price:', error);
      return 0;
    }
  }
}

// Contract configuration
export const CONTRACT_CONFIG: ContractConfig = {
  contractId: 'CBTUI3R6FK5C4P6AXC2QN6IDHVILTT4KNK26CW6AZLJ3SGSOEMSKIQFR',
  network: 'TESTNET',
  rpcUrl: 'https://soroban-testnet.stellar.org'
};

// Export singleton instance
export const contractService = new StellarContractService(CONTRACT_CONFIG);
