import { useState, useCallback, useMemo } from "react"
import type { ChangeEvent } from "react"
import * as XLSX from "xlsx"
import {
  Upload,
  ClipboardPaste,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { ContactInsert, MessageInsert } from "@/types/database"
import { useSettings } from "@/contexts/SettingsContext"
import { analyzeContactWithClaude } from "@/lib/claude-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ── Field mapping targets ──────────────────────────────────────────────

const FIELD_OPTIONS = [
  { value: "__ignore__", label: "Ignorar" },
  { value: "first_name", label: "Nombre" },
  { value: "last_name", label: "Apellido" },
  { value: "company_name", label: "Empresa" },
  { value: "email", label: "Email" },
  { value: "website", label: "Sitio web" },
  { value: "country", label: "País" },
  { value: "state", label: "Estado" },
  { value: "how_can_we_help", label: "Tipo (How can we help)" },
  { value: "additional_info", label: "Info adicional (mensaje)" },
  { value: "how_did_you_learn", label: "Fuente (How did you learn)" },
  { value: "submission_date", label: "Fecha de envío" },
] as const

type FieldTarget = (typeof FIELD_OPTIONS)[number]["value"]

// ── Auto-detection map ─────────────────────────────────────────────────

const AUTO_DETECT: Record<string, FieldTarget> = {
  "first name": "first_name",
  "first_name": "first_name",
  firstname: "first_name",
  nombre: "first_name",
  "last name": "last_name",
  "last_name": "last_name",
  lastname: "last_name",
  apellido: "last_name",
  "company name": "company_name",
  "company_name": "company_name",
  company: "company_name",
  empresa: "company_name",
  email: "email",
  "email address": "email",
  correo: "email",
  website: "website",
  "web site": "website",
  url: "website",
  country: "country",
  país: "country",
  pais: "country",
  state: "state",
  estado: "state",
  province: "state",
  "how can we best help you?": "how_can_we_help",
  "how can we best help you": "how_can_we_help",
  "how can we help": "how_can_we_help",
  type: "how_can_we_help",
  tipo: "how_can_we_help",
  "additional info": "additional_info",
  "additional_info": "additional_info",
  "additional information": "additional_info",
  message: "additional_info",
  mensaje: "additional_info",
  comments: "additional_info",
  "how did you learn about us?": "how_did_you_learn",
  "how did you learn about us": "how_did_you_learn",
  "how did you learn": "how_did_you_learn",
  source: "how_did_you_learn",
  fuente: "how_did_you_learn",
  referral: "how_did_you_learn",
  "submission date": "submission_date",
  "submission_date": "submission_date",
  date: "submission_date",
  fecha: "submission_date",
}

const AUTO_IGNORE_COLUMNS = new Set([
  "referrer",
  "url",
  "documenturl",
  "fbeventid",
  "medium",
  "mediumid",
  "timezone",
])

// ── Classification helpers ─────────────────────────────────────────────

function classifyType(
  helpValue: string,
): "Productor" | "Distribuidor" | "Marca nueva" | "Consumidor" | "Otro" {
  const v = helpValue.toLowerCase()
  if (v.includes("beverage manufacturer")) return "Productor"
  if (v.includes("established distributor")) return "Distribuidor"
  if (v.includes("innovate")) return "Marca nueva"
  if (v.includes("hello") || v.includes("experience")) return "Consumidor"
  if (v.includes("support")) return "Consumidor"
  if (v.includes("media") || v.includes("press")) return "Otro"
  return "Otro"
}

function classifyPriority(
  type: string,
  body: string,
): "Alta" | "Media" | "Baja" {
  const b = body.toLowerCase()
  if (
    b.includes("current customer") ||
    b.includes("already using") ||
    b.includes("distributor") ||
    b.includes("volume") ||
    b.includes("format") ||
    b.includes("quote")
  ) {
    return "Alta"
  }
  if (type === "Consumidor") return "Baja"
  if (type === "Productor") return "Media"
  return "Media"
}

// ── Component ──────────────────────────────────────────────────────────

type Step = "input" | "mapping" | "importing" | "done"

export default function ImportPage() {
  const { settings, updateSettings } = useSettings()

  // Parsed data
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, FieldTarget>>({})

  // UI state
  const [step, setStep] = useState<Step>("input")
  const [error, setError] = useState<string | null>(null)
  const [pasteText, setPasteText] = useState("")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [useAIAnalysis, setUseAIAnalysis] = useState(false)

  // ── Parsing ────────────────────────────────────────────────────────

  const processWorkbook = useCallback(
    (wb: XLSX.WorkBook) => {
      const sheet = wb.Sheets[wb.SheetNames[0]]
      if (!sheet) {
        setError("El archivo no contiene hojas de datos.")
        return
      }
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" })
      if (data.length < 2) {
        setError("El archivo no contiene datos suficientes.")
        return
      }

      const h = (data[0] as string[]).map((v) => String(v).trim())
      const r = data.slice(1).filter((row) => row.some((c) => String(c).trim() !== ""))

      setHeaders(h)
      setRows(r.map((row) => row.map((c) => String(c))))
      setError(null)

      // Build initial mapping
      const savedMapping =
        settings?.column_mapping && typeof settings.column_mapping === "object"
          ? (settings.column_mapping as Record<string, string>)
          : {}

      const m: Record<string, FieldTarget> = {}
      for (const col of h) {
        if (savedMapping[col] && FIELD_OPTIONS.some((f) => f.value === savedMapping[col])) {
          m[col] = savedMapping[col] as FieldTarget
        } else if (AUTO_IGNORE_COLUMNS.has(col.toLowerCase())) {
          m[col] = "__ignore__"
        } else {
          const norm = col.toLowerCase().trim()
          m[col] = AUTO_DETECT[norm] ?? "__ignore__"
        }
      }
      setMapping(m)
      setStep("mapping")
    },
    [settings],
  )

  const handleFileUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setError(null)

      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer)
          const wb = XLSX.read(data, { type: "array" })
          processWorkbook(wb)
        } catch {
          setError("No se pudo leer el archivo. Verifica el formato.")
        }
      }
      reader.readAsArrayBuffer(file)
    },
    [processWorkbook],
  )

  const handleParsePaste = useCallback(() => {
    if (!pasteText.trim()) {
      setError("Pega datos antes de continuar.")
      return
    }
    try {
      const wb = XLSX.read(pasteText, { type: "string" })
      processWorkbook(wb)
    } catch {
      setError("No se pudieron interpretar los datos pegados.")
    }
  }, [pasteText, processWorkbook])

  // ── Preview rows ───────────────────────────────────────────────────

  const previewRows = useMemo(() => rows.slice(0, 5), [rows])

  // ── Import ─────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    setImporting(true)
    setError(null)
    let imported = 0
    let skipped = 0

    try {
      // Build column index map
      const colIndex: Record<string, number> = {}
      for (const [col, target] of Object.entries(mapping)) {
        if (target !== "__ignore__") {
          colIndex[target] = headers.indexOf(col)
        }
      }

      const getValue = (row: string[], field: string): string => {
        const idx = colIndex[field]
        if (idx === undefined || idx < 0) return ""
        return String(row[idx] ?? "").trim()
      }

      for (const row of rows) {
        const email = getValue(row, "email")
        if (!email) {
          skipped++
          continue
        }

        const submissionDate = getValue(row, "submission_date") || null
        const firstName = getValue(row, "first_name") || email.split("@")[0]
        const lastName = getValue(row, "last_name") || ""
        const company = getValue(row, "company_name") || ""
        const helpText = getValue(row, "how_can_we_help")
        const additionalInfo = getValue(row, "additional_info")

        let type: "Productor" | "Distribuidor" | "Marca nueva" | "Consumidor" | "Otro" = "Otro"
        let priority: "Alta" | "Media" | "Baja" = "Media"
        const bodyParts = [helpText, additionalInfo].filter(Boolean)
        const body = bodyParts.join("\n\n")

        if (useAIAnalysis && settings?.llm_api_key) {
          try {
            const analysis = await analyzeContactWithClaude(
              email,
              firstName,
              lastName,
              company,
              helpText,
              additionalInfo,
              settings.llm_api_key,
            )
            type = analysis.type
            priority = analysis.priority
          } catch (err) {
            console.warn("Claude analysis failed, falling back to basic classification:", err)
            type = helpText ? classifyType(helpText) : "Otro"
            priority = classifyPriority(type, body)
          }
        } else {
          type = helpText ? classifyType(helpText) : "Otro"
          priority = classifyPriority(type, body)
        }

        // Deduplication check
        let query = supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("email", email)

        if (submissionDate) {
          query = query.eq("submission_date", submissionDate)
        }

        const { count } = await query
        if (count && count > 0) {
          skipped++
          continue
        }

        // Insert contact
        const contact: ContactInsert = {
          first_name: getValue(row, "first_name") || email.split("@")[0],
          last_name: getValue(row, "last_name") || null,
          company_name: getValue(row, "company_name") || null,
          email,
          website: getValue(row, "website") || null,
          country: getValue(row, "country") || null,
          state: getValue(row, "state") || null,
          type,
          priority,
          source: getValue(row, "how_did_you_learn") || null,
          submission_date: submissionDate,
          status: "Nuevo",
        }

        const { data: inserted, error: insertErr } = await supabase
          .from("contacts")
          .insert(contact)
          .select("id")
          .single()

        if (insertErr || !inserted) {
          skipped++
          continue
        }

        // Insert first message
        if (body) {
          const message: MessageInsert = {
            contact_id: inserted.id,
            direction: "recibido",
            body,
            channel: "email",
          }
          await supabase.from("messages").insert(message)
        }

        imported++
      }

      // Save mapping to settings
      await updateSettings({ column_mapping: mapping })

      setResult({ imported, skipped })
      setStep("done")
    } catch {
      setError("Ocurrió un error durante la importación.")
    } finally {
      setImporting(false)
    }
  }, [mapping, headers, rows, updateSettings, useAIAnalysis, settings])

  const handleReset = useCallback(() => {
    setStep("input")
    setHeaders([])
    setRows([])
    setMapping({})
    setResult(null)
    setError(null)
    setPasteText("")
    setUseAIAnalysis(false)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────

  if (step === "done" && result) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-green-500" />
            <CardTitle>Importacion completada</CardTitle>
            <CardDescription>Resumen de la importacion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg border p-4">
                <p className="text-3xl font-bold text-green-600">{result.imported}</p>
                <p className="text-sm text-muted-foreground">Contactos importados</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-3xl font-bold text-amber-600">{result.skipped}</p>
                <p className="text-sm text-muted-foreground">Duplicados omitidos</p>
              </div>
            </div>
            <Button onClick={handleReset} className="w-full">
              Importar mas contactos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "mapping") {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Mapeo de columnas</CardTitle>
            <CardDescription>
              Asigna cada columna del archivo a un campo de contacto. Se detectaron{" "}
              {rows.length} filas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <Label className="w-48 shrink-0 truncate text-sm font-medium" title={header}>
                  {header}
                </Label>
                <Select
                  value={mapping[header] ?? "__ignore__"}
                  onValueChange={(val) =>
                    setMapping((prev) => ({ ...prev, [header]: val as FieldTarget }))
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vista previa (primeras 5 filas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {headers.map((_, j) => (
                        <td key={j} className="max-w-[200px] truncate px-3 py-2">
                          {row[j] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="useAI"
              checked={useAIAnalysis}
              onChange={(e) => setUseAIAnalysis(e.target.checked)}
              disabled={!settings?.llm_api_key}
              className="h-4 w-4"
            />
            <Label htmlFor="useAI" className="flex-1 cursor-pointer">
              Usar análisis con IA para clasificar contactos
              {!settings?.llm_api_key && (
                <span className="ml-2 text-xs text-gray-600">
                  (Requiere Claude API key en Ajustes)
                </span>
              )}
            </Label>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset}>
            Volver
          </Button>
          <Button onClick={handleImport} disabled={importing}>
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar {rows.length} contactos
          </Button>
        </div>
      </div>
    )
  }

  // ── Input step ─────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar contactos</h1>
        <p className="text-muted-foreground">
          Sube un archivo CSV/Excel o pega datos para importar leads.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Tabs defaultValue="file">
        <TabsList className="w-full">
          <TabsTrigger value="file" className="flex-1 gap-2">
            <Upload className="h-4 w-4" />
            Subir archivo
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex-1 gap-2">
            <ClipboardPaste className="h-4 w-4" />
            Pegar datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subir archivo CSV o Excel</CardTitle>
              <CardDescription>
                Selecciona un archivo .csv o .xlsx con los datos de contactos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paste">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pegar datos</CardTitle>
              <CardDescription>
                Pega datos separados por tabulaciones o comas. La primera fila debe ser los
                encabezados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={"Nombre\tEmail\tEmpresa\nJuan\tjuan@ejemplo.com\tACME"}
                rows={10}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <Button onClick={handleParsePaste}>Procesar datos</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
