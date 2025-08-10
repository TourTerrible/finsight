from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, create_tables, User
from services.database_service import DatabaseService
from models.financial_data import UserFinancialData, SimulationResult, AIAdviceResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from routers.auth import get_current_user_required
from routers.ai_advice import ai_service  # Import the AI advice service

router = APIRouter(prefix="/api/v1/journey", tags=["journey"])

# Initialize database tables
create_tables()

class JourneyResponse(BaseModel):
    id: int
    created_at: datetime
    currency: str
    current_bank_balance: float
    monthly_cash_flow: float
    total_investments: float
    cash_runway_months: int
    projection_years: int
    
class JourneyDetailResponse(BaseModel):
    id: int
    created_at: datetime
    user_email: str
    
    # Input data
    current_bank_balance: float
    monthly_income: Optional[float]
    monthly_expenses: float
    monthly_sip: float
    other_investments: float
    currency: str
    age: int
    marital_status: str
    dependents: int
    annual_return_rate: float
    projection_years: int
    goals: List[dict]
    
    # Results
    net_worth_by_year: dict
    cash_runway_months: int
    monthly_cash_flow: float
    total_investments: float
    liquid_cash_end: float
    goal_feasibility: dict
    goal_timeline: dict
    
    # AI Advice
    ai_general_advice: Optional[str]
    ai_action_items: Optional[List[str]]
    ai_risk_assessment: Optional[str]
    ai_goal_specific_advice: Optional[dict]

class SaveJourneyRequest(BaseModel):
    user_data: UserFinancialData
    simulation_result: SimulationResult
    ai_advice: Optional[AIAdviceResponse] = None
    journey_id: Optional[int] = None  # journey_id is Optional[int]

class UserStatsResponse(BaseModel):
    total_journeys: int
    member_since: str
    last_journey: Optional[str]
    primary_currency: Optional[str]

@router.post("/save", response_model=dict)
async def save_journey(request: SaveJourneyRequest, db: Session = Depends(get_db)):
    """Save or update a financial journey to the database, always updating AI advice."""
    try:
        # If the request contains a journey_id, update the existing journey
        if request.journey_id is not None:
            # Re-generate AI advice for the updated data
            advice = ai_service.generate_advice(
                request.user_data,
                request.simulation_result
            )
            # Update the journey with new simulation and AI advice
            updated_journey = DatabaseService.update_financial_journey(
                db,
                journey_id=request.journey_id,
                user_email=request.user_data.email,
                simulation_result=request.simulation_result,
                ai_advice=advice
            )
            return {
                "success": True,
                "journey_id": updated_journey.id if updated_journey else None,
                "message": "Journey updated successfully"
            }
        else:
            # Create a new journey (generate AI advice if not provided)
            advice = request.ai_advice
            if advice is None:
                advice = ai_service.generate_advice(
                    request.user_data,
                    request.simulation_result
                )
            journey = DatabaseService.create_financial_journey(
                db, request.user_data, request.simulation_result, advice
            )
            return {
                "success": True,
                "journey_id": journey.id,
                "message": "Journey saved successfully"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save journey: {str(e)}")

@router.get("/user/{email}/journeys", response_model=List[JourneyResponse])
async def get_user_journeys(email: str, limit: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_required)):
    """Get user's journey history."""
    # Verify user can only access their own journeys
    if current_user.email != email:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        journeys = DatabaseService.get_user_journeys(db, email, limit)
        return [
            JourneyResponse(
                id=journey.id,
                created_at=journey.created_at,
                currency=journey.currency.value if hasattr(journey.currency, 'value') else str(journey.currency),
                current_bank_balance=journey.current_bank_balance,
                monthly_cash_flow=journey.monthly_cash_flow,
                total_investments=journey.total_investments,
                cash_runway_months=journey.cash_runway_months,
                projection_years=journey.projection_years
            )
            for journey in journeys
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get journeys: {str(e)}")

@router.get("/user/{email}/stats", response_model=UserStatsResponse)
async def get_user_stats(email: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_required)):
    """Get user statistics."""
    # Verify user can only access their own stats
    if current_user.email != email:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        stats = DatabaseService.get_user_stats(db, email)
        if not stats:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserStatsResponse(**stats)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")

@router.get("/detail/{journey_id}", response_model=JourneyDetailResponse)
async def get_journey_detail(journey_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_required)):
    """Get detailed journey information."""
    try:
        journey = DatabaseService.get_journey_by_id(db, journey_id, current_user.email)
        if journey is None:
            raise HTTPException(status_code=404, detail="Journey not found")
        
        return JourneyDetailResponse(
            id=journey.id,
            created_at=journey.created_at,
            user_email=journey.user.email,
            current_bank_balance=journey.current_bank_balance,
            monthly_income=journey.monthly_income,
            monthly_expenses=journey.monthly_expenses,
            monthly_sip=0,  # Legacy field, set to 0
            other_investments=journey.other_investments,
            currency=journey.currency.value if hasattr(journey.currency, 'value') else str(journey.currency),
            age=journey.age,
            marital_status=journey.marital_status.value if hasattr(journey.marital_status, 'value') else str(journey.marital_status),
            dependents=journey.dependents,
            annual_return_rate=8.0,  # Legacy field, set to default
            projection_years=journey.projection_years,
            goals=journey.goals or [],
            net_worth_by_year=journey.net_worth_by_year or {},
            cash_runway_months=journey.cash_runway_months,
            monthly_cash_flow=journey.monthly_cash_flow,
            total_investments=journey.total_investments,
            liquid_cash_end=journey.liquid_cash_end,
            goal_feasibility=journey.goal_feasibility or {},
            goal_timeline=journey.goal_timeline or {},
            ai_general_advice=journey.ai_general_advice,
            ai_action_items=journey.ai_action_items,
            ai_risk_assessment=journey.ai_risk_assessment,
            ai_goal_specific_advice=journey.ai_goal_specific_advice
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get journey detail: {str(e)}") 