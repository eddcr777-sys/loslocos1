import React from 'react';
import Button from '../../../components/ui/Button';

interface ProfileEditFormProps {
  editForm: { full_name: string; username: string; faculty: string; bio: string; avatar_url: string };
  setEditForm: (form: any) => void;
  setAvatarFile: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  editForm,
  setEditForm,
  setAvatarFile,
  onSubmit,
  onCancel
}) => {
  return (
    <form onSubmit={onSubmit} style={styles.editForm}>
      <input
        type="text"
        placeholder="Nombre completo"
        value={editForm.full_name}
        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
        style={styles.input}
      />
      <input
        type="text"
        placeholder="Nombre de usuario (@username)"
        value={editForm.username}
        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
        style={styles.input}
      />
      <input
        type="text"
        placeholder="Facultad"
        value={editForm.faculty}
        onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })}
        style={styles.input}
      />
      <textarea
        placeholder="Bio"
        value={editForm.bio}
        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
        style={styles.textarea}
      />
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          style={styles.input}
        />
      </div>
      <div style={styles.editButtons}>
        <Button type="submit">Guardar</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto'
  },
  input: {
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    fontSize: '1rem',
    width: '100%',
    boxSizing: 'border-box'
  },
  textarea: {
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    fontSize: '1rem',
    minHeight: '80px',
    width: '100%',
    boxSizing: 'border-box'
  },
  editButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
};

export default ProfileEditForm;
