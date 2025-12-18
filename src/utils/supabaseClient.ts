import { createClient } from '@supabase/supabase-js';

// Accedemos a las variables de entorno definidas en el archivo .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verificación de seguridad para evitar errores silenciosos
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Error de configuración: Faltan las variables de entorno de Supabase. ' +
    'Asegúrate de tener un archivo .env en la raíz con REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);