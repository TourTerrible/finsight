import math
from typing import Dict, List
from models.financial_data import UserFinancialData, SimulationResult, FinancialGoal, GoalType, Currency, Investment, InvestmentMode
from services.currency_service import CurrencyService

class FinancialSimulator:
    def __init__(self):
        # Currency-aware default goal amounts (only USD and INR supported)
        self.default_goals_by_currency = {
            Currency.USD: {
                GoalType.BUY_CAR: 25000,
                GoalType.BUY_HOUSE: 200000,
                GoalType.RETIRE_EARLY: 1000000,
                GoalType.ANNUAL_TRIPS: 5000,
            },
            Currency.INR: {
                GoalType.BUY_CAR: 800000,  # 8 lakhs
                GoalType.BUY_HOUSE: 5000000,  # 50 lakhs
                GoalType.RETIRE_EARLY: 25000000,  # 2.5 crores
                GoalType.ANNUAL_TRIPS: 100000,  # 1 lakh per year
            },
        }
    
    def simulate_financial_projection(self, user_data: UserFinancialData) -> SimulationResult:
        """
        Main simulation function that calculates financial projections and goal feasibility.
        """
        # Calculate cash runway
        cash_runway_months = self._calculate_cash_runway(user_data)
        
        # Calculate monthly cash flow
        monthly_cash_flow = self._calculate_monthly_cash_flow(user_data)
        
        # Project net worth over the specified years
        net_worth_by_year = self._project_net_worth(user_data)
        
        # Calculate final values
        total_investments = self._calculate_total_investments(user_data)
        liquid_cash_end = self._calculate_liquid_cash_end(user_data)
        
        # Analyze goal feasibility
        goal_feasibility, goal_timeline = self._analyze_goals(user_data, net_worth_by_year)
        
        return SimulationResult(
            net_worth_by_year=net_worth_by_year,
            cash_runway_months=cash_runway_months,
            monthly_cash_flow=monthly_cash_flow,
            total_investments=total_investments,
            liquid_cash_end=liquid_cash_end,
            goal_feasibility=goal_feasibility,
            goal_timeline=goal_timeline
        )
    
    def _calculate_cash_runway(self, user_data: UserFinancialData) -> int:
        """Calculate how many months the user can survive without income."""
        if user_data.monthly_expenses <= 0:
            return 0
        return int(user_data.current_bank_balance / user_data.monthly_expenses)
    
    def _calculate_monthly_cash_flow(self, user_data: UserFinancialData) -> float:
        """Calculate net monthly cash flow."""
        income = user_data.monthly_income or 0
        return income - user_data.monthly_expenses
    
    def _get_weighted_average_return_rate(self, user_data: UserFinancialData) -> float:
        """Calculate weighted average return rate from investments."""
        if not user_data.investments:
            return 8.0  # Default return rate if no investments
        
        total_value = sum(inv.existing_value for inv in user_data.investments)
        if total_value == 0:
            return 8.0
        
        weighted_return = sum(
            inv.existing_value * inv.expected_yearly_return 
            for inv in user_data.investments
        ) / total_value
        
        return weighted_return
    
    def _calculate_monthly_investment_contribution(self, user_data: UserFinancialData) -> float:
        """Calculate total monthly investment contribution from all investments."""
        monthly_contribution = 0
        for investment in user_data.investments:
            if investment.mode == InvestmentMode.MONTHLY:
                monthly_contribution += investment.amount
            elif investment.mode == InvestmentMode.YEARLY:
                monthly_contribution += investment.amount / 12
            # ONE_TIME investments don't contribute monthly
        
        return monthly_contribution
    
    def _project_net_worth(self, user_data: UserFinancialData) -> Dict[int, float]:
        """Project net worth year by year using detailed investment data."""
        # Get weighted average return rate from investments
        avg_return_rate = self._get_weighted_average_return_rate(user_data)
        annual_return_decimal = avg_return_rate / 100.0
        monthly_return_rate = (1 + annual_return_decimal) ** (1/12) - 1
        
        # Calculate monthly investment contribution
        monthly_investment_contribution = self._calculate_monthly_investment_contribution(user_data)
        
        # Initialize tracking variables
        net_worth_by_year = {}
        current_investment_value = 0
        current_bank = user_data.current_bank_balance
        
        # Initialize investment values from existing investments
        for investment in user_data.investments:
            current_investment_value += investment.existing_value
        
        # Project year by year
        for year in range(1, user_data.projection_years + 1):
            # Calculate investment growth for this year (monthly compounding)
            for month in range(12):
                # Add monthly investment contribution
                current_investment_value += monthly_investment_contribution
                
                # Apply monthly return to investments
                current_investment_value *= (1 + monthly_return_rate)
            
            # Handle bank balance changes
            if user_data.monthly_income is not None:
                # If income is provided, add income and subtract expenses
                net_monthly_cash_flow = user_data.monthly_income - user_data.monthly_expenses
                current_bank += net_monthly_cash_flow * 12
            else:
                # If no income, only subtract expenses
                current_bank -= user_data.monthly_expenses * 12
            
            # Calculate total net worth for this year
            total_net_worth = current_bank + current_investment_value
            net_worth_by_year[year] = round(total_net_worth, 2)
        
        return net_worth_by_year
    
    def _calculate_total_investments(self, user_data: UserFinancialData) -> float:
        """Calculate total investments at the end of projection period."""
        # Get weighted average return rate from investments
        avg_return_rate = self._get_weighted_average_return_rate(user_data)
        annual_return_decimal = avg_return_rate / 100.0
        monthly_return_rate = (1 + annual_return_decimal) ** (1/12) - 1
        
        # Calculate monthly investment contribution
        monthly_investment_contribution = self._calculate_monthly_investment_contribution(user_data)
        
        # Calculate total investment value
        total_investment_value = 0
        
        # Start with existing investment values
        for investment in user_data.investments:
            total_investment_value += investment.existing_value
        
        # Add future contributions and growth
        for month in range(user_data.projection_years * 12):
            total_investment_value += monthly_investment_contribution
            total_investment_value *= (1 + monthly_return_rate)
        
        return round(total_investment_value, 2)
    
    def _calculate_liquid_cash_end(self, user_data: UserFinancialData) -> float:
        """Calculate liquid cash at the end of projection period."""
        if user_data.monthly_income is None:
            # No income scenario
            return max(0, user_data.current_bank_balance - (user_data.monthly_expenses * 12 * user_data.projection_years))
        else:
            # With income scenario
            net_monthly_cash_flow = user_data.monthly_income - user_data.monthly_expenses
            return user_data.current_bank_balance + (net_monthly_cash_flow * 12 * user_data.projection_years)
    
    def _analyze_goals(self, user_data: UserFinancialData, net_worth_by_year: Dict[int, float]) -> tuple[Dict[str, bool], Dict[str, int]]:
        """Analyze feasibility of user's financial goals."""
        goal_feasibility = {}
        goal_timeline = {}
        
        for goal in user_data.goals:
            goal_key = f"{goal.goal_type}_{goal.description or 'default'}"
            
            # Determine target amount
            if goal.target_amount:
                target_amount = goal.target_amount
            else:
                target_amount = self.default_goals_by_currency.get(user_data.currency, {}).get(goal.goal_type, 1000000)  # Default 10 lakhs
            
            # Find when this goal becomes achievable
            achievable_year = None
            for year, net_worth in net_worth_by_year.items():
                if net_worth >= target_amount:
                    achievable_year = year
                    break
            
            # Check if goal is feasible within projection period
            goal_feasibility[goal_key] = achievable_year is not None
            
            # Set timeline
            if achievable_year:
                goal_timeline[goal_key] = achievable_year
            else:
                goal_timeline[goal_key] = -1  # Not achievable within projection period
        
        return goal_feasibility, goal_timeline
    
    def get_goal_suggestions(self, user_data: UserFinancialData) -> List[FinancialGoal]:
        """Generate suggested goals based on user's financial profile and currency."""
        suggestions = []
        currency = user_data.currency
        currency_goals = self.default_goals_by_currency.get(currency, self.default_goals_by_currency[Currency.INR])
        
        # Get currency-specific income thresholds using exchange rates for comparison
        usd_rate = CurrencyService.EXCHANGE_RATES.get(currency, 1.0)
        moderate_income_threshold = 50000 * usd_rate  # ~$600/month equivalent
        good_income_threshold = 100000 * usd_rate   # ~$1200/month equivalent
        
        # Suggest car purchase if income is decent
        if user_data.monthly_income and user_data.monthly_income > moderate_income_threshold:
            suggestions.append(FinancialGoal(
                goal_type=GoalType.BUY_CAR,
                target_amount=currency_goals[GoalType.BUY_CAR],
                target_year=3,
                description="Buy a car"
            ))
        
        # Suggest house purchase if income is good
        if user_data.monthly_income and user_data.monthly_income > good_income_threshold:
            suggestions.append(FinancialGoal(
                goal_type=GoalType.BUY_HOUSE,
                target_amount=currency_goals[GoalType.BUY_HOUSE],
                target_year=8,
                description="Buy a house"
            ))
        
        # Suggest retirement planning
        if user_data.age < 50:
            suggestions.append(FinancialGoal(
                goal_type=GoalType.RETIRE_EARLY,
                target_amount=currency_goals[GoalType.RETIRE_EARLY],
                target_year=20,
                description="Retire early"
            ))
        
        # Suggest annual trips
        suggestions.append(FinancialGoal(
            goal_type=GoalType.ANNUAL_TRIPS,
            target_amount=currency_goals[GoalType.ANNUAL_TRIPS],
            target_year=2,
            description="Annual vacation fund"
        ))
        
        return suggestions 