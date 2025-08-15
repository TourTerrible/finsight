// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth endpoints
  GOOGLE_CLIENT_ID: `${API_BASE_URL}/api/v1/auth/google-client-id`,
  AUTH_ME: `${API_BASE_URL}/api/v1/auth/me`,
  AUTH_GOOGLE: `${API_BASE_URL}/api/v1/auth/google`,
  
  // Simulation endpoints
  SIMULATE: `${API_BASE_URL}/api/v1/simulate`,
  
  // Journey endpoints
  JOURNEY_DETAIL: (journeyId: string | number) => `${API_BASE_URL}/api/v1/journey/detail/${journeyId}`,
  JOURNEY_USER_JOURNEYS: (userEmail: string) => `${API_BASE_URL}/api/v1/journey/user/${encodeURIComponent(userEmail)}/journeys`,
  JOURNEY_USER_STATS: (userEmail: string) => `${API_BASE_URL}/api/v1/journey/user/${encodeURIComponent(userEmail)}/stats`,
  
  // AI Advice endpoints
  ADVICE: `${API_BASE_URL}/api/v1/advice`,
};

export default API_ENDPOINTS; 