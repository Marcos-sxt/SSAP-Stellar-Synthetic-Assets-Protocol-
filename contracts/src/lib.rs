#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Symbol, Vec,
    log,
};

#[cfg(test)]
mod test;

#[derive(Clone)]
#[contracttype]
pub struct Position {
    pub owner: Address,
    pub asset: Symbol,
    pub is_long: bool,
    pub size: i128,           // Position size in XLM
    pub collateral: i128,     // Collateral amount
    pub entry_price: i128,    // Entry price (scaled by 1e7)
    pub leverage: u32,        // Leverage (1-5)
    pub margin_ratio: i128,   // Current margin ratio
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct PriceData {
    pub price: i128,          // Price scaled by 1e7
    pub timestamp: u64,
}

// Phase 2: Exclusive Markets
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum ExclusiveMarket {
    WTI,
    Brent,
    RBOB,
    HeatOil,
    NatGas,
    Gold,
    Silver,
    Copper,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct ExclusiveDerivative {
    pub market: ExclusiveMarket,
    pub exchange: Symbol,  // "CME", "ICE", "NYMEX"
    pub oracle_feed: Address,
    pub tick_size: i128,        // $0.01 per barrel = 10
    pub contract_size: i128,    // 1000 barrels
    pub min_margin_ratio: i128, // 5% = 500 basis points
    pub settlement_type: Symbol, // "cash" or "physical"
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct SpreadPosition {
    pub id: u64,
    pub trader: Address,
    pub leg1_market: ExclusiveMarket,
    pub leg2_market: ExclusiveMarket,
    pub leg1_size: i128,  // positive for long, negative for short
    pub leg2_size: i128,
    pub entry_spread: i128,
    pub margin: i128,
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Oracle,
    Position(u64),            // Position ID
    PositionCounter,
    Price(Symbol),            // Asset price
    MaintenanceMargin,        // 20% = 2000 (basis points)
    MaxLeverage,             // 5
    ProtocolFee,             // 0.1% = 10 (basis points)
    
    // Phase 2: Exclusive Markets
    ExclusiveConfig(ExclusiveMarket),
    ExclusivePrice(ExclusiveMarket),
    SpreadPosition(u64),
    SpreadPositionCounter,
    MarketOracle(ExclusiveMarket),
}

#[contract]
pub struct SAPP;

#[contractimpl]
impl SAPP {
    /// Initialize the contract
    pub fn initialize(
        env: Env,
        admin: Address,
        oracle: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Oracle, &oracle);
        env.storage().instance().set(&DataKey::PositionCounter, &0u64);
        env.storage().instance().set(&DataKey::MaintenanceMargin, &2000i128); // 20%
        env.storage().instance().set(&DataKey::MaxLeverage, &5u32);
        env.storage().instance().set(&DataKey::ProtocolFee, &10i128); // 0.1%
    }

    /// Open a new position
    pub fn open_position(
        env: Env,
        owner: Address,
        asset: Symbol,
        is_long: bool,
        size: i128,
        collateral: i128,
        leverage: u32,
    ) -> u64 {
        owner.require_auth();
        
        // Validate inputs
        if leverage < 1 || leverage > Self::get_max_leverage(&env) {
            panic!("Invalid leverage");
        }
        
        if size <= 0 || collateral <= 0 {
            panic!("Invalid size or collateral");
        }
        
        // Check leverage constraints
        let required_collateral = size / leverage as i128;
        if collateral < required_collateral {
            panic!("Insufficient collateral for leverage");
        }
        
        // Transfer XLM collateral from user to contract
        Self::transfer_xlm_from_user(&env, &owner, collateral);
        
        // Get current price
        let price = Self::get_price(&env, &asset);
        
        // Create position
        let position_id = Self::get_and_increment_position_counter(&env);
        let position = Position {
            owner: owner.clone(),
            asset: asset.clone(),
            is_long,
            size,
            collateral,
            entry_price: price,
            leverage,
            margin_ratio: 10000, // 100% initially
            timestamp: env.ledger().timestamp(),
        };
        
        env.storage().persistent().set(&DataKey::Position(position_id), &position);
        
        log!(&env, "Position opened: ID={}, Asset={}, Size={}, Leverage={}", 
             position_id, asset, size, leverage);
        
        position_id
    }

    /// Close a position
    pub fn close_position(env: Env, position_id: u64) {
        let position = Self::get_position(&env, position_id);
        position.owner.require_auth();
        
        let current_price = Self::get_price(&env, &position.asset);
        let (pnl, remaining_collateral) = Self::calculate_pnl(&position, current_price);
        
        // Remove position
        env.storage().persistent().remove(&DataKey::Position(position_id));
        
        // Return remaining collateral to user (XLM)
        if remaining_collateral > 0 {
            Self::transfer_xlm_to_user(&env, &position.owner, remaining_collateral);
        }
        
        log!(&env, "Position closed: ID={}, PnL={}, Returned={}", 
             position_id, pnl, remaining_collateral);
    }

    /// Liquidate a position if below maintenance margin
    pub fn liquidate_position(env: Env, position_id: u64) {
        let position = Self::get_position(&env, position_id);
        let current_price = Self::get_price(&env, &position.asset);
        
        // Calculate margin ratio
        let margin_ratio = Self::calculate_margin_ratio(&position, current_price);
        let maintenance_margin = Self::get_maintenance_margin(&env);
        
        if margin_ratio >= maintenance_margin {
            panic!("Position not liquidatable");
        }
        
        // Calculate liquidation penalty (5%)
        let liquidation_penalty = position.collateral * 5 / 100;
        let (_pnl, mut remaining_collateral) = Self::calculate_pnl(&position, current_price);
        
        // Apply liquidation penalty
        remaining_collateral = remaining_collateral.saturating_sub(liquidation_penalty);
        
        // Remove position
        env.storage().persistent().remove(&DataKey::Position(position_id));
        
        // Return remaining collateral (if any) to user (XLM)
        if remaining_collateral > 0 {
            Self::transfer_xlm_to_user(&env, &position.owner, remaining_collateral);
        }
        
        log!(&env, "Position liquidated: ID={}, MarginRatio={}, Penalty={}", 
             position_id, margin_ratio, liquidation_penalty);
    }

    /// Update price (only oracle can call)
    pub fn update_price(env: Env, asset: Symbol, price: i128) {
        // Only admin can update prices (for testing)
        let admin = Self::get_admin(env.clone());
        admin.require_auth();
        
        if price <= 0 {
            panic!("Invalid price");
        }
        
        let price_data = PriceData {
            price,
            timestamp: env.ledger().timestamp(),
        };
        
        env.storage().persistent().set(&DataKey::Price(asset.clone()), &price_data);
        
        log!(&env, "Price updated: Asset={}, Price={}", asset, price);
    }

    /// Get position details
    pub fn get_position_info(env: Env, position_id: u64) -> Position {
        Self::get_position(&env, position_id)
    }

    /// Check if position is at risk
    pub fn is_position_at_risk(env: Env, position_id: u64) -> bool {
        let position = Self::get_position(&env, position_id);
        let current_price = Self::get_price(&env, &position.asset);
        let margin_ratio = Self::calculate_margin_ratio(&position, current_price);
        let maintenance_margin = Self::get_maintenance_margin(&env);
        
        margin_ratio < maintenance_margin * 150 / 100 // 1.5x maintenance margin
    }

    /// Get current price for an asset
    pub fn get_asset_price(env: Env, asset: Symbol) -> i128 {
        Self::get_price(&env, &asset)
    }

    /// Get all active positions
    pub fn get_active_positions(env: Env) -> Vec<Position> {
        let mut positions = Vec::new(&env);
        let mut i = 0u64;
        
        loop {
            let position_key = DataKey::Position(i);
            if let Some(position) = env.storage().persistent().get::<DataKey, Position>(&position_key) {
                positions.push_back(position);
                i += 1;
            } else {
                break;
            }
        }
        
        positions
    }

    /// Get positions for a specific user
    pub fn get_user_positions(env: Env, user: Address) -> Vec<Position> {
        let mut user_positions = Vec::new(&env);
        let mut i = 0u64;
        
        loop {
            let position_key = DataKey::Position(i);
            if let Some(position) = env.storage().persistent().get::<DataKey, Position>(&position_key) {
                if position.owner == user {
                    user_positions.push_back(position);
                }
                i += 1;
            } else {
                break;
            }
        }
        
        user_positions
    }

    // Helper functions
    fn get_position(env: &Env, position_id: u64) -> Position {
        env.storage()
            .persistent()
            .get(&DataKey::Position(position_id))
            .unwrap_or_else(|| panic!("Position not found"))
    }

    fn get_price(env: &Env, asset: &Symbol) -> i128 {
        let price_data: PriceData = env.storage()
            .persistent()
            .get(&DataKey::Price(asset.clone()))
            .unwrap_or_else(|| panic!("Price not found"));
        
        // Check if price is stale (> 5 minutes)
        let current_time = env.ledger().timestamp();
        if current_time - price_data.timestamp > 300 {
            panic!("Price is stale");
        }
        
        price_data.price
    }

    fn calculate_pnl(position: &Position, current_price: i128) -> (i128, i128) {
        let price_diff = if position.is_long {
            current_price - position.entry_price
        } else {
            position.entry_price - current_price
        };
        
        let pnl = (price_diff * position.size) / position.entry_price;
        let remaining_collateral = position.collateral + pnl;
        
        (pnl, remaining_collateral.max(0))
    }

    fn calculate_margin_ratio(position: &Position, current_price: i128) -> i128 {
        let (pnl, remaining_collateral) = Self::calculate_pnl(position, current_price);
        let position_value = position.size * current_price / position.entry_price;
        
        if position_value == 0 {
            return 0;
        }
        
        (remaining_collateral * 10000) / position_value
    }

    fn get_and_increment_position_counter(env: &Env) -> u64 {
        let current = env.storage().instance().get(&DataKey::PositionCounter).unwrap_or(0u64);
        let new_id = current + 1;
        env.storage().instance().set(&DataKey::PositionCounter, &new_id);
        current
    }


    fn get_oracle(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Oracle).unwrap()
    }

    fn get_max_leverage(env: &Env) -> u32 {
        env.storage().instance().get(&DataKey::MaxLeverage).unwrap_or(5u32)
    }

    fn get_maintenance_margin(env: &Env) -> i128 {
        env.storage().instance().get(&DataKey::MaintenanceMargin).unwrap_or(2000i128)
    }

    fn require_admin(env: &Env, caller: &Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller != &admin {
            panic!("Not authorized");
        }
    }

    // Phase 2: Exclusive Markets Functions

    /// Register an exclusive market (admin only)
    pub fn register_exclusive_market(
        env: Env,
        market: ExclusiveMarket,
        exchange: Symbol,
        oracle_feed: Address,
        tick_size: i128,
        contract_size: i128,
        min_margin_ratio: i128,
        settlement_type: Symbol,
    ) {
        // Admin authorization
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        // Create market config
        let config = ExclusiveDerivative {
            market: market.clone(),
            exchange,
            oracle_feed: oracle_feed.clone(),
            tick_size,
            contract_size,
            min_margin_ratio,
            settlement_type,
        };
        
        // Store config and oracle
        env.storage().persistent().set(&DataKey::ExclusiveConfig(market.clone()), &config);
        env.storage().persistent().set(&DataKey::MarketOracle(market), &oracle_feed);
        
        // Set TTL for config data
        env.storage().persistent().extend_ttl(
            &DataKey::ExclusiveConfig(market.clone()),
            100_000,
            1_000_000
        );
    }

    /// Get spread price between two markets
    pub fn get_spread_price(env: Env, market1: ExclusiveMarket, market2: ExclusiveMarket) -> i128 {
        // Get individual market prices with explicit type annotations
        let price1: i128 = env.storage().temporary()
            .get(&DataKey::ExclusivePrice(market1))
            .unwrap_or_else(|| panic!("Price not available for market1"));
        
        let price2: i128 = env.storage().temporary()
            .get(&DataKey::ExclusivePrice(market2))
            .unwrap_or_else(|| panic!("Price not available for market2"));
        
        // Return spread (market1 - market2)
        price1 - price2
    }

    /// Open a spread position (e.g., WTI-Brent)
    pub fn open_spread_position(
        env: Env,
        trader: Address,
        leg1_market: ExclusiveMarket,
        leg2_market: ExclusiveMarket,
        leg1_size: i128,
        leg2_size: i128,
        margin: i128,
    ) -> u64 {
        // Authenticate trader
        trader.require_auth();
        
        // Validate markets exist
        let config1 = Self::validate_exclusive_market(&env, &leg1_market);
        let config2 = Self::validate_exclusive_market(&env, &leg2_market);
        
        // Validate spread position (WTI-Brent must be balanced)
        if leg1_market == ExclusiveMarket::WTI && leg2_market == ExclusiveMarket::Brent {
            if leg1_size + leg2_size != 0 {
                panic!("WTI-Brent spread must be balanced (leg1_size + leg2_size = 0)");
            }
        }
        
        // Calculate minimum margin requirement
        let margin_req1 = (leg1_size.abs() * config1.contract_size * config1.min_margin_ratio) / 10000;
        let margin_req2 = (leg2_size.abs() * config2.contract_size * config2.min_margin_ratio) / 10000;
        let total_margin_req = margin_req1 + margin_req2;
        
        if margin < total_margin_req {
            panic!("Insufficient margin. Required: {}", total_margin_req);
        }
        
        // Transfer margin from trader (XLM)
        Self::transfer_xlm_from_user(&env, &trader, margin);
        
        // Get current spread price
        let entry_spread = Self::get_spread_price(env.clone(), leg1_market.clone(), leg2_market.clone());
        
        // Create position
        let position_id = env.storage().persistent()
            .get(&DataKey::SpreadPositionCounter)
            .unwrap_or(0) + 1;
        
        let position = SpreadPosition {
            id: position_id,
            trader: trader.clone(),
            leg1_market,
            leg2_market,
            leg1_size,
            leg2_size,
            entry_spread,
            margin,
            timestamp: env.ledger().timestamp(),
        };
        
        // Store position
        env.storage().persistent().set(&DataKey::SpreadPosition(position_id), &position);
        env.storage().persistent().set(&DataKey::SpreadPositionCounter, &position_id);
        
        position_id
    }

    /// Close a spread position
    pub fn close_spread_position(env: Env, position_id: u64) -> i128 {
        // Get position
        let position: SpreadPosition = env.storage().persistent()
            .get(&DataKey::SpreadPosition(position_id))
            .unwrap_or_else(|| panic!("Position not found"));
        
        // Authenticate trader
        position.trader.require_auth();
        
        // Get current spread price
        let exit_spread = Self::get_spread_price(
            env.clone(), 
            position.leg1_market.clone(), 
            position.leg2_market.clone()
        );
        
        // Calculate P&L
        let spread_diff = exit_spread - position.entry_spread;
        let pnl = spread_diff * position.leg1_size; // Assuming leg1 is the primary leg
        
        // Calculate final amount (margin + pnl)
        let final_amount = position.margin + pnl;
        
        if final_amount > 0 {
            // Return funds to trader (XLM)
            Self::transfer_xlm_to_user(&env, &position.trader, final_amount);
        }
        
        // Remove position
        env.storage().persistent().remove(&DataKey::SpreadPosition(position_id));
        
        pnl
    }

    /// Update exclusive market price (oracle only)
    pub fn update_exclusive_price(env: Env, market: ExclusiveMarket, price: i128) {
        // Get oracle address for this market
        let _oracle: Address = env.storage().persistent()
            .get(&DataKey::MarketOracle(market.clone()))
            .unwrap();
        
        // Only admin can update prices (for testing)
        let admin = Self::get_admin(env.clone());
        admin.require_auth();
        
        // Store price in temporary storage (expires automatically)
        env.storage().temporary().set(&DataKey::ExclusivePrice(market.clone()), &price);
        
        // Set reasonable TTL (e.g., 1 hour)
        env.storage().temporary().extend_ttl(
            &DataKey::ExclusivePrice(market),
            3600,  // 1 hour
            7200   // 2 hours max
        );
    }

    // Helper function for market validation
    fn validate_exclusive_market(env: &Env, market: &ExclusiveMarket) -> ExclusiveDerivative {
        env.storage().persistent()
            .get(&DataKey::ExclusiveConfig(market.clone()))
            .unwrap_or_else(|| panic!("Market not registered"))
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_spread_position(env: Env, position_id: u64) -> SpreadPosition {
        env.storage().persistent()
            .get(&DataKey::SpreadPosition(position_id))
            .unwrap_or_else(|| panic!("Spread position not found"))
    }

    // Helper function to transfer XLM from user to contract
    fn transfer_xlm_from_user(env: &Env, from: &Address, amount: i128) {
        // For now, we'll log the transfer instead of actually transferring
        // In production, this should use the actual native asset contract
        log!(env, "Transferring {} XLM from {} to contract", amount, from);
        
        // TODO: Implement actual XLM transfer using native asset contract
        // This requires the correct native asset contract address
    }

    // Helper function to transfer XLM from contract to user
    fn transfer_xlm_to_user(env: &Env, to: &Address, amount: i128) {
        // For now, we'll log the transfer instead of actually transferring
        // In production, this should use the actual native asset contract
        log!(env, "Transferring {} XLM from contract to {}", amount, to);
        
        // TODO: Implement actual XLM transfer using native asset contract
        // This requires the correct native asset contract address
    }
}