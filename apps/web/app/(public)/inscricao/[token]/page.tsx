'use client';
import { FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function PlayerRegisterPage() {
  const { token } = useParams<{ token: string }>();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/auth/player/register/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Erro ao cadastrar');
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Estilo compartilhado para os inputs para manter o código limpo
  const inputStyle = {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    borderRadius: '12px',
    background: 'var(--bg-elevated, #1e293b)',
    border: '2px solid var(--border, #334155)',
    color: 'var(--text-primary, #f8fafc)',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-muted, #94a3b8)',
    marginBottom: '0.4rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: 400, 
        background: 'var(--bg-card, #1e293b)', 
        padding: '3rem 2rem', 
        borderRadius: '24px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(132, 204, 22, 0.2)' 
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(132, 204, 22, 0.4))' }}>✅</div>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2.5rem', fontWeight: 900, color: '#a3e635', margin: '0 0 1rem' }}>
          TUDO PRONTO!
        </h2>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 2rem' }}>
          Sua inscrição foi recebida com sucesso. Estamos aguardando a aprovação do organizador. Fique de olho no seu e-mail!
        </p>
        <a href="/torneios" style={{
          display: 'block',
          width: '100%',
          padding: '1.2rem',
          fontSize: '1.1rem',
          fontWeight: 800,
          background: 'var(--bg-elevated, #334155)',
          color: 'var(--text-primary, #ffffff)',
          textDecoration: 'none',
          borderRadius: '12px',
          textTransform: 'uppercase',
        }}>
          Acompanhar Torneios
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        
        {/* Cabeçalho do Formulário */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '4rem', 
            height: '4rem', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #bef264 0%, #84cc16 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '2rem', 
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 20px rgba(132, 204, 22, 0.2)'
          }}>
            🎾
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary, #f8fafc)', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>
            Garanta sua Vaga
          </h1>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '1rem', margin: 0 }}>
            Preencha seus dados para entrar na disputa.
          </p>
        </div>

        {/* Card do Formulário */}
        <div style={{ 
          background: 'var(--bg-card, #1e293b)', 
          border: '1px solid var(--border, #334155)', 
          borderRadius: '24px', 
          padding: '2.5rem 2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <label style={labelStyle}>Nome Completo</label>
              <input 
                style={inputStyle} 
                required 
                placeholder="Ex: João da Silva"
                value={form.name} 
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
                onFocus={e => e.target.style.borderColor = '#84cc16'}
                onBlur={e => e.target.style.borderColor = 'var(--border, #334155)'}
              />
            </div>

            <div>
              <label style={labelStyle}>E-mail</label>
              <input 
                style={inputStyle} 
                type="email" 
                required 
                placeholder="seu@email.com"
                value={form.email} 
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                onFocus={e => e.target.style.borderColor = '#84cc16'}
                onBlur={e => e.target.style.borderColor = 'var(--border, #334155)'}
              />
            </div>

            <div>
              <label style={labelStyle}>WhatsApp (Opcional)</label>
              <input 
                style={inputStyle} 
                type="tel" 
                placeholder="(11) 99999-9999"
                value={form.phone} 
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} 
                onFocus={e => e.target.style.borderColor = '#84cc16'}
                onBlur={e => e.target.style.borderColor = 'var(--border, #334155)'}
              />
            </div>

            <div>
              <label style={labelStyle}>Crie uma Senha</label>
              <input 
                style={inputStyle} 
                type="password" 
                required 
                minLength={6} 
                placeholder="Mínimo 6 caracteres"
                value={form.password} 
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
                onFocus={e => e.target.style.borderColor = '#84cc16'}
                onBlur={e => e.target.style.borderColor = 'var(--border, #334155)'}
              />
            </div>

            {error && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '12px', 
                padding: '1rem', 
                fontSize: '0.9rem', 
                color: '#ef4444',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                ⚠ {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '1.2rem',
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#0f172a',
                background: loading ? '#64748b' : '#a3e635',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: loading ? 'none' : '0 10px 20px rgba(132, 204, 22, 0.3)',
                transition: 'all 0.2s',
                marginTop: '0.5rem'
              }}
            >
              {loading ? 'Processando...' : 'Confirmar Inscrição'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/torneios" style={{ 
            color: 'var(--text-muted, #94a3b8)', 
            textDecoration: 'none', 
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '0.5rem 1rem'
          }}>
            ← Voltar para lista de torneios
          </a>
        </p>
      </div>
    </div>
  );
}
