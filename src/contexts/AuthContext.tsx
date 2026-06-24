import { createContext, useContext, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { logToAgent } from "@/lib/agent-client"

interface AuthContextValue {
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem("authenticated") === "true",
  )

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("access_password_hash")
        .limit(1)
        .single()

      if (error || !data) {
        await logToAgent("warn", "Login failed: settings not found")
        return false
      }

      // Plain compare for v1 — should hash in production
      if (data.access_password_hash === password) {
        sessionStorage.setItem("authenticated", "true")
        setIsAuthenticated(true)
        await logToAgent("info", "User authenticated successfully")
        return true
      }

      await logToAgent("warn", "Login failed: invalid password")
      return false
    } catch (err) {
      await logToAgent(
        "error",
        `Login error: ${err instanceof Error ? err.message : String(err)}`
      )
      return false
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem("authenticated")
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
