import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useSettings } from "@/contexts/SettingsContext"
import type { Contact } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Users, Clock, CheckCircle2, Inbox, MessageCircle } from "lucide-react"

const PRIORITY_ORDER: Record<Contact["priority"], number> = { Alta: 0, Media: 1, Baja: 2 }
const STATUS_ORDER: Record<Contact["status"], number> = { Nuevo: 0, Pendiente: 1, Contestado: 2 }

export default function ContactsPage() {
  const navigate = useNavigate()
  const { teamMembers } = useSettings()

  const [contacts, setContacts] = useState<(Contact & { first_message?: string; member_name?: string; message_count?: number; last_message_date?: string })[]>([])
  const [counts, setCounts] = useState({ nuevo: 0, pendiente: 0, contestado: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [countryFilter, setCountryFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function load() {
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false })

      if (!contactsData) {
        setLoading(false)
        return
      }

      // Fetch messages for each contact
      const contactIds = contactsData.map((c) => c.id)
      const { data: messagesData } = await supabase
        .from("messages")
        .select("contact_id, body, created_at")
        .in("contact_id", contactIds)
        .order("created_at", { ascending: true })

      const firstMessageMap = new Map<string, string>()
      const messageCountMap = new Map<string, number>()
      const lastMessageDateMap = new Map<string, string>()

      if (messagesData) {
        for (const msg of messagesData) {
          if (!firstMessageMap.has(msg.contact_id)) {
            firstMessageMap.set(msg.contact_id, msg.body)
          }
          messageCountMap.set(msg.contact_id, (messageCountMap.get(msg.contact_id) ?? 0) + 1)
          lastMessageDateMap.set(msg.contact_id, msg.created_at)
        }
      }

      // Build team member name map
      const memberMap = new Map<string, string>()
      for (const tm of teamMembers) {
        memberMap.set(tm.id, tm.name)
      }

      const enriched = contactsData.map((c) => ({
        ...c,
        first_message: firstMessageMap.get(c.id),
        member_name: c.assigned_to ? memberMap.get(c.assigned_to) : undefined,
        message_count: messageCountMap.get(c.id) ?? 0,
        last_message_date: lastMessageDateMap.get(c.id),
      }))

      setContacts(enriched)
      setCounts({
        nuevo: contactsData.filter((c) => c.status === "Nuevo").length,
        pendiente: contactsData.filter((c) => c.status === "Pendiente").length,
        contestado: contactsData.filter((c) => c.status === "Contestado").length,
        total: contactsData.length,
      })
      setLoading(false)
    }

    load()
  }, [teamMembers])

  const filtered = useMemo(() => {
    let result = contacts

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (priorityFilter !== "all") {
      result = result.filter((c) => c.priority === priorityFilter)
    }
    if (typeFilter !== "all") {
      result = result.filter((c) => c.type === typeFilter)
    }
    if (countryFilter.trim()) {
      const q = countryFilter.toLowerCase()
      result = result.filter((c) => c.country?.toLowerCase().includes(q))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.first_name.toLowerCase().includes(q) ||
          (c.last_name?.toLowerCase().includes(q)) ||
          (c.company_name?.toLowerCase().includes(q)) ||
          c.email.toLowerCase().includes(q),
      )
    }

    // Sort: priority first, then status within same priority
    result = [...result].sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (pDiff !== 0) return pDiff
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    })

    return result
  }, [contacts, statusFilter, priorityFilter, typeFilter, countryFilter, searchQuery])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando contactos...</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Counter cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos</CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts.nuevo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{counts.pendiente}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contestados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.contestado}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Nuevo">Nuevo</SelectItem>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Contestado">Contestado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Media">Media</SelectItem>
            <SelectItem value="Baja">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="Productor">Productor</SelectItem>
            <SelectItem value="Distribuidor">Distribuidor</SelectItem>
            <SelectItem value="Marca nueva">Marca nueva</SelectItem>
            <SelectItem value="Consumidor">Consumidor</SelectItem>
            <SelectItem value="Otro">Otro</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="País"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="w-[140px]"
        />

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre, empresa o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Contact list */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No se encontraron contactos.</p>
          )}
          {filtered.map((contact) => (
            <Card
              key={contact.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/contacts/${contact.id}`)}
            >
              <CardContent className="py-4 px-5 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">
                      {contact.company_name || "Sin empresa"}
                    </span>
                    <StatusDot status={contact.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.first_name} {contact.last_name || ""} • {contact.email}
                  </p>
                  {contact.first_message && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                      {contact.first_message.length > 80
                        ? contact.first_message.slice(0, 80) + "..."
                        : contact.first_message}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {contact.message_count ?? 0} mensaje{(contact.message_count ?? 0) !== 1 ? "s" : ""}
                    </span>
                    {contact.last_message_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(contact.last_message_date)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-start sm:justify-end">
                  <Badge variant={contact.priority.toLowerCase() as "alta" | "media" | "baja"}>
                    {contact.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {contact.type}
                  </Badge>
                  {contact.country && (
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-gray-100 rounded">
                      {contact.country}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {contact.member_name || "Sin asignar"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function StatusDot({ status }: { status: Contact["status"] }) {
  const colors: Record<Contact["status"], string> = {
    Nuevo: "bg-blue-500",
    Pendiente: "bg-amber-500",
    Contestado: "bg-green-500",
  }
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${colors[status]}`}
      title={status}
    />
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
}
