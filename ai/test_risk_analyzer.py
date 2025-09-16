#!/usr/bin/env python3
"""
Teste do SAPP Risk Analyzer
Script para testar a IA de análise de risco
"""

import sys
import os
import time
from datetime import datetime, timedelta

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from risk_analyzer import SAPPRiskAnalyzer, PositionData, RiskAlert

def test_risk_calculation():
    """Testa cálculo de score de risco"""
    print("🧪 TESTE 1: Cálculo de Score de Risco")
    print("=" * 50)
    
    analyzer = SAPPRiskAnalyzer()
    
    # Teste 1: Posição estável
    stable_position = PositionData(
        position_id=1,
        leg1_market="WTI",
        leg2_market="Brent",
        leg1_size=1000,
        leg2_size=-1000,
        margin=1000000,
        entry_spread=-400000000000,  # -$4.00
        current_spread=-400000000000,  # -$4.00 (sem mudança)
        timestamp=datetime.now()
    )
    
    risk_score = analyzer._calculate_risk_score(stable_position)
    print(f"✅ Posição estável - Score: {risk_score:.2f}")
    
    # Teste 2: Posição com alta volatilidade
    volatile_position = PositionData(
        position_id=2,
        leg1_market="WTI",
        leg2_market="Brent",
        leg1_size=1000,
        leg2_size=-1000,
        margin=1000000,
        entry_spread=-400000000000,  # -$4.00
        current_spread=-800000000000,  # -$8.00 (100% de mudança)
        timestamp=datetime.now()
    )
    
    risk_score = analyzer._calculate_risk_score(volatile_position)
    print(f"⚠️ Posição volátil - Score: {risk_score:.2f}")
    
    # Teste 3: Posição crítica
    critical_position = PositionData(
        position_id=3,
        leg1_market="WTI",
        leg2_market="Brent",
        leg1_size=1000,
        leg2_size=-1000,
        margin=1000000,
        entry_spread=-400000000000,  # -$4.00
        current_spread=-1200000000000,  # -$12.00 (200% de mudança)
        timestamp=datetime.now()
    )
    
    risk_score = analyzer._calculate_risk_score(critical_position)
    print(f"🚨 Posição crítica - Score: {risk_score:.2f}")
    
    print()

def test_alert_generation():
    """Testa geração de alertas"""
    print("🧪 TESTE 2: Geração de Alertas")
    print("=" * 50)
    
    analyzer = SAPPRiskAnalyzer()
    
    # Teste com diferentes scores de risco
    test_scores = [0.1, 0.4, 0.6, 0.8, 0.95]
    
    for score in test_scores:
        test_position = PositionData(
            position_id=1,
            leg1_market="WTI",
            leg2_market="Brent",
            leg1_size=1000,
            leg2_size=-1000,
            margin=1000000,
            entry_spread=-400000000000,
            current_spread=-400000000000,
            timestamp=datetime.now()
        )
        
        # Simular score de risco
        alert = analyzer._generate_alert(test_position, score)
        
        if alert:
            print(f"Score {score:.2f}: {alert.alert_type} - {alert.message}")
            print(f"  Recomendação: {alert.recommendation}")
        else:
            print(f"Score {score:.2f}: Sem alerta necessário")
        print()

def test_volatility_analysis():
    """Testa análise de volatilidade"""
    print("🧪 TESTE 3: Análise de Volatilidade")
    print("=" * 50)
    
    analyzer = SAPPRiskAnalyzer()
    
    # Teste com diferentes mudanças de spread
    spread_changes = [
        (0.01, "Mudança mínima"),
        (0.05, "Mudança moderada"),
        (0.10, "Mudança alta"),
        (0.20, "Mudança extrema")
    ]
    
    for change, description in spread_changes:
        position = PositionData(
            position_id=1,
            leg1_market="WTI",
            leg2_market="Brent",
            leg1_size=1000,
            leg2_size=-1000,
            margin=1000000,
            entry_spread=-400000000000,  # -$4.00
            current_spread=-400000000000 * (1 + change),  # Aplicar mudança
            timestamp=datetime.now()
        )
        
        volatility_score = analyzer._calculate_volatility_risk(position)
        print(f"{description} ({change*100:.1f}%): Score {volatility_score:.2f}")
    
    print()

def test_margin_analysis():
    """Teste análise de margem"""
    print("🧪 TESTE 4: Análise de Margem")
    print("=" * 50)
    
    analyzer = SAPPRiskAnalyzer()
    
    # Teste com diferentes níveis de margem
    margin_levels = [
        (0.3, "Margem baixa"),
        (0.6, "Margem média"),
        (0.8, "Margem alta"),
        (0.95, "Margem crítica")
    ]
    
    for margin_ratio, description in margin_levels:
        # Simular posição com diferentes níveis de margem
        position = PositionData(
            position_id=1,
            leg1_market="WTI",
            leg2_market="Brent",
            leg1_size=1000,
            leg2_size=-1000,
            margin=int(1000000 * margin_ratio),  # Ajustar margem
            entry_spread=-400000000000,
            current_spread=-400000000000,
            timestamp=datetime.now()
        )
        
        margin_score = analyzer._calculate_margin_risk(position)
        print(f"{description} ({margin_ratio*100:.0f}%): Score {margin_score:.2f}")
    
    print()

def test_monitoring_simulation():
    """Simula monitoramento contínuo"""
    print("🧪 TESTE 5: Simulação de Monitoramento")
    print("=" * 50)
    
    analyzer = SAPPRiskAnalyzer()
    
    # Adicionar posições de teste
    positions = [
        PositionData(
            position_id=1,
            leg1_market="WTI",
            leg2_market="Brent",
            leg1_size=1000,
            leg2_size=-1000,
            margin=1000000,
            entry_spread=-400000000000,
            current_spread=-400000000000,
            timestamp=datetime.now()
        ),
        PositionData(
            position_id=2,
            leg1_market="Gold",
            leg2_market="Silver",
            leg1_size=10,
            leg2_size=-1000,
            margin=1000000,
            entry_spread=33000000000000,
            current_spread=35000000000000,  # Spread aumentou
            timestamp=datetime.now()
        )
    ]
    
    analyzer.positions = {pos.position_id: pos for pos in positions}
    
    print("📊 Analisando posições...")
    for position in positions:
        risk_score = analyzer._calculate_risk_score(position)
        alert = analyzer._generate_alert(position, risk_score)
        
        print(f"Posição {position.position_id} ({position.leg1_market}-{position.leg2_market}):")
        print(f"  Score de risco: {risk_score:.2f}")
        if alert:
            print(f"  Alerta: {alert.alert_type} - {alert.message}")
        else:
            print(f"  Status: Estável")
        print()
    
    # Resumo geral
    summary = analyzer.get_risk_summary()
    print(f"📈 Resumo geral: {summary}")

def main():
    """Executa todos os testes"""
    print("🧠 SAPP RISK ANALYZER - TESTES")
    print("=" * 60)
    print()
    
    try:
        test_risk_calculation()
        test_alert_generation()
        test_volatility_analysis()
        test_margin_analysis()
        test_monitoring_simulation()
        
        print("✅ Todos os testes concluídos com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante os testes: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
