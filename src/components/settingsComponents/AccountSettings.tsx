import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Lock, Mail, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AccountSettings = () => {
  const { user, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      alert('Error al actualizar contraseña: ' + error.message);
    } else {
      alert('Contraseña actualizada correctamente');
      setPassword('');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y perderás todos tus datos."
    );

    if (confirmed) {
      try {
        // Llama a la función RPC de base de datos para eliminar el usuario
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;
        
        await logout();
      } catch (error: any) {
        alert('Error al eliminar la cuenta: ' + error.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Cuenta y Seguridad</h2>

      <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={20} /> Correo Electrónico
        </h3>
        <p style={{ color: '#64748b' }}>Tu correo actual es: <strong>{user?.email}</strong></p>
      </div>

      <form onSubmit={handlePasswordChange} style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={20} /> Cambiar Contraseña
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nueva Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Mínimo 6 caracteres"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        <button type="submit" disabled={loading || !password} style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
        </button>
      </form>

      <div style={{ padding: '1.5rem', border: '1px solid #fee2e2', borderRadius: '12px', backgroundColor: '#fef2f2' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
          <Trash2 size={20} /> Zona de Peligro
        </h3>
        <p style={{ color: '#7f1d1d', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, tenlo en cuenta.
        </p>
        <button 
          onClick={handleDeleteAccount}
          style={{ 
            padding: '10px 20px', 
            background: '#dc2626', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Eliminar Cuenta
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;