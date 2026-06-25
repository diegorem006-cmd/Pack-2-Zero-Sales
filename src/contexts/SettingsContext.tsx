import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { Settings, SettingsUpdate, TeamMember } from "@/types/database"

interface SettingsContextValue {
  settings: Settings | null
  loading: boolean
  updateSettings: (updates: SettingsUpdate) => Promise<void>
  teamMembers: TeamMember[]
  addTeamMember: (name: string, email: string) => Promise<void>
  removeTeamMember: (id: string) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [settingsRes, teamRes] = await Promise.all([
        supabase.from("settings").select("*").limit(1).single(),
        supabase.from("team_members").select("*").order("name"),
      ])

      if (settingsRes.data) setSettings(settingsRes.data)
      if (teamRes.data) setTeamMembers(teamRes.data)
      setLoading(false)
    }

    load()
  }, [])

  const updateSettings = useCallback(
    async (updates: SettingsUpdate) => {
      if (!settings) throw new Error("Configuracion no cargada")
      const { data, error } = await supabase
        .from("settings")
        .update(updates)
        .eq("id", settings.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      if (data) setSettings(data)
    },
    [settings],
  )

  const addTeamMember = useCallback(async (name: string, email: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .insert({ name, email })
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (data) {
      setTeamMembers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }, [])

  const removeTeamMember = useCallback(async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id)
    if (error) throw new Error(error.message)
    setTeamMembers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return (
    <SettingsContext.Provider
      value={{ settings, loading, updateSettings, teamMembers, addTeamMember, removeTeamMember }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
