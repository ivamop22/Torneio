'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

type Admin = { id: string; name: string; email: string; status: string; createdAt: string };

export default function SuperuserPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [inviteExpires, setInviteExpires] = useState('');
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'superuser')) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch('/superuser/admins');
      if (r.ok) setAdmins(await r.json());
    } catch { setError('Erro ao carregar admins'); }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { if (user?.role === 'superuser') loadAdmins(); }, [user, loadAdmins]);

  async function toggleAdmin(id: string) {
    const r = await authFetch(`/superuser/admins/${id}/toggle`, { method: 'PATCH' });
    if (r.ok) loadAdmins();
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await authFetch('/superuser/admins', {
        method: 'POST',
        body: JSON.stringify(newAdmin),
      });
      if (r.ok) {
        setNewAdmin({ name: '', email: '', password: '' });
        setMsg('Admin criado com sucesso!');
        loadAdmins();
      } else {
        const d = await r.json();
        setMsg(d.message || 'Erro ao criar admin');
      }
    } finally { setCreating(false); }
  }

  async function generateInvite() {
    const r = await authFetch('/superuser/invite', { method: 'POST', body: JSON.stringify({}) });
    if (r.ok) {
      const d = await r.json();
      const baseUrl = window.location.origin;
      setInviteToken(`${baseUrl}/register/${d.token}`);
      setInviteExpires(new Date(d.expiresAt).toLocaleDateString('pt-BR'));
    }
  }

  if (authLoading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <nav className="navbar">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: 'var(--accent-lime)' }}>
              🎾
            </div>
            <span className="font-display text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Superusuário
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            <a href="/" className="btn btn-secondary btn-sm">← Painel Admin</a>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {msg && (
          <div style={{ background: 'rgba(180,255,61,0.08)', border: '1px solid rgba(180,255,61,0.2)', borderRadius: 8, padding: '0.75rem 1rem', color: 'var(--accent-lime)', fontSize: '0.875rem' }}>
            {msg}
          </div>
        )}

        {/* Generate invite link */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
          <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Gerar Link de Convite</h2>
          <button className="btn btn-primary" onClick={generateInvite}>Gerar link</button>
          {inviteToken && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Link válido até {inviteExpires}:</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input readOnly value={inviteToken} className="input" style={{ flex: 1, fontSize: '0.8rem' }} onClick={(e) => (e.target as HTMLInputElement).select()} />
                <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(inviteToken); setMsg('Link copiado!'); }}>Copiar</button>
              </div>
            </div>
          )}
        </div>

        {/* Create admin manually */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
          <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Criar Admin Manualmente</h2>
          <form onSubmit={createAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label className="label">Nome</label>
              <input className="input" required value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" required value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" required minLength={6} value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Criando...' : 'Criar'}</button>
          </form>
        </div>

        {/* Admins list */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
          <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Administradores ({admins.length})</h2>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Carregando...</p> : error ? <p style={{ color: '#FF6080' }}>{error}</p> : admins.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum admin cadastrado.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nome', 'E-mail', 'Status', 'Criado em', 'Ação'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{a.name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{a.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, background: a.status === 'active' ? 'rgba(180,255,61,0.12)' : 'rgba(255,64,96,0.12)', color: a.status === 'active' ? 'var(--accent-lime)' : '#FF6080' }}>
                        {a.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button onClick={() => toggleAdmin(a.id)} className="btn btn-secondary btn-sm">
                        {a.status === 'active' ? 'Bloquear' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
