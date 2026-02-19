// Interface for creating a new user with required fields and specific types
export interface CreateNewUser {
  firstName: string
  lastName: string
  username: string // Must be unique
  email: string // Must be valid email format
  password: string // Should meet password requirements
  pin: string // Numeric PIN code
  user_role: 'bar-staff' | 'bar-manager' | 'admin' // Restricted to these roles only
  full_name: string // Combination of first and last name
  bio: string // Optional user biography
  avatar_url: string // URL to user's avatar image
}

// Interface for editing an existing user
// Allows partial updates of CreateNewUser fields
export interface EditUser { 
  id: string, // Unique identifier for the user
  data: Partial<CreateNewUser> // Partial allows optional updates
}

// Interface for deleting a user
export interface DeleteUser {
  id: string // Numeric ID of user to delete
}
