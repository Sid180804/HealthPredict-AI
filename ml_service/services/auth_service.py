"""
Authentication Service
Handles user registration, login, and profile management.
Currently uses in-memory storage, but structured to easily replace with database.
"""

# Temporary in-memory storage
# In production, this would be replaced with a database (PostgreSQL, MongoDB, etc.)
users_db = {}
sessions_db = {}

def register_user(user_data):
    """
    Register a new user with complete profile information.
    
    Args:
        user_data: Dictionary containing user registration data
        
    Returns:
        dict: User object or error message
    """
    try:
        email = user_data.get("email", "").lower().strip()
        
        if not email or not user_data.get("password"):
            return {"error": "Email and password are required"}
        
        # Check if user already exists
        if email in users_db:
            print(f"User {email} already exists in database")
            return {"error": "User already exists with this email. Please try logging in instead."}
        
        # Handle None values for optional fields
        age = user_data.get("age")
        if age == "" or age is None:
            age = None
        else:
            try:
                if isinstance(age, str):
                    age = int(age) if age.strip() else None
                else:
                    age = int(age) if age else None
            except (ValueError, TypeError):
                age = None
        
        height = user_data.get("height")
        if height == "" or height is None:
            height = None
        else:
            try:
                if isinstance(height, str):
                    height = float(height) if height.strip() else None
                else:
                    height = float(height) if height else None
            except (ValueError, TypeError):
                height = None
        
        weight = user_data.get("weight")
        if weight == "" or weight is None:
            weight = None
        else:
            try:
                if isinstance(weight, str):
                    weight = float(weight) if weight.strip() else None
                else:
                    weight = float(weight) if weight else None
            except (ValueError, TypeError):
                weight = None
        
        # Ensure allergies and conditions are lists
        allergies = user_data.get("allergies", [])
        if not isinstance(allergies, list):
            allergies = []
        
        existing_conditions = user_data.get("existing_conditions", [])
        if not isinstance(existing_conditions, list):
            existing_conditions = []
        
        # Create user profile
        role = user_data.get("role", "patient")
        if role not in ("patient", "doctor", "admin"):
            role = "patient"

        user = {
            "id": len(users_db) + 1,
            "email": email,
            "password": user_data.get("password"),  # In production, hash this
            "full_name": user_data.get("full_name", ""),
            "age": age,
            "gender": user_data.get("gender", ""),
            "height": height,
            "weight": weight,
            "allergies": allergies,
            "existing_conditions": existing_conditions,
            "is_smoker": bool(user_data.get("is_smoker", False)),
            "is_alcohol": bool(user_data.get("is_alcohol", False)),
            "city": user_data.get("city", ""),
            "role": role,
            "created_at": "2024-01-01"
        }
        
        users_db[email] = user
        print(f"User stored in database. Total users: {len(users_db)}")
        
        # Remove password from response
        user_response = {k: v for k, v in user.items() if k != "password"}
        return {"user": user_response, "message": "Registration successful"}
    except Exception as e:
        return {"error": f"Registration error: {str(e)}"}


def login_user(email, password):
    """
    Authenticate user and create session.
    
    Args:
        email: User email
        password: User password
        
    Returns:
        dict: Session token and user data or error
    """
    try:
        email = email.lower().strip()
        
        if not email or not password:
            return {"error": "Email and password are required"}
        
        if email not in users_db:
            return {"error": "Invalid email or password"}
        
        user = users_db[email]
        
        if user["password"] != password:  # In production, verify hashed password
            return {"error": "Invalid email or password"}
        
        # Generate simple session token (in production, use JWT)
        import uuid
        session_token = str(uuid.uuid4())
        sessions_db[session_token] = email
        
        # Remove password from response
        user_response = {k: v for k, v in user.items() if k != "password"}
        
        return {
            "token": session_token,
            "user": user_response
        }
    except Exception as e:
        return {"error": f"Login error: {str(e)}"}


def get_user_by_token(token):
    """
    Get user information from session token.
    
    Args:
        token: Session token
        
    Returns:
        dict: User data or None
    """
    if token not in sessions_db:
        return None
    
    email = sessions_db[token]
    if email not in users_db:
        return None
    
    user = users_db[email]
    return {k: v for k, v in user.items() if k != "password"}


def logout_user(token):
    """
    Invalidate session token.
    
    Args:
        token: Session token
        
    Returns:
        dict: Success message
    """
    if token in sessions_db:
        del sessions_db[token]
    return {"message": "Logged out successfully"}


def update_user_profile(token, profile_data):
    """
    Update user profile information.
    
    Args:
        token: Session token
        profile_data: Dictionary with fields to update
        
    Returns:
        dict: Updated user data or error
    """
    user = get_user_by_token(token)
    if not user:
        return {"error": "Invalid session"}
    
    email = user["email"]
    user_obj = users_db[email]
    
    # Update allowed fields
    allowed_fields = ["full_name", "age", "gender", "height", "weight", 
                     "allergies", "existing_conditions", "is_smoker", 
                     "is_alcohol", "city"]
    
    for field in allowed_fields:
        if field in profile_data:
            user_obj[field] = profile_data[field]
    
    users_db[email] = user_obj
    updated_user = {k: v for k, v in user_obj.items() if k != "password"}
    
    return {"user": updated_user, "message": "Profile updated successfully"}
