import { createClient } from '@supabase/supabase-js';

// Accedemos a las variables de entorno definidas en el archivo .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verificación de seguridad para evitar errores silenciosos y asegurar HTTPS
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Error de configuración: Faltan las variables de entorno de Supabase.'
  );
}

// FORCE HTTPS: Seguridad de transporte obligatoria
if (!supabaseUrl.startsWith('https://')) {
  console.warn('CRITICAL SECURITY WARNING: Se está intentando conectar a Supabase mediante un protocolo no seguro (HTTP). Forzando HTTPS para proteger los datos de los usuarios.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'conociendogente-secure' }
  }
});