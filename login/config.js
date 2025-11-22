/**
 * Configuración de Supabase
 * 
 * Este archivo carga las variables de entorno y las expone globalmente
 * para que se puedan usar en otros scripts
 */

// Detectar si estamos en entorno de bundler o navegador puro
const isNodeEnv = typeof process !== 'undefined' && process.env

// Obtener credenciales según el entorno
let supabaseUrl = null
let supabaseAnonKey = null

if (isNodeEnv) {
    // Si hay process.env (bundler), usar variables de entorno
    supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    supabaseAnonKey = process.env.REACT_APP_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
} else if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
    // Si hay window.SUPABASE_CONFIG (definido en HTML), usar eso
    supabaseUrl = window.SUPABASE_CONFIG.URL
    supabaseAnonKey = window.SUPABASE_CONFIG.ANON_KEY
}

// Validar que las credenciales estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase no está configurado correctamente.')
    console.warn('Asegúrate de:')
    console.warn('1. Crear un proyecto en https://app.supabase.com')
    console.warn('2. Copiar URL y anon key desde Settings → API')
    console.warn('3. Configurar .env con REACT_APP_SUPABASE_URL y REACT_APP_ANON_KEY')
    console.warn('   O añadir window.SUPABASE_CONFIG en el HTML')
}

export const config = {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: !!(supabaseUrl && supabaseAnonKey)
}

export default config
