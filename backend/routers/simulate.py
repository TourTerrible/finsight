from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.financial_data import UserFinancialData, SimulationResult
from services.simulation_logic import FinancialSimulator
from services.database_service import DatabaseService
from database import get_db

router = APIRouter()

@router.post("/simulate", response_model=dict)
async def simulate_financial_projection(user_data: UserFinancialData, db: Session = Depends(get_db)):
    """
    Simulate financial projection based on user's financial data.
    
    This endpoint:
    1. Validates user's financial data
    2. Runs the financial simulation
    3. Automatically saves the journey to the database
    4. Returns the simulation results and journey_id
    """
    try:
        # Initialize the simulator
        simulator = FinancialSimulator()
        
        # Run the simulation
        result = simulator.simulate_financial_projection(user_data)
        
        # Save the journey to database (without AI advice for now)
        try:
            journey = DatabaseService.create_financial_journey(db, user_data, result, ai_advice=None)
            print(f"DEBUG: Journey saved for user {user_data.email}")
        except Exception as db_error:
            # Log the error but don't fail the simulation
            print(f"WARNING: Failed to save journey to database: {db_error}")
            journey = None
        
        return {
            "result": result,
            "journey_id": journey.id if journey else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.post("/goals/suggestions")
async def get_goal_suggestions(user_data: UserFinancialData):
    """
    Get suggested financial goals based on user's financial profile.
    """
    try:
        suggestions = simulator.get_goal_suggestions(user_data)
        return {
            "suggestions": suggestions,
            "message": f"Generated {len(suggestions)} goal suggestions based on your profile"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@router.get("/goals/defaults")
async def get_default_goals():
    """
    Get default goal amounts for different goal types.
    """
    return {
        "default_goals": {
            "buy_car": {
                "amount": 800000,
                "description": "Buy a car",
                "typical_timeline": "3-5 years"
            },
            "buy_house": {
                "amount": 5000000,
                "description": "Buy a house",
                "typical_timeline": "8-15 years"
            },
            "retire_early": {
                "amount": 25000000,
                "description": "Retire early",
                "typical_timeline": "15-25 years"
            },
            "annual_trips": {
                "amount": 100000,
                "description": "Annual vacation fund",
                "typical_timeline": "1-2 years"
            }
        }
    }

@router.post("/cash-runway")
async def calculate_cash_runway(user_data: UserFinancialData):
    """
    Calculate cash runway (how long user can survive without income).
    """
    try:
        cash_runway_months = simulator._calculate_cash_runway(user_data)
        monthly_cash_flow = simulator._calculate_monthly_cash_flow(user_data)
        
        return {
            "cash_runway_months": cash_runway_months,
            "cash_runway_years": round(cash_runway_months / 12, 1),
            "monthly_cash_flow": monthly_cash_flow,
            "emergency_fund_status": "Good" if cash_runway_months >= 6 else "Needs improvement",
            "recommendation": f"Try to maintain at least 6 months of expenses ({user_data.monthly_expenses * 6:,.0f}) as emergency fund"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}") 

@router.get("/simulate/health")
async def simulation_health():
    """Health check for simulation service."""
    return {"status": "healthy", "service": "financial_simulation"} 