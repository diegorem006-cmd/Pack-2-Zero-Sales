import { useState, useCallback } from "react"
import { Upload, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSettings } from "@/contexts/SettingsContext"
import { analyzeImageWithClaude } from "@/lib/claude-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContactInsert, MessageInsert } from "@/types/database"

export default function ImportImagePage() {
  const { settings } = useSettings()
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    extractedText: string
    email: string
    name: string
    company: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!settings?.llm_api_key) {
        setError("Necesitas configurar tu Claude API key en Settings")
        return
      }

      setAnalyzing(true)
      setError(null)

      try {
        const reader = new FileReader()
        reader.onload = async (ev) => {
          try {
            const base64 = (ev.target?.result as string).split(",")[1]
            if (!base64) throw new Error("No se pudo leer la imagen")

            const analysis = await analyzeImageWithClaude(base64, settings.llm_api_key!)

            // Parse email and name from extracted text
            const emailMatch = analysis.extractedText.match(/[\w.-]+@[\w.-]+\.\w+/)
            const email = emailMatch?.[0] || ""

            setResult({
              extractedText: analysis.extractedText,
              email,
              name: "", // User can fill manually
              company: "",
            })
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error al analizar imagen")
          } finally {
            setAnalyzing(false)
          }
        }
        reader.readAsDataURL(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al procesar imagen")
        setAnalyzing(false)
      }
    },
    [settings],
  )

  const handleSave = useCallback(async () => {
    if (!result?.email) {
      setError("Email es requerido")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const contact: ContactInsert = {
        first_name: result.name,
        company_name: result.company,
        email: result.email,
        type: "Consumidor",
        priority: "Media",
        status: "Nuevo",
        source: "Email/Imagen",
        submission_date: new Date().toISOString(),
      }

      const { data: savedContact, error: contactError } = await supabase
        .from("contacts")
        .insert([contact])
        .select()
        .single()

      if (contactError) throw contactError

      if (result.extractedText) {
        const message: MessageInsert = {
          contact_id: savedContact.id,
          direction: "recibido",
          subject: "Email/Formulario importado",
          body: result.extractedText,
          channel: "email",
        }

        const { error: messageError } = await supabase.from("messages").insert([message])
        if (messageError) throw messageError
      }

      setResult(null)
      alert("Contacto guardado exitosamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }, [result])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar desde Imagen</h1>
        <p className="text-gray-600">
          Sube screenshots de mails o formularios. Claude analizará automáticamente el contenido.
        </p>
      </div>

      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle>Subir Imagen</CardTitle>
            <CardDescription>
              Soporta PNG, JPG, GIF y WebP hasta 5MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {analyzing ? (
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      <span className="font-semibold">Haz click para subir</span> o arrastra una imagen
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={analyzing}
              />
            </label>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Análisis completado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={result.email}
                  onChange={(e) => setResult({ ...result, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Nombre</label>
                  <input
                    type="text"
                    value={result.name}
                    onChange={(e) => setResult({ ...result, name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Empresa</label>
                  <input
                    type="text"
                    value={result.company}
                    onChange={(e) => setResult({ ...result, company: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Texto extraído</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border max-h-48 overflow-y-auto text-sm">
                  {result.extractedText}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setResult(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !result.email}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Guardar contacto
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
