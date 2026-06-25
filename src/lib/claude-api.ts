interface AnalysisResult {
  priority: "Alta" | "Media" | "Baja"
  type: "Productor" | "Distribuidor" | "Marca nueva" | "Consumidor" | "Otro"
  summary: string
  nextSteps: string
}

export async function analyzeContactWithClaude(
  email: string,
  firstName: string,
  lastName: string,
  company: string,
  helpText: string,
  additionalInfo: string,
  apiKey: string,
): Promise<AnalysisResult> {
  const prompt = `Analiza este contacto y proporciona un análisis estructurado en JSON.

Email: ${email}
Nombre: ${firstName} ${lastName}
Empresa: ${company}
Tipo de ayuda: ${helpText}
Información adicional: ${additionalInfo}

Responde SOLO con JSON en este formato (sin markdown ni explicación):
{
  "priority": "Alta" | "Media" | "Baja",
  "type": "Productor" | "Distribuidor" | "Marca nueva" | "Consumidor" | "Otro",
  "summary": "resumen breve del contacto",
  "nextSteps": "próximos pasos recomendados"
}

Criterios:
- Priority Alta: Clientes actuales, distribuidores, pedidos grandes, urgentes
- Priority Media: Nuevas oportunidades de negocio, potencial medio
- Priority Baja: Consumidores, solicitudes de información general
- Type: Determina si es productor (fabricante), distribuidor, marca nueva, consumidor u otro`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text || "{}"
  const result = JSON.parse(content)

  return result as AnalysisResult
}

export async function analyzeImageWithClaude(
  imageBase64: string,
  apiKey: string,
): Promise<{
  extractedText: string
  summary: string
}> {
  const prompt = `Extrae toda la información de este email/formulario y resume los datos principales.

Proporciona la respuesta en JSON:
{
  "extractedText": "todo el texto extraído",
  "summary": "resumen de la información clave"
}`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text || "{}"
  const result = JSON.parse(content)

  return result
}

export async function researchCompanyWithClaude(
  companyName: string,
  contactEmail: string,
  apiKey: string,
): Promise<{
  industry: string
  size: string
  description: string
  keyInsights: string[]
}> {
  const prompt = `Investiga la siguiente empresa y proporciona información estructurada en JSON.

Empresa: ${companyName}
Email de contacto: ${contactEmail}

Proporciona SOLO JSON sin markdown:
{
  "industry": "industria/sector principal",
  "size": "Pequeña (1-50) | Mediana (51-500) | Grande (501+)",
  "description": "breve descripción de qué hace",
  "keyInsights": ["insight 1", "insight 2", "insight 3"]
}

Los insights deben ser relevantes para ventas/negocio.`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text || "{}"

  try {
    return JSON.parse(content)
  } catch {
    return {
      industry: "No disponible",
      size: "No disponible",
      description: "No se pudo investigar la empresa",
      keyInsights: [],
    }
  }
}
