import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useSettings } from "@/contexts/SettingsContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  Palette,
  Mail,
  Bot,
  Users,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  UserPlus,
  Save,
  Upload,
} from "lucide-react"

export default function SettingsPage() {
  const { settings, updateSettings, teamMembers, addTeamMember, removeTeamMember, loading } =
    useSettings()

  // Branding state
  const [appName, setAppName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#000000")
  const [accentColor, setAccentColor] = useState("#000000")
  const [companyDescription, setCompanyDescription] = useState("")
  const [brandingInitialized, setBrandingInitialized] = useState(false)

  // Email state
  const [senderName, setSenderName] = useState("")
  const [senderEmail, setSenderEmail] = useState("")
  const [resendApiKey, setResendApiKey] = useState("")
  const [showResendKey, setShowResendKey] = useState(false)
  const [emailInitialized, setEmailInitialized] = useState(false)

  // AI state
  const [llmProvider, setLlmProvider] = useState<"openai" | "anthropic">("openai")
  const [llmApiKey, setLlmApiKey] = useState("")
  const [showLlmKey, setShowLlmKey] = useState(false)
  const [aiInitialized, setAiInitialized] = useState(false)

  // Team state
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")

  // Security state
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Saving states
  const [savingBranding, setSavingBranding] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingAi, setSavingAi] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [addingMember, setAddingMember] = useState(false)

  // Initialize form values from settings (once loaded)
  if (settings && !brandingInitialized) {
    setAppName(settings.app_name)
    setLogoUrl(settings.logo_url ?? "")
    setPrimaryColor(settings.primary_color)
    setAccentColor(settings.accent_color)
    setCompanyDescription(settings.company_description)
    setBrandingInitialized(true)
  }
  if (settings && !emailInitialized) {
    setSenderName(settings.sender_name)
    setSenderEmail(settings.sender_email)
    setResendApiKey(settings.resend_api_key ?? "")
    setEmailInitialized(true)
  }
  if (settings && !aiInitialized) {
    setLlmProvider(settings.llm_provider)
    setLlmApiKey(settings.llm_api_key ?? "")
    setAiInitialized(true)
  }

  function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // TODO: Replace with Supabase storage upload
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function saveBranding(e: FormEvent) {
    e.preventDefault()
    setSavingBranding(true)
    try {
      await updateSettings({
        app_name: appName,
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        accent_color: accentColor,
        company_description: companyDescription,
      })
      toast({ title: "Marca actualizada", description: "Los cambios se guardaron correctamente." })
    } catch {
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" })
    } finally {
      setSavingBranding(false)
    }
  }

  async function saveEmail(e: FormEvent) {
    e.preventDefault()
    setSavingEmail(true)
    try {
      await updateSettings({
        sender_name: senderName,
        sender_email: senderEmail,
        resend_api_key: resendApiKey || null,
      })
      toast({ title: "Correo actualizado", description: "Los cambios se guardaron correctamente." })
    } catch {
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" })
    } finally {
      setSavingEmail(false)
    }
  }

  async function saveAi(e: FormEvent) {
    e.preventDefault()
    setSavingAi(true)
    try {
      await updateSettings({
        llm_provider: llmProvider,
        llm_api_key: llmApiKey || null,
      })
      toast({ title: "IA actualizada", description: "Los cambios se guardaron correctamente." })
    } catch {
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" })
    } finally {
      setSavingAi(false)
    }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault()
    if (!newMemberName.trim() || !newMemberEmail.trim()) return
    setAddingMember(true)
    try {
      await addTeamMember(newMemberName.trim(), newMemberEmail.trim())
      setNewMemberName("")
      setNewMemberEmail("")
      toast({ title: "Miembro agregado", description: "El miembro del equipo fue agregado." })
    } catch {
      toast({ title: "Error", description: "No se pudo agregar el miembro.", variant: "destructive" })
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(id: string) {
    try {
      await removeTeamMember(id)
      toast({ title: "Miembro eliminado", description: "El miembro fue removido del equipo." })
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el miembro.", variant: "destructive" })
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    if (!newPassword) return
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contrasenas no coinciden.", variant: "destructive" })
      return
    }
    setSavingSecurity(true)
    try {
      // Hash the password before storing. Using a simple approach here;
      // in production you'd use bcrypt or similar server-side.
      const encoder = new TextEncoder()
      const data = encoder.encode(newPassword)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

      await updateSettings({ access_password_hash: hashHex })
      setNewPassword("")
      setConfirmPassword("")
      toast({ title: "Contrasena actualizada", description: "La contrasena de acceso fue cambiada." })
    } catch {
      toast({ title: "Error", description: "No se pudo cambiar la contrasena.", variant: "destructive" })
    } finally {
      setSavingSecurity(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Cargando configuracion...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">Administra las preferencias de tu aplicacion.</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding" className="gap-1.5">
            <Palette className="h-4 w-4" />
            Marca
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-4 w-4" />
            Correo
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5">
            <Bot className="h-4 w-4" />
            IA
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Branding */}
        <TabsContent value="branding">
          <form onSubmit={saveBranding}>
            <Card>
              <CardHeader>
                <CardTitle>Marca</CardTitle>
                <CardDescription>
                  Personaliza la apariencia y la identidad de tu aplicacion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Nombre de la aplicacion</Label>
                  <Input
                    id="app-name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Pack 2 Zero Ventas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  <div className="flex items-center gap-4">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-12 w-12 rounded-md border object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <Upload className="h-4 w-4" />
                        Subir logo
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Color primario</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded border"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Color de acento</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="accent-color"
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded border"
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-desc">Descripcion de la empresa</Label>
                  <Textarea
                    id="company-desc"
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe brevemente tu empresa..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingBranding}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingBranding ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Tab 2: Email */}
        <TabsContent value="email">
          <form onSubmit={saveEmail}>
            <Card>
              <CardHeader>
                <CardTitle>Correo</CardTitle>
                <CardDescription>
                  Configura los datos del remitente y la API de envio de correos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Nombre del remitente</Label>
                  <Input
                    id="sender-name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Tu Empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender-email">Email del remitente</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="ventas@tuempresa.com"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="resend-key">API Key de Resend</Label>
                  <div className="flex gap-2">
                    <Input
                      id="resend-key"
                      type={showResendKey ? "text" : "password"}
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder="re_..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowResendKey(!showResendKey)}
                    >
                      {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingEmail}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingEmail ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Tab 3: AI */}
        <TabsContent value="ai">
          <form onSubmit={saveAi}>
            <Card>
              <CardHeader>
                <CardTitle>Inteligencia Artificial</CardTitle>
                <CardDescription>
                  Configura el proveedor y las credenciales de IA para la generacion de contenido.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="llm-provider">Proveedor</Label>
                  <Select value={llmProvider} onValueChange={(v) => setLlmProvider(v as "openai" | "anthropic")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="llm-key"
                      type={showLlmKey ? "text" : "password"}
                      value={llmApiKey}
                      onChange={(e) => setLlmApiKey(e.target.value)}
                      placeholder={llmProvider === "openai" ? "sk-..." : "sk-ant-..."}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowLlmKey(!showLlmKey)}
                    >
                      {showLlmKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingAi}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingAi ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Tab 4: Team */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Equipo</CardTitle>
              <CardDescription>Administra los miembros de tu equipo de ventas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {teamMembers.length > 0 ? (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay miembros en el equipo.</p>
              )}

              <Separator />

              <form onSubmit={handleAddMember} className="space-y-4">
                <p className="text-sm font-medium">Agregar miembro</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-name">Nombre</Label>
                    <Input
                      id="member-name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={addingMember} variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {addingMember ? "Agregando..." : "Agregar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Security */}
        <TabsContent value="security">
          <form onSubmit={handleChangePassword}>
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>
                  Cambia la contrasena de acceso a la aplicacion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Contrasena actual</Label>
                  <Input
                    type="password"
                    value="••••••••••••"
                    disabled
                    className="max-w-sm"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contrasena</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa la nueva contrasena"
                    className="max-w-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contrasena</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contrasena"
                    className="max-w-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingSecurity || !newPassword}>
                    <Shield className="mr-2 h-4 w-4" />
                    {savingSecurity ? "Cambiando..." : "Cambiar contrasena"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
