from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from enum import Enum

class MaritalStatus(str, Enum):
    SINGLE = "single"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"

class Currency(str, Enum):
    INR = "INR"  # Indian Rupee
    USD = "USD"  # US Dollar
    EUR = "EUR"  # Euro
    GBP = "GBP"  # British Pound
    CAD = "CAD"  # Canadian Dollar
    AUD = "AUD"  # Australian Dollar
    SGD = "SGD"  # Singapore Dollar
    AED = "AED"  # UAE Dirham
    JPY = "JPY"  # Japanese Yen

class GoalType(str, Enum):
    BUY_CAR = "buy_car"
    BUY_HOUSE = "buy_house"
    RETIRE_EARLY = "retire_early"
    ANNUAL_TRIPS = "annual_trips"
    CUSTOM = "custom"

class InvestmentType(str, Enum):
    MUTUAL_FUND = "mutual_fund"
    LAND = "land"
    STOCKS = "stocks"
    BONDS = "bonds"
    FIXED_DEPOSIT = "fixed_deposit"
    PPF = "ppf"
    EPF = "epf"
    GOLD = "gold"
    REAL_ESTATE = "real_estate"
    CRYPTO = "crypto"
    OTHER = "other"

class InvestmentMode(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"
    ONE_TIME = "one_time"

class FinancialGoal(BaseModel):
    goal_type: GoalType
    target_amount: Optional[float] = None
    target_year: Optional[int] = None
    description: Optional[str] = None

class Investment(BaseModel):
    type: InvestmentType = Field(..., description="Type of investment")
    amount: float = Field(..., ge=0, description="Investment amount")
    mode: InvestmentMode = Field(..., description="Investment frequency mode")
    expected_yearly_return: float = Field(..., ge=0, le=100, description="Expected yearly return percentage")
    existing_value: float = Field(..., ge=0, description="Current value of the investment")
    description: Optional[str] = Field(None, description="Optional description of the investment")

class UserFinancialData(BaseModel):
    # User identification
    email: str = Field(..., description="User's email address for identification")
    
    # Basic financial info
    current_bank_balance: float = Field(..., gt=0, description="Current liquid cash balance")
    monthly_income: Optional[float] = Field(None, ge=0, description="Monthly income")
    monthly_expenses: float = Field(..., gt=0, description="Monthly expenses")
    other_investments: float = Field(..., ge=0, description="Current value of other investments (legacy)")
    investments: List[Investment] = Field(default_factory=list, description="Detailed investment breakdown")
    
    # Currency
    currency: Currency = Field(Currency.INR, description="Currency for all amounts")
    
    # Personal info
    age: int = Field(..., ge=18, le=100, description="User's age")
    marital_status: Optional[MaritalStatus] = Field(None, description="Marital status (optional)")
    dependents: Optional[int] = Field(None, ge=0, description="Number of dependents (optional)")
    
    # Investment preferences
    projection_years: int = Field(10, ge=1, le=50, description="Number of years to project")
    
    # Goals
    goals: List[FinancialGoal] = Field(default_factory=list, description="Financial goals")

class SimulationResult(BaseModel):
    net_worth_by_year: Dict[int, float] = Field(..., description="Year-wise net worth projection")
    cash_runway_months: int = Field(..., description="Months of expenses covered by current bank balance")
    monthly_cash_flow: float = Field(..., description="Net monthly cash flow (income - expenses)")
    total_investments: float = Field(..., description="Total investments at end of projection")
    liquid_cash_end: float = Field(..., description="Liquid cash at end of projection")
    
    # Goal analysis
    goal_feasibility: Dict[str, bool] = Field(..., description="Goal feasibility analysis")
    goal_timeline: Dict[str, int] = Field(..., description="Years needed to achieve each goal")

class AIAdviceRequest(BaseModel):
    user_data: UserFinancialData
    simulation_result: SimulationResult
    specific_concerns: Optional[str] = Field(None, description="User's specific financial concerns")
    journey_id: Optional[int] = Field(None, description="Journey ID to update with advice, if provided")

class AIAdviceResponse(BaseModel):
    general_advice: str = Field(..., description="General financial advice")
    goal_specific_advice: Dict[str, str] = Field(..., description="Advice for each specific goal")
    action_items: List[str] = Field(..., description="Actionable next steps")
    risk_assessment: str = Field(..., description="Risk assessment and warnings") 