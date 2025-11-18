# Configuración Supabase - NexusShop

Este documento explica cómo configurar Supabase para guardar los mensajes de contacto de tu sitio.

## Paso 1: Crear Proyecto en Supabase

1. Ve a https://app.supabase.com
2. Haz clic en "New project"
3. Llena los datos:
   - **Project name:** `NexusShop` (o lo que prefieras)
   - **Database password:** crea una contraseña segura
   - **Region:** elige la más cercana a tu ubicación
4. Espera a que se cree el proyecto (puede tomar 1-2 minutos)

## Paso 2: Crear la Tabla `contacts`

1. En tu proyecto Supabase, ve a **SQL Editor** (en el menú izquierdo)
2. Haz clic en "New query"
3. Pega el siguiente SQL:

```sql
-- Enable pgcrypto (needed for gen_random_uuid)
create extension if not exists "pgcrypto";

-- Create contacts table
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  newsletter boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.contacts enable row level security;

-- Create a policy to allow anonymous clients (anon role) to INSERT only
create policy "Allow anonymous inserts" on public.contacts
  for insert
  to anon
  with check (true);
```

4. Haz clic en "Run" (botón verde)
5. Si ves un mensaje de éxito, la tabla está creada ✅

## Paso 3: Obtener las Credenciales

1. En Supabase, ve a **Settings** (menú izquierdo) → **API**
2. Copia estos dos valores:
   - **Project URL:** (empieza con `https://`)
   - **anon public:** (la clave pública)

## Paso 4: Actualizar el HTML

1. Abre el archivo `Otros/contacto.html` en tu editor
2. Busca estas líneas (alrededor de la línea 440):

```javascript
const SUPABASE_URL = "https://<TU_PROYECTO>.supabase.co";
const SUPABASE_ANON_KEY = "<TU_ANON_KEY>";
```

3. Reemplaza:
   - `<TU_PROYECTO>` con tu **Project URL** (extrae solo la parte del subdominio, ej: `aaaaaabbbbbbccccccdd`)
   - `<TU_ANON_KEY>` con tu **anon public key**

**Ejemplo:**

```javascript
const SUPABASE_URL = "https://aaaaaabbbbbbccccccdd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

4. Guarda el archivo

## Paso 5: Probar Localmente

1. Abre PowerShell en la carpeta del proyecto: `c:\Users\palen\Downloads\NexusShop.github.io`
2. Ejecuta:

```powershell
python -m http.server 8000
```

3. Abre en tu navegador: `http://localhost:8000/Otros/contacto.html`
4. Llena el formulario y haz clic en "Enviar Mensaje"
5. Si ves "¡Mensaje enviado con éxito!", ve a Supabase → **Table Editor** → **contacts** y verifica que el mensaje aparezca ✅

## Paso 6: Desplegar en GitHub Pages

1. Abre PowerShell en la carpeta del proyecto
2. Ejecuta:

```powershell
git add .
git commit -m "Add Supabase integration for contact form"
git push origin main
```

3. Espera 1-2 minutos a que GitHub Pages despliegue los cambios
4. Ve a `https://jBaldwin2002.github.io/Otros/contacto.html` y prueba el formulario 🎉

## Seguridad

⚠️ **IMPORTANTE:**

- **NUNCA** publiques la `service_role key` en el código (solo usamos la `anon key`)
- La política RLS que creamos permite solo **inserts** desde el navegador
- Los mensajes NO se leen desde el cliente, solo se escriben
- Si quieres que el cliente lea los mensajes, necesitas autenticación adicional

## Soporte

Si tienes problemas:

1. Abre la consola del navegador (F12) y busca errores
2. En Supabase, revisa los logs en **SQL Editor** o **Database** → **Connections**
3. Verifica que la tabla `contacts` existe en **Table Editor**

¡Listo! Tu base de datos está en línea 🚀
