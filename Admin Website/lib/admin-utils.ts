// Admin utilities for permission checks and common admin operations

// Check if the current user is an admin
export function isAdmin(): boolean {
  // Only run in browser environment
  if (typeof window === 'undefined') return false
  
  try {
    const userInfo = localStorage.getItem("userInfo")
    if (!userInfo) return false
    
    const user = JSON.parse(userInfo)
    return user.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Verify admin role and return user data, or throw error if not admin
export function requireAdmin() {
  if (typeof window === 'undefined') 
    throw new Error("Authentication can only be checked in browser environment")
  
  try {
    const userInfo = localStorage.getItem("userInfo")
    const token = localStorage.getItem("token")
    
    if (!userInfo || !token) 
      throw new Error("Not authenticated")
    
    const user = JSON.parse(userInfo)
    
    if (user.role !== "admin")
      throw new Error("Access denied. Admin privileges required.")
    
    return user
  } catch (error) {
    console.error("Admin verification error:", error)
    throw new Error("Authentication failed. Please log in again.")
  }
}

// Helper to check permissions before performing admin actions
export async function withAdminCheck<T>(callback: () => Promise<T>): Promise<T> {
  // Verify admin status before proceeding
  requireAdmin()
  
  try {
    return await callback()
  } catch (error: any) {
    // Special handling for 403 errors
    if (error.message?.includes("Permission denied") || error.status === 403) {
      throw new Error("Admin permission required for this action")
    }
    throw error
  }
} 