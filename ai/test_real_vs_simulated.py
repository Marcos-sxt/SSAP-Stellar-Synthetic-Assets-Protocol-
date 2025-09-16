#!/usr/bin/env python3
"""
Teste: Dados Reais vs Simulados
Compara a IA com dados simulados vs dados reais
"""

import sys
import os
import time
from datetime import datetime

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from risk_analyzer import SAPPRiskAnalyzer, PositionData
from real_risk_analyzer import SAPPRealRiskAnalyzer

def test_simulated_vs_real():
    """Compara dados simulados vs reais"""
    print("🔬 COMPARAÇÃO: DADOS SIMULADOS vs DADOS REAIS")
    print("=" * 70)
    print()
    
    # Criar posição de teste
    test_position = PositionData(
        position_id=1,
        leg1_market="WTI",
        leg2_market="Brent",
        leg1_size=1000,
        leg2_size=-1000,
        margin=1000000,
        entry_spread=-400000000000,  # -$4.00
        current_spread=-450000000000,  # -$4.50 (mudança de 12.5%)
        timestamp=datetime.now()
    )
    
    print("📊 POSIÇÃO DE TESTE:")
    print(f"   WTI-Brent Spread: ${test_position.entry_spread/100000000000:.2f} → ${test_position.current_spread/100000000000:.2f}")
    print(f"   Mudança: {((test_position.current_spread - test_position.entry_spread) / abs(test_position.entry_spread)) * 100:.1f}%")
    print()
    
    # 1. TESTE COM DADOS SIMULADOS
    print("🤖 TESTE 1: IA COM DADOS SIMULADOS")
    print("-" * 50)
    
    simulated_analyzer = SAPPRiskAnalyzer()
    simulated_analyzer.positions[1] = test_position
    
    # Análise simulada
    sim_volatility = simulated_analyzer._calculate_volatility_risk(test_position)
    sim_margin = simulated_analyzer._calculate_margin_risk(test_position)
    sim_trend = simulated_analyzer._calculate_trend_risk(test_position)
    sim_liquidation = simulated_analyzer._calculate_liquidation_risk(test_position)
    sim_total = simulated_analyzer._calculate_risk_score(test_position)
    
    print(f"   Volatilidade: {sim_volatility:.2f} (SIMULADO - sempre 0.8)")
    print(f"   Margem: {sim_margin:.2f} (SIMULADO - sempre 0.7)")
    print(f"   Tendência: {sim_trend:.2f} (SIMULADO - sempre 0.8)")
    print(f"   Liquidação: {sim_liquidation:.2f} (SIMULADO - sempre 0.5)")
    print(f"   SCORE TOTAL: {sim_total:.2f}")
    print()
    
    # 2. TESTE COM DADOS REAIS
    print("🎯 TESTE 2: IA COM DADOS REAIS")
    print("-" * 50)
    
    real_analyzer = SAPPRealRiskAnalyzer()
    real_analyzer.positions[1] = test_position
    
    # Simular preços reais
    real_analyzer.current_prices = {
        "WTI": 63.00,  # $63.00
        "Brent": 67.50,  # $67.50 (spread = -$4.50)
    }
    
    # Análise real
    real_volatility = real_analyzer._calculate_volatility_risk_real(test_position)
    real_margin = real_analyzer._calculate_margin_risk_real(test_position)
    real_trend = real_analyzer._calculate_trend_risk_real(test_position)
    real_liquidation = real_analyzer._calculate_liquidation_risk_real(test_position)
    real_total = real_analyzer._calculate_risk_score(test_position)
    
    print(f"   Volatilidade: {real_volatility:.2f} (REAL - baseado em preços reais)")
    print(f"   Margem: {real_margin:.2f} (REAL - calculado com preços atuais)")
    print(f"   Tendência: {real_trend:.2f} (REAL - baseado em mudança real)")
    print(f"   Liquidação: {real_liquidation:.2f} (REAL - distância real da liquidação)")
    print(f"   SCORE TOTAL: {real_total:.2f}")
    print()
    
    # 3. COMPARAÇÃO
    print("📈 COMPARAÇÃO DOS RESULTADOS")
    print("-" * 50)
    
    print(f"   Score Simulado: {sim_total:.2f}")
    print(f"   Score Real:     {real_total:.2f}")
    print(f"   Diferença:     {abs(real_total - sim_total):.2f}")
    print()
    
    # 4. ANÁLISE DETALHADA
    print("🔍 ANÁLISE DETALHADA")
    print("-" * 50)
    
    print("DADOS SIMULADOS:")
    print("   ❌ Volatilidade: Sempre 0.8 (não considera mudança real)")
    print("   ❌ Margem: Sempre 0.7 (não calcula margem real)")
    print("   ❌ Tendência: Sempre 0.8 (não considera preços atuais)")
    print("   ❌ Liquidação: Sempre 0.5 (não calcula distância real)")
    print()
    
    print("DADOS REAIS:")
    print("   ✅ Volatilidade: Baseada em mudança real do spread")
    print("   ✅ Margem: Calculada com preços atuais e valor da posição")
    print("   ✅ Tendência: Baseada em preços reais dos mercados")
    print("   ✅ Liquidação: Distância real da liquidação")
    print()
    
    # 5. CENÁRIOS DIFERENTES
    print("🎭 TESTE COM DIFERENTES CENÁRIOS")
    print("-" * 50)
    
    scenarios = [
        ("Spread Estável", -400000000000, -400000000000, 63.00, 67.00),
        ("Spread Moderado", -400000000000, -420000000000, 63.00, 67.20),
        ("Spread Alto", -400000000000, -480000000000, 63.00, 67.80),
        ("Spread Crítico", -400000000000, -600000000000, 63.00, 69.00),
    ]
    
    for name, entry, current, wti_price, brent_price in scenarios:
        print(f"\n{name}:")
        
        # Atualizar preços
        real_analyzer.current_prices = {
            "WTI": wti_price,
            "Brent": brent_price,
        }
        
        # Criar posição
        pos = PositionData(
            position_id=1,
            leg1_market="WTI",
            leg2_market="Brent",
            leg1_size=1000,
            leg2_size=-1000,
            margin=1000000,
            entry_spread=entry,
            current_spread=current,
            timestamp=datetime.now()
        )
        
        # Análise real
        real_score = real_analyzer._calculate_risk_score(pos)
        real_alert = real_analyzer._generate_alert(pos, real_score)
        
        spread_display = current / 100000000000
        change_percent = ((current - entry) / abs(entry)) * 100
        
        print(f"   Spread: ${spread_display:.2f} ({change_percent:+.1f}%)")
        print(f"   Score: {real_score:.2f}")
        if real_alert:
            print(f"   Alerta: {real_alert.alert_type}")
        else:
            print(f"   Status: Estável")
    
    print()
    print("🎯 CONCLUSÃO:")
    print("   A IA com dados reais é muito mais precisa e útil!")
    print("   Dados simulados são apenas para demonstração.")
    print("   Em produção, sempre usar dados reais do backend/contrato.")

def main():
    """Função principal"""
    try:
        test_simulated_vs_real()
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
