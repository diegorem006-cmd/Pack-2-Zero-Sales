import { createContext, useContext, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { supabase } from "@/lib/supabase"

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)

  const login = useCallback(async (password: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("settings")
      .select("access_password_hash")
      .limit(1)
      .single()

    if (error || !data) return false

    // Plain compare for v1 — should hash in production
    if (data.access_password_hash === password) {
      sessionStorage.setItem("authenticated", "true")
      setIsAuthenticated(true)
      return true
    }

    return false
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
  return <>{children}</>
}
