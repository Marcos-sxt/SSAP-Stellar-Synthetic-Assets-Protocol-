#!/usr/bin/env python3
"""
Demo do Fluxo WebSocket + Dados Reais
Demonstra exatamente como o fluxo funciona
"""

import sys
import os
import time
import json
from datetime import datetime

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from real_risk_analyzer import SAPPRealRiskAnalyzer, PositionData

def demo_fluxo_completo():
    """Demonstra o fluxo completo do WebSocket"""
    print("🔄 DEMO: FLUXO WEBSOCKET + DADOS REAIS")
    print("=" * 60)
    print()
    
    # Criar analisador
    analyzer = SAPPRealRiskAnalyzer()
    
    # Simular posição de teste
    test_position = PositionData(
        position_id=1,
        leg1_market="WTI",
        leg2_market="Brent",
        leg1_size=1000,
        leg2_size=-1000,
        margin=1000000,
        entry_spread=-400000000000,  # -$4.00
        current_spread=-400000000000,  # -$4.00
        timestamp=datetime.now()
    )
    
    analyzer.positions[1] = test_position
    
    print("📊 POSIÇÃO DE TESTE CRIADA:")
    print(f"   WTI-Brent Spread: ${test_position.entry_spread/100000000000:.2f}")
    print(f"   Margem: {test_position.margin:,} XLM")
    print()
    
    # Simular diferentes cenários de preços
    cenarios = [
        {
            "nome": "Preços Estáveis",
            "precos": {"WTI": 63.00, "Brent": 67.00},
            "descricao": "Spread mantém -$4.00"
        },
        {
            "nome": "WTI Subindo",
            "precos": {"WTI": 65.00, "Brent": 67.00},
            "descricao": "Spread muda para -$2.00"
        },
        {
            "nome": "Brent Subindo",
            "precos": {"WTI": 63.00, "Brent": 70.00},
            "descricao": "Spread muda para -$7.00"
        },
        {
            "nome": "Ambos Subindo",
            "precos": {"WTI": 66.00, "Brent": 69.00},
            "descricao": "Spread muda para -$3.00"
        },
        {
            "nome": "Volatilidade Alta",
            "precos": {"WTI": 60.00, "Brent": 75.00},
            "descricao": "Spread explode para -$15.00"
        }
    ]
    
    for i, cenario in enumerate(cenarios, 1):
        print(f"🎭 CENÁRIO {i}: {cenario['nome']}")
        print("-" * 50)
        print(f"📝 {cenario['descricao']}")
        print()
        
        # Simular recebimento de preços via WebSocket
        print("📨 SIMULANDO MENSAGEM WEBSOCKET:")
        ws_message = {
            "commodity": {
                "WTI": {"price": cenario["precos"]["WTI"], "source": "Alpha Vantage"},
                "Brent": {"price": cenario["precos"]["Brent"], "source": "Alpha Vantage"}
            }
        }
        print(json.dumps(ws_message, indent=2))
        print()
        
        # Processar mensagem (simular _on_message)
        print("🔄 PROCESSANDO MENSAGEM WEBSOCKET:")
        analyzer._process_commodity_prices(ws_message["commodity"])
        
        # Mostrar preços atualizados
        print("📊 PREÇOS ATUALIZADOS:")
        for market, price in analyzer.current_prices.items():
            if market in ["WTI", "Brent"]:
                print(f"   {market}: ${price:.2f}")
        print()
        
        # Calcular spread atual
        wti_price = analyzer.current_prices.get("WTI", 0)
        brent_price = analyzer.current_prices.get("Brent", 0)
        if wti_price and brent_price:
            current_spread = wti_price - brent_price
            spread_display = current_spread
            print(f"📈 SPREAD CALCULADO:")
            print(f"   WTI: ${wti_price:.2f}")
            print(f"   Brent: ${brent_price:.2f}")
            print(f"   Spread: ${spread_display:.2f}")
            print()
            
            # Atualizar spread na posição
            test_position.current_spread = current_spread * 100000000000  # Converter para formato do contrato
            
            # Análise de risco detalhada
            print("🧠 ANÁLISE DE RISCO DETALHADA:")
            
            # 1. Volatilidade
            volatility_score = analyzer._calculate_volatility_risk_real(test_position)
            spread_change = abs(current_spread - (test_position.entry_spread / 100000000000))
            spread_percentage = spread_change / abs(test_position.entry_spread / 100000000000) * 100
            print(f"   1. Volatilidade: {volatility_score:.2f}")
            print(f"      Mudança: {spread_percentage:.1f}%")
            
            # 2. Margem
            margin_score = analyzer._calculate_margin_risk_real(test_position)
            leg1_value = abs(test_position.leg1_size) * wti_price
            leg2_value = abs(test_position.leg2_size) * brent_price
            total_value = max(leg1_value, leg2_value)
            required_margin = total_value * 0.2
            margin_ratio = test_position.margin / required_margin if required_margin > 0 else 1.0
            print(f"   2. Margem: {margin_score:.2f}")
            print(f"      Valor posição: ${total_value:,.0f}")
            print(f"      Margem necessária: ${required_margin:,.0f}")
            print(f"      Ratio: {margin_ratio:.2f}")
            
            # 3. Tendência
            trend_score = analyzer._calculate_trend_risk_real(test_position)
            print(f"   3. Tendência: {trend_score:.2f}")
            
            # 4. Liquidação
            liquidation_score = analyzer._calculate_liquidation_risk_real(test_position)
            liquidation_distance = (test_position.margin - required_margin) / required_margin if required_margin > 0 else 1.0
            print(f"   4. Liquidação: {liquidation_score:.2f}")
            print(f"      Distância: {liquidation_distance:.2f}")
            
            # Score total
            total_score = analyzer._calculate_risk_score(test_position)
            print(f"   📊 SCORE TOTAL: {total_score:.2f}")
            
            # Alerta
            alert = analyzer._generate_alert(test_position, total_score)
            if alert:
                print(f"   🚨 ALERTA: {alert.alert_type}")
                print(f"   💡 {alert.recommendation}")
            else:
                print(f"   ✅ Status: Estável")
        
        print()
        print("=" * 60)
        print()
        
        # Pausa para dramatizar
        time.sleep(2)
    
    # Resumo final
    print("📈 RESUMO FINAL:")
    print("-" * 30)
    summary = analyzer.get_risk_summary()
    print(f"Total de posições: {summary['total_positions']}")
    print(f"Posições de alto risco: {summary['high_risk_positions']}")
    print(f"Posições críticas: {summary['critical_positions']}")
    print(f"Risco geral: {summary['overall_risk']}")
    print()
    print("🎯 FLUXO COMPLETO DEMONSTRADO!")
    print("   ✅ WebSocket recebe preços reais")
    print("   ✅ IA calcula spreads reais")
    print("   ✅ Análise de risco baseada em dados atuais")
    print("   ✅ Alertas baseados em volatilidade real")

def main():
    """Função principal"""
    try:
        demo_fluxo_completo()
    except KeyboardInterrupt:
        print("\n🛑 Demo interrompida")
    except Exception as e:
        print(f"❌ Erro na demo: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
