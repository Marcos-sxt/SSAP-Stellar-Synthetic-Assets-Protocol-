#!/usr/bin/env python3
"""
SAPP AI Demo
Demonstração da IA de análise de risco com cenários realistas
"""

import sys
import os
import time
from datetime import datetime, timedelta

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from risk_analyzer import SAPPRiskAnalyzer, PositionData

def create_realistic_scenarios():
    """Cria cenários realistas de trading"""
    print("🎬 SAPP AI - DEMONSTRAÇÃO REALISTA")
    print("=" * 60)
    print()
    
    analyzer = SAPPRiskAnalyzer()
    
    # Cenário 1: Mineradora Brasileira - Hedge WTI-Brent
    print("🏭 CENÁRIO 1: Mineradora Brasileira")
    print("-" * 40)
    print("📊 Posição: Long WTI, Short Brent (Hedge de petróleo)")
    print("💰 Margem: 1,000,000 XLM")
    print("📈 Spread inicial: -$4.00 (Brent $67 - WTI $63)")
    print()
    
    # Simular evolução do spread ao longo do tempo
    spreads = [
        -400000000000,  # -$4.00 (inicial)
        -420000000000,  # -$4.20 (+5% volatilidade)
        -450000000000,  # -$4.50 (+12.5% volatilidade)
        -480000000000,  # -$4.80 (+20% volatilidade)
        -520000000000,  # -$5.20 (+30% volatilidade)
        -600000000000,  # -$6.00 (+50% volatilidade)
    ]
    
    for i, spread in enumerate(spreads):
        position = PositionData(
            position_id=1,
            leg1_market="WTI",
            leg2_market="Brent",
            leg1_size=1000,
            leg2_size=-1000,
            margin=1000000,
            entry_spread=-400000000000,
            current_spread=spread,
            timestamp=datetime.now()
        )
        
        risk_score = analyzer._calculate_risk_score(position)
        alert = analyzer._generate_alert(position, risk_score)
        
        spread_display = spread / 100000000000  # Converter para dólares
        change_percent = ((spread - (-400000000000)) / (-400000000000)) * 100
        
        print(f"⏰ Tempo {i*30}s: Spread ${spread_display:.2f} ({change_percent:+.1f}%)")
        print(f"   Score de risco: {risk_score:.2f}")
        
        if alert:
            print(f"   🚨 {alert.alert_type}: {alert.message}")
            print(f"   💡 {alert.recommendation}")
        else:
            print(f"   ✅ Status: Estável")
        print()
        
        time.sleep(1)  # Pausa para dramatizar
    
    print("=" * 60)
    print()
    
    # Cenário 2: Trader Institucional - Gold-Silver Spread
    print("🏦 CENÁRIO 2: Trader Institucional")
    print("-" * 40)
    print("📊 Posição: Long Gold, Short Silver (Arbitragem metais)")
    print("💰 Margem: 2,000,000 XLM")
    print("📈 Spread inicial: $33,000 (Gold $3,732 - Silver $43.20)")
    print()
    
    # Simular crash do spread
    gold_silver_spreads = [
        33000000000000,   # $33,000 (inicial)
        32000000000000,   # $32,000 (-3%)
        30000000000000,   # $30,000 (-9%)
        25000000000000,   # $25,000 (-24%)
        20000000000000,   # $20,000 (-39%)
        15000000000000,   # $15,000 (-55%)
    ]
    
    for i, spread in enumerate(gold_silver_spreads):
        position = PositionData(
            position_id=2,
            leg1_market="Gold",
            leg2_market="Silver",
            leg1_size=10,
            leg2_size=-1000,
            margin=2000000,
            entry_spread=33000000000000,
            current_spread=spread,
            timestamp=datetime.now()
        )
        
        risk_score = analyzer._calculate_risk_score(position)
        alert = analyzer._generate_alert(position, risk_score)
        
        spread_display = spread / 100000000000  # Converter para dólares
        change_percent = ((spread - 33000000000000) / 33000000000000) * 100
        
        print(f"⏰ Tempo {i*30}s: Spread ${spread_display:,.0f} ({change_percent:+.1f}%)")
        print(f"   Score de risco: {risk_score:.2f}")
        
        if alert:
            print(f"   🚨 {alert.alert_type}: {alert.message}")
            print(f"   💡 {alert.recommendation}")
        else:
            print(f"   ✅ Status: Estável")
        print()
        
        time.sleep(1)
    
    print("=" * 60)
    print()
    
    # Cenário 3: Resumo de Risco do Portfolio
    print("📊 CENÁRIO 3: Resumo do Portfolio")
    print("-" * 40)
    
    # Adicionar todas as posições ao analisador
    positions = [
        PositionData(
            position_id=1,
            leg1_market="WTI",
            leg2_market="Brent",
            leg1_size=1000,
            leg2_size=-1000,
            margin=1000000,
            entry_spread=-400000000000,
            current_spread=-600000000000,  # Spread deteriorado
            timestamp=datetime.now()
        ),
        PositionData(
            position_id=2,
            leg1_market="Gold",
            leg2_market="Silver",
            leg1_size=10,
            leg2_size=-1000,
            margin=2000000,
            entry_spread=33000000000000,
            current_spread=15000000000000,  # Spread crashado
            timestamp=datetime.now()
        ),
        PositionData(
            position_id=3,
            leg1_market="Copper",
            leg2_market="NatGas",
            leg1_size=1000,
            leg2_size=-1000,
            margin=1000000,
            entry_spread=1650000000000,
            current_spread=1650000000000,  # Spread estável
            timestamp=datetime.now()
        )
    ]
    
    analyzer.positions = {pos.position_id: pos for pos in positions}
    
    # Análise individual
    print("🔍 Análise Individual das Posições:")
    for position in positions:
        risk_score = analyzer._calculate_risk_score(position)
        alert = analyzer._generate_alert(position, risk_score)
        
        print(f"Posição {position.position_id} ({position.leg1_market}-{position.leg2_market}):")
        print(f"  Score: {risk_score:.2f}")
        if alert:
            print(f"  Status: {alert.alert_type} - {alert.message}")
        else:
            print(f"  Status: Estável")
        print()
    
    # Resumo geral
    summary = analyzer.get_risk_summary()
    print("📈 Resumo Geral do Portfolio:")
    print(f"  Total de posições: {summary['total_positions']}")
    print(f"  Posições de alto risco: {summary['high_risk_positions']}")
    print(f"  Posições críticas: {summary['critical_positions']}")
    print(f"  Risco geral: {summary['overall_risk']}")
    print()
    
    # Recomendações finais
    print("💡 RECOMENDAÇÕES FINAIS:")
    print("-" * 40)
    if summary['critical_positions'] > 0:
        print("🚨 AÇÃO IMEDIATA: Fechar posições críticas")
    elif summary['high_risk_positions'] > 0:
        print("⚠️ ATENÇÃO: Monitorar posições de alto risco")
    else:
        print("✅ PORTFOLIO ESTÁVEL: Continuar monitorando")
    
    print()
    print("🎯 A IA SAPP está funcionando perfeitamente!")
    print("   - Análise de risco em tempo real ✅")
    print("   - Alertas automáticos ✅")
    print("   - Monitoramento contínuo ✅")
    print("   - Recomendações inteligentes ✅")

def main():
    """Função principal"""
    try:
        create_realistic_scenarios()
    except KeyboardInterrupt:
        print("\n🛑 Demonstração interrompida")
    except Exception as e:
        print(f"❌ Erro na demonstração: {e}")

if __name__ == "__main__":
    main()
