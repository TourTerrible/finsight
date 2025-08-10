import os
from typing import Optional

try:
    from google.cloud import secretmanager
    SECRET_MANAGER_AVAILABLE = True
except ImportError:
    SECRET_MANAGER_AVAILABLE = False

def get_secret(secret_name: str, default: Optional[str] = None) -> str:
    """
    Get secret from Google Secret Manager or fallback to environment variables.
    
    Args:
        secret_name: Name of the secret to retrieve
        default: Default value if secret is not found
        
    Returns:
        Secret value as string
    """
    # Try Google Secret Manager first
    if SECRET_MANAGER_AVAILABLE and os.getenv('GOOGLE_CLIENT_PROJECT_ID'):
        try:
            client = secretmanager.SecretManagerServiceClient()
            project_id = os.getenv('GOOGLE_CLIENT_PROJECT_ID')
            name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
            
            response = client.access_secret_version(request={"name": name})
            secret_value = response.payload.data.decode("UTF-8")
            
            if secret_value:
                return secret_value
        except Exception as e:
            print(f"Warning: Could not fetch secret '{secret_name}' from Secret Manager: {e}")
    
    # Fallback to environment variables
    env_value = os.getenv(secret_name)
    if env_value:
        return env_value
    
    # Return default if provided
    if default is not None:
        return default
    
    # Raise error if no value found
    raise ValueError(f"Secret '{secret_name}' not found in Secret Manager or environment variables")

def get_required_secret(secret_name: str) -> str:
    """
    Get a required secret (will raise error if not found).
    
    Args:
        secret_name: Name of the secret to retrieve
        
    Returns:
        Secret value as string
        
    Raises:
        ValueError: If secret is not found
    """
    return get_secret(secret_name)

def get_optional_secret(secret_name: str, default: str = "") -> str:
    """
    Get an optional secret with a default value.
    
    Args:
        secret_name: Name of the secret to retrieve
        default: Default value if secret is not found
        
    Returns:
        Secret value as string or default
    """
    try:
        return get_secret(secret_name, default)
    except ValueError:
        return default 