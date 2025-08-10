from typing import Dict, Tuple
from models.financial_data import Currency


class CurrencyService:
    """Service to handle currency-specific logic and conversions."""
    
    # Approximate exchange rates to USD (for reference)
    EXCHANGE_RATES = {
        Currency.USD: 1.0,
        Currency.INR: 83.0,
    }
    
    # Currency symbols for display
    CURRENCY_SYMBOLS = {
        Currency.USD: "$",
        Currency.INR: "₹",
    }
    
    # Minimum emergency fund thresholds (in local currency)
    EMERGENCY_FUND_THRESHOLDS = {
        Currency.USD: {"low": 5000, "good": 15000, "excellent": 30000},
        Currency.INR: {"low": 200000, "good": 600000, "excellent": 1200000},
    }
    
    # Good monthly cash flow thresholds (in local currency)
    CASH_FLOW_THRESHOLDS = {
        Currency.USD: {"minimal": 500, "good": 1500, "excellent": 3000},
        Currency.INR: {"minimal": 10000, "good": 30000, "excellent": 60000},
    }
    
    # Recommended SIP percentages by currency/region
    SIP_PERCENTAGE_RECOMMENDATIONS = {
        Currency.USD: 0.20,  # 20% of income
        Currency.INR: 0.20,  # 20% of income
    }
    
    @classmethod
    def get_currency_symbol(cls, currency: Currency) -> str:
        """Get the symbol for a currency."""
        return cls.CURRENCY_SYMBOLS.get(currency, currency.value)
    
    @classmethod
    def format_currency(cls, amount: float, currency: Currency) -> str:
        """Format an amount with currency symbol."""
        symbol = cls.get_currency_symbol(currency)
        
        # Special formatting for different currencies
        if currency in [Currency.INR]:
            # Indian numbering system
            return f"{symbol}{amount:,.0f}"
        else:
            # Standard formatting with 2 decimal places
            return f"{symbol}{amount:,.2f}"
    
    @classmethod
    def get_emergency_fund_status(cls, bank_balance: float, monthly_expenses: float, currency: Currency) -> Tuple[str, str]:
        """Assess emergency fund status based on currency-specific thresholds."""
        months_covered = bank_balance / monthly_expenses if monthly_expenses > 0 else 0
        thresholds = cls.EMERGENCY_FUND_THRESHOLDS.get(currency, cls.EMERGENCY_FUND_THRESHOLDS[Currency.USD])
        
        if months_covered >= 6 and bank_balance >= thresholds["excellent"]:
            return "excellent", "✅ Excellent emergency fund"
        elif months_covered >= 6 or bank_balance >= thresholds["good"]:
            return "good", "✅ Good emergency fund"
        elif months_covered >= 3 or bank_balance >= thresholds["low"]:
            return "adequate", "⚠️ Emergency fund needs improvement"
        else:
            return "poor", "🚨 Emergency fund is critically low"
    
    @classmethod
    def get_cash_flow_status(cls, monthly_cash_flow: float, currency: Currency) -> Tuple[str, str]:
        """Assess monthly cash flow status."""
        thresholds = cls.CASH_FLOW_THRESHOLDS.get(currency, cls.CASH_FLOW_THRESHOLDS[Currency.USD])
        
        if monthly_cash_flow < 0:
            return "negative", "❌ Negative cash flow - unsustainable"
        elif monthly_cash_flow < thresholds["minimal"]:
            return "minimal", "📊 Minimal positive cash flow"
        elif monthly_cash_flow < thresholds["good"]:
            return "good", "📈 Good cash flow"
        else:
            return "excellent", "🌟 Excellent cash flow"
    
    @classmethod
    def get_sip_recommendation(cls, monthly_income: float, current_sip: float, currency: Currency) -> Tuple[bool, float, str]:
        """Check if SIP amount is adequate and provide recommendation."""
        if monthly_income <= 0:
            return True, current_sip, "Unable to assess without income information"
        
        recommended_percentage = cls.SIP_PERCENTAGE_RECOMMENDATIONS.get(currency, 0.20)
        recommended_amount = monthly_income * recommended_percentage
        
        if current_sip >= recommended_amount:
            return True, recommended_amount, f"✅ Great! You're investing {current_sip/monthly_income:.1%} of income"
        else:
            shortfall = recommended_amount - current_sip
            return False, recommended_amount, f"📈 Consider increasing SIP by {cls.format_currency(shortfall, currency)}"
    
    @classmethod
    def get_investment_diversification_advice(cls, bank_balance: float, other_investments: float, currency: Currency) -> str:
        """Provide currency-specific investment diversification advice."""
        total_assets = bank_balance + other_investments
        cash_percentage = bank_balance / total_assets if total_assets > 0 else 0
        
        # Currency-specific investment advice
        investment_culture = {
            Currency.USD: "Consider index funds, ETFs, and 401(k) contributions",
            Currency.INR: "Consider ELSS, PPF, EPF, and Indian mutual funds"
        }
        
        if cash_percentage > 0.7:
            return f"🏦 Too much cash ({cash_percentage:.1%}). {investment_culture.get(currency, 'Diversify into investments')}"
        elif cash_percentage > 0.5:
            return f"💰 Consider moving some cash to investments. {investment_culture.get(currency, '')}"
        else:
            return f"✅ Good diversification. {investment_culture.get(currency, '')}"
    
    @classmethod
    def convert_to_usd(cls, amount: float, from_currency: Currency) -> float:
        """Convert amount from any currency to USD for comparison purposes."""
        if from_currency == Currency.USD:
            return amount
        
        rate = cls.EXCHANGE_RATES.get(from_currency, 1.0)
        return amount / rate
    
    @classmethod
    def get_regional_advice(cls, currency: Currency, age: int) -> str:
        """Get region/currency specific financial advice."""
        regional_advice = {
            Currency.USD: {
                "young": "Maximize 401(k) match, consider Roth IRA, invest in low-cost index funds",
                "mid": "Increase 401(k) contributions, consider HSA, review insurance coverage",
                "senior": "Focus on capital preservation, consider bond allocation, plan Medicare"
            },
        
            Currency.INR: {
                "young": "Start SIP in ELSS, maximize EPF contribution, consider PPF",
                "mid": "Diversify across equity and debt, consider NPS, optimize tax savings",
                "senior": "Focus on debt instruments, consider SCSS, preserve capital"
            },
            
        }
        
        age_category = "young" if age < 35 else "mid" if age < 55 else "senior"
        return regional_advice.get(currency, {}).get(age_category, "Focus on building wealth systematically") 