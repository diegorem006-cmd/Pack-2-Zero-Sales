import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useSettings } from "@/contexts/SettingsContext"
import { useToast } from "@/components/ui/use-toast"
import type { Contact, ContactUpdate, Message } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeft, Send, Sparkles, MessageSquarePlus, Building2, Zap } from "lucide-react"
import { researchCompanyWithClaude } from "@/lib/claude-api"

const CONTACT_TYPES = ["Productor", "Distribuidor", "Marca nueva", "Consumidor", "Otro"] as const
const PRIORITIES = ["Alta", "Media", "Baja"] as const
const STATUSES = ["Nuevo", "Pendiente", "Contestado"] as const

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { teamMembers } = useSettings()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [contact, setContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const [researchingCompany, setResearchingCompany] = useState(false)

  // Editable form state
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    website: "",
    country: "",
    state: "",
    type: "Otro" as Contact["type"],
    priority: "Media" as Contact["priority"],
    status: "Nuevo" as Contact["status"],
    assigned_to: "" as string,
  })

  // Reply state
  const [replyBody, setReplyBody] = useState("")
  const [replySubject, setReplySubject] = useState("")
  const [replySentBy, setReplySentBy] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  // Receive dialog
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveBody, setReceiveBody] = useState("")
  const [receivingMsg, setReceivingMsg] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      const [contactRes, messagesRes] = await Promise.all([
        supabase.from("contacts").select("*").eq("id", id!).single(),
        supabase.from("messages").select("*").eq("contact_id", id!).order("created_at", { ascending: true }),
      ])

      if (contactRes.data) {
        const c = contactRes.data
        setContact(c)
        setForm({
          first_name: c.first_name,
          last_name: c.last_name || "",
          company_name: c.company_name || "",
          email: c.email,
          website: c.website || "",
          country: c.country || "",
          state: c.state || "",
          type: c.type,
          priority: c.priority,
          status: c.status,
          assigned_to: c.assigned_to || "",
        })

        // Investigate company if provided
        if (c.company_name) {
          const { settings } = useSettings()
          if (settings?.llm_api_key) {
            setResearchingCompany(true)
            try {
              const research = await researchCompanyWithClaude(c.company_name, c.email, settings.llm_api_key)
              setCompanyInfo(research)
            } catch (err) {
              console.warn("Company research failed:", err)
            } finally {
              setResearchingCompany(false)
            }
          }
        }
      }
      if (messagesRes.data) setMessages(messagesRes.data)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSave() {
    if (!contact) return
    setSaving(true)
    const updates: ContactUpdate = {
      first_name: form.first_name,
      last_name: form.last_name || null,
      company_name: form.company_name || null,
      email: form.email,
      website: form.website || null,
      country: form.country || null,
      state: form.state || null,
      type: form.type,
      priority: form.priority,
      status: form.status,
      assigned_to: form.assigned_to || null,
    }
    const { error } = await supabase.from("contacts").update(updates).eq("id", contact.id)
    setSaving(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el contacto.", variant: "destructive" })
    } else {
      setContact({ ...contact, ...updates } as Contact)
      toast({ title: "Guardado", description: "Contacto actualizado correctamente." })
    }
  }

  async function handleSendReply() {
    if (!contact || !replyBody.trim()) return
    setSendingReply(true)
    const { data, error } = await supabase
      .from("messages")
      .insert({
        contact_id: contact.id,
        direction: "enviado" as const,
        body: replyBody.trim(),
        subject: replySubject.trim() || null,
        sent_by: replySentBy || null,
        channel: "email" as const,
      })
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data])
      setReplyBody("")
      setReplySubject("")
      // Update status to Contestado
      await supabase.from("contacts").update({ status: "Contestado" as const }).eq("id", contact.id)
      setForm((prev) => ({ ...prev, status: "Contestado" }))
      setContact((prev) => prev ? { ...prev, status: "Contestado" } : prev)
      toast({ title: "Enviado", description: "Mensaje registrado." })
    } else {
      toast({ title: "Error", description: "No se pudo enviar el mensaje.", variant: "destructive" })
    }
    setSendingReply(false)
  }

  async function handleReceiveMessage() {
    if (!contact || !receiveBody.trim()) return
    setReceivingMsg(true)
    const { data, error } = await supabase
      .from("messages")
      .insert({
        contact_id: contact.id,
        direction: "recibido" as const,
        body: receiveBody.trim(),
        channel: "email" as const,
      })
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data])
      setReceiveBody("")
      setReceiveOpen(false)
      await supabase.from("contacts").update({ status: "Pendiente" as const }).eq("id", contact.id)
      setForm((prev) => ({ ...prev, status: "Pendiente" }))
      setContact((prev) => prev ? { ...prev, status: "Pendiente" } : prev)
      toast({ title: "Registrado", description: "Mensaje recibido registrado." })
    } else {
      toast({ title: "Error", description: "No se pudo registrar el mensaje.", variant: "destructive" })
    }
    setReceivingMsg(false)
  }

  // Build team member name map for messages
  const memberMap = new Map(teamMembers.map((m) => [m.id, m.name]))

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando...</div>
  }

  if (!contact) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Contacto no encontrado.</div>
  }

  const extraEntries = contact.extra && typeof contact.extra === "object" && !Array.isArray(contact.extra)
    ? Object.entries(contact.extra as Record<string, unknown>)
    : []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/contacts")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a contactos
      </Button>

      {/* Company Research Card */}
      {contact?.company_name && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Investigación de Empresa</CardTitle>
              {researchingCompany && <span className="text-xs text-blue-600 ml-auto">Investigando...</span>}
            </div>
          </CardHeader>
          <CardContent>
            {companyInfo ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Industria</p>
                  <p className="text-sm font-semibold text-blue-900">{companyInfo.industry}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tamaño</p>
                  <p className="text-sm font-semibold text-blue-900">{companyInfo.size}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Descripción</p>
                  <p className="text-sm text-blue-900">{companyInfo.description}</p>
                </div>
                {companyInfo.keyInsights?.length > 0 && (
                  <div className="col-span-2 md:col-span-4 pt-2 border-t border-blue-200">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Insights clave</p>
                    <ul className="text-sm space-y-1">
                      {companyInfo.keyInsights.slice(0, 3).map((insight: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <Zap className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-900">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : researchingCompany ? (
              <p className="text-sm text-muted-foreground">Investigando información de {contact.company_name}...</p>
            ) : (
              <p className="text-sm text-muted-foreground">No se pudo obtener información adicional</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: contact info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Información del contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nombre" value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
            <Field label="Apellido" value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
            <Field label="Empresa" value={form.company_name} onChange={(v) => setForm((f) => ({ ...f, company_name: v }))} />
            <Field label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
            <Field label="Sitio web" value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
            <Field label="País" value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} />
            <Field label="Estado/Región" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as Contact["type"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prioridad</label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Contact["priority"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Contact["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Asignado a</label>
              <Select value={form.assigned_to} onValueChange={(v) => setForm((f) => ({ ...f, assigned_to: v }))}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {teamMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {extraEntries.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Datos adicionales</p>
                  {extraEntries.map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-right max-w-[60%] truncate">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        {/* Right: conversation */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Conversación</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 h-[400px] lg:h-[500px] pr-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No hay mensajes aún.</p>
                )}
                {messages.map((msg) => {
                  const isIncoming = msg.direction === "recibido"
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 space-y-1 ${
                          isIncoming
                            ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                            : "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={isIncoming ? "secondary" : "default"} className="text-[10px] px-1.5 py-0">
                            {isIncoming ? "Recibido" : "Enviado"}
                          </Badge>
                          {msg.subject && (
                            <span className="text-xs font-medium truncate">{msg.subject}</span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(msg.created_at).toLocaleString("es-MX")}</span>
                          {!isIncoming && msg.sent_by && (
                            <span>- {memberMap.get(msg.sent_by) || "Desconocido"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Reply box */}
            <div className="space-y-3">
              <Input
                placeholder="Asunto (opcional)"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
              />
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={3}
              />
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Enviado por:</span>
                  <Select value={replySentBy} onValueChange={setReplySentBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast({ title: "IA", description: "Función de IA próximamente" })}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Redactar con IA
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReceiveOpen(true)}
                  >
                    <MessageSquarePlus className="h-4 w-4 mr-1" />
                    Registrar recibido
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyBody.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receive message dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar mensaje recibido</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Pega aquí el mensaje recibido..."
            value={receiveBody}
            onChange={(e) => setReceiveBody(e.target.value)}
            rows={6}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>Cancelar</Button>
            <Button onClick={handleReceiveMessage} disabled={receivingMsg || !receiveBody.trim()}>
              {receivingMsg ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
