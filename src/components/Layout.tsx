import { NavLink, Outlet } from "react-router-dom"
import { Inbox, Upload, Settings } from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext"

const navItems = [
  { to: "/contacts", label: "Bandeja", icon: Inbox },
  { to: "/import", label: "Importar", icon: Upload },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const

export default function Layout() {
  const { settings, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-400">
        Cargando...
      </div>
    )
  }

  const primaryColor = settings?.primary_color ?? "#2563eb"

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-zinc-200 bg-white">
        {/* Logo / app name */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-100">
          {settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt=""
              className="h-8 w-8 rounded object-contain"
            />
          )}
          <span className="text-lg font-semibold text-zinc-900 truncate">
            {settings?.app_name ?? "Sales CRM"}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: primaryColor } : undefined
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Team member selector */}
        <div className="border-t border-zinc-100 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Equipo
          </p>
          <TeamMemberList />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 flex border-t border-zinc-200 bg-white">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive ? "" : "text-zinc-400"
              }`
            }
            style={({ isActive }) =>
              isActive ? { color: primaryColor } : undefined
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function TeamMemberList() {
  const { teamMembers } = useSettings()

  if (teamMembers.length === 0) {
    return <p className="text-xs text-zinc-400">Sin miembros</p>
  }

  return (
    <ul className="space-y-1">
      {teamMembers.map((m) => (
        <li key={m.id} className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600 uppercase"
          >
            {m.name.charAt(0)}
          </span>
          <span className="text-sm text-zinc-700 truncate">{m.name}</span>
        </li>
      ))}
    </ul>
  )
}
