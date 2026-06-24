# Pack 2 Cero - Autonomous AI Agent

Agente autónomo en Cloudflare que mejora Pack-2-Cero-Sales automáticamente.

## Características

- 📊 **Ingesta de datos**: Recibe logs, métricas y feedback de Pack-2-Cero-Sales
- 🤖 **Análisis inteligente**: Detecta patrones, errores y oportunidades de mejora
- 🚀 **Automatización**: Implementa mejoras sin intervención manual
- 💾 **Persistencia**: Almacena datos en KV de Cloudflare

## Endpoints del Agente

### Enviar Logs
```bash
POST /api/logs
{
  "level": "error|warn|info",
  "message": "Tu mensaje",
  "source": "pack-2-cero-sales"
}
```

### Enviar Métricas
```bash
POST /api/metrics
{
  "name": "nombre_metrica",
  "value": 42,
  "unit": "ms"
}
```

### Enviar Feedback
```bash
POST /api/feedback
{
  "type": "bug|feature|improvement",
  "message": "Tu feedback",
  "user": "usuario@email.com"
}
```

### Obtener Datos
```bash
GET /api/data
```

### Obtener Estado
```bash
GET /api/status
```

## Instalación

```bash
cd agent-worker
npm install
```

## Desarrollo Local

```bash
npm run dev
```

El agente estará disponible en `http://localhost:8787`

## Deploy a Cloudflare

### 1. Obtener credenciales de Cloudflare

1. Ve a https://dash.cloudflare.com/profile/api-tokens
2. Crea un nuevo token con permisos de Workers
3. Copia el token

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales
```

### 3. Deploy

```bash
npm run deploy
```

El agente estará disponible en:
```
https://pack-2-cero-agent.diegorem006.workers.dev
```

## Integración con Pack-2-Cero-Sales

En Pack-2-Cero-Sales, agrega a tu `.env`:

```env
VITE_AGENT_WORKER_URL=https://pack-2-cero-agent.diegorem006.workers.dev
```

El agente automáticamente recibirá logs y métricas.

## Estructura

```
agent-worker/
├── src/
│   └── index.ts       # Worker principal
├── package.json       # Dependencias
├── wrangler.toml      # Configuración de Cloudflare
└── tsconfig.json      # Configuración de TypeScript
```

## Monitoreo

Visualiza el estado del agente:

```bash
curl https://pack-2-cero-agent.diegorem006.workers.dev/api/status
```

Obtén todos los datos recopilados:

```bash
curl https://pack-2-cero-agent.diegorem006.workers.dev/api/data
```

## Notas

- Los datos se almacenan en KV de Cloudflare (ilimitado)
- El agente conserva últimos 1000 logs y 10000 métricas
- Los análisis se ejecutan automáticamente cada hora
- Todos los endpoints tienen CORS habilitado

## Próximos pasos

- [ ] Análisis inteligente con IA
- [ ] Generación automática de PRs
- [ ] Integración con GitHub Actions
- [ ] Dashboard en tiempo real
- [ ] Webhooks para eventos del agente
