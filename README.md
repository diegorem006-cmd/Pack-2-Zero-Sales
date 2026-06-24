# Pack 2 Zero Ventas

Herramienta interna de gestión de leads y ventas para **E6PR / Pack 2 Cero**.  
Permite importar leads desde CSV/Excel, clasificarlos, ver el historial de conversación, redactar respuestas con IA y enviarlas por correo.

White-label: la marca, colores, logo y configuración se editan desde Ajustes sin tocar código.

## Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS v4** + shadcn/ui
- **Supabase** (Postgres)
- **Resend** (envío de correos)
- **LLM API** (OpenAI o Anthropic, configurable)

## Correr en local

```bash
# 1. Clonar e instalar
git clone https://github.com/diegorem006-cmd/Pack-2-Cero-Sales.git
cd Pack-2-Cero-Sales
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores de Supabase:
#   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
#   VITE_SUPABASE_ANON_KEY=tu-anon-key

# 3. Crear las tablas en Supabase
# Ejecutar el contenido de supabase/schema.sql en el SQL Editor de Supabase

# 4. (Opcional) Cargar datos de ejemplo
# Ejecutar el contenido de supabase/seed.sql en el SQL Editor de Supabase

# 5. Iniciar el servidor de desarrollo
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anon/pública de Supabase |

Las siguientes claves se configuran desde la pantalla de **Ajustes** dentro de la app:
- **Resend API Key** — para enviar correos
- **LLM API Key** — para redactar con IA (OpenAI o Anthropic)

## Migración de base de datos

1. Ir al [SQL Editor de Supabase](https://supabase.com/dashboard)
2. Ejecutar `supabase/schema.sql` para crear las tablas
3. (Opcional) Ejecutar `supabase/seed.sql` para datos de ejemplo

La contraseña por defecto del seed es: `demo123`

## Despliegue

### Recomendado: Vercel + Supabase

1. **Supabase**: Crear proyecto en [supabase.com](https://supabase.com), ejecutar schema.sql
2. **Vercel**: Conectar el repo, agregar las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. **Dominio**: En Vercel → Settings → Domains, agregar tu subdominio (ej: `ventas.pack2cero.com`) y configurar el DNS con un CNAME apuntando a `cname.vercel-dns.com`

### Alternativa: Netlify

Mismo proceso, solo cambia el CNAME a `tu-sitio.netlify.app`.

## Funcionalidades

- **Importar leads**: Subir CSV/XLSX o pegar datos, mapeo de columnas, clasificación automática, deduplicación
- **Bandeja de leads**: Lista filtrable por status/prioridad/tipo/país, búsqueda, contadores
- **Ficha del contacto**: Datos editables, hilo de conversación, enviar respuesta por correo, registrar mensajes recibidos
- **Redactar con IA**: Genera borrador usando la descripción de la empresa y el hilo de conversación
- **Ajustes**: Marca (nombre, logo, colores), correo (remitente, Resend), IA (proveedor, API key), equipo, seguridad

## Pendientes (decisiones del usuario)

- [ ] Configurar proyecto en Supabase y obtener URL + anon key
- [ ] Obtener API key de Resend en [resend.com](https://resend.com)
- [ ] Obtener API key de OpenAI o Anthropic
- [ ] Configurar dominio y DNS
- [ ] Subir logo de la empresa desde Ajustes
