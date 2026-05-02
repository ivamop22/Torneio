'use client';
import { FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function AdminRegisterPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('As senhas não conferem'); return; }
    setError('');
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/auth/admin/register/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Erro ao cadastrar');
      localStorage.setItem('auth_token', data.token);
      setDone(true);
      setTimeout(() => router.replace('/'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--accent-lime)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>
        ✓ Conta criada! Redirecionando...
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 16, background: 'var(--accent-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem' }}>
            🎾
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
            Criar Conta Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Você foi convidado como administrador</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label className="label">Nome completo</label><input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="label">E-mail</label><input className="input" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><label className="label">Senha</label><input className="input" type="password" required minLength={6} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
            <div><label className="label">Confirmar senha</label><input className="input" type="password" required value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} /></div>
            {error && <div style={{ background: 'rgba(255,64,96,0.1)', border: '1px solid rgba(255,64,96,0.25)', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem', color: '#FF6080' }}>⚠ {error}</div>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
