
import { supabase } from './supabaseClient';
import { api } from '../services/api';

/**
 * Utilidad de validación de acceso E2E (Simulada para Frontend)
 * Permite verificar si el usuario actual tiene los permisos correctos en el cliente.
 */
export const validateFrontendAccess = async () => {
    const results = {
        auth: false,
        claims: null as any,
        rls: {
            profiles: false,
            admin_logs: false,
            stats_rpc: false
        },
        errors: [] as string[]
    };

    try {
        // 1. Validar Sesión
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            results.errors.push("No hay sesión activa.");
            return results;
        }
        results.auth = true;

        // 2. Validar JWT Claims
        const metadata = session.user.app_metadata || session.user.user_metadata;
        results.claims = {
            role: metadata.role || metadata.user_type,
            email: session.user.email
        };

        // 3. Probar RLS en Profiles (Lectura propia)
        const { data: profile, error: pError } = await api.getProfile(session.user.id);
        results.rls.profiles = !!profile && !pError;
        if (pError) results.errors.push(`RLS Profiles: ${pError.message}`);

        // 4. Probar RLS en Admin Logs (Solo para admins)
        const { data: logs, error: lError } = await api.getAdminLogs(1);
        results.rls.admin_logs = !lError;
        if (lError) results.errors.push(`RLS AdminLogs: ${lError.message}`);

        // 5. Probar RPC Stats
        const { error: sError } = await api.getSystemStats();
        results.rls.stats_rpc = !sError;
        if (sError) results.errors.push(`RPC Stats: ${sError.message}`);

        return results;
    } catch (e: any) {
        results.errors.push(`Error crítico de validación: ${e.message}`);
        return results;
    }
};
