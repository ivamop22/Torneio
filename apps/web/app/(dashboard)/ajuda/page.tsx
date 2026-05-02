'use client';
import { useState } from 'react';

const SECTIONS = [
  { id: 'visao-geral',   icon: '🏠', label: 'Visão Geral' },
  { id: 'torneio',       icon: '🏆', label: '1. Criar Torneio' },
  { id: 'eventos',       icon: '📋', label: '2. Criar Eventos' },
  { id: 'jogadores',     icon: '👤', label: '3. Cadastrar Jogadores' },
  { id: 'duplas',        icon: '👥', label: '4. Montar Duplas' },
  { id: 'chaveamento',   icon: '🎯', label: '5. Gerar Chaveamento' },
  { id: 'partidas',      icon: '🎾', label: '6. Lançar Resultados' },
  { id: 'acompanhamento',icon: '📊', label: '7. Acompanhar Torneio' },
  { id: 'finalizacao',   icon: '🏅', label: '8. Finalizar' },
];

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-lime)', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>{n}</div>
      <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div style={{ background: 'rgba(180,255,61,0.07)', border: '1px solid rgba(180,255,61,0.2)', borderRadius: 10, padding: '0.75rem 1rem', margin: '1rem 0', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1rem' }}>💡</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function Warn({ text }: { text: string }) {
  return (
    <div style={{ background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.25)', borderRadius: 10, padding: '0.75rem 1rem', margin: '1rem 0', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1rem' }}>⚠️</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function SectionTitle({ id, icon, title, subtitle }: { id: string; icon: string; title: string; subtitle: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: 80, marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '1.75rem' }}>{icon}</span>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, paddingLeft: '2.5rem' }}>{subtitle}</p>
    </div>
  );
}

/* ─── Screen Mockups ─────────────────────────────── */

function MockNav({ active }: { active: string }) {
  const tabs = ['Torneios', 'Eventos', 'Jogadores', 'Duplas', 'Chaveamento'];
  return (
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 1rem', display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
      {tabs.map(t => (
        <div key={t} style={{ padding: '0.6rem 0.85rem', fontSize: '0.78rem', fontWeight: 600, color: t === active ? 'var(--accent-lime)' : 'var(--text-muted)', borderBottom: t === active ? '2px solid var(--accent-lime)' : '2px solid transparent', whiteSpace: 'nowrap', cursor: 'pointer' }}>{t}</div>
      ))}
    </div>
  );
}

function MockCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', ...style }}>{children}</div>;
}

function MockScreen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', margin: '1.25rem 0', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginLeft: '0.5rem' }}>{title}</span>
      </div>
      <div style={{ background: 'var(--bg-base)', padding: '1rem' }}>{children}</div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{label}</span>;
}

function MockBtn({ label, primary, danger }: { label: string; primary?: boolean; danger?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', background: primary ? 'var(--accent-lime)' : danger ? 'rgba(255,64,96,0.15)' : 'var(--bg-hover)', color: primary ? '#0a0a0a' : danger ? '#ff4060' : 'var(--text-secondary)', border: primary ? 'none' : danger ? '1px solid rgba(255,64,96,0.3)' : '1px solid var(--border)' }}>{label}</span>
  );
}

function MockInput({ label, placeholder, value }: { label: string; placeholder?: string; value?: string }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: value ? 'var(--text-primary)' : 'var(--text-faint)' }}>{value || placeholder || ''}</div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────── */

export default function AjudaPage() {
  const [activeSection, setActiveSection] = useState('visao-geral');

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Sidebar */}
      <aside style={{ width: 240, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', borderRight: '1px solid var(--border)', background: 'var(--bg-card)', padding: '1.5rem 0' }}>
        <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-lime)' }}>📖 Manual do Sistema</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 2 }}>Arena Beach Tennis</div>
        </div>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)} style={{ width: '100%', textAlign: 'left', background: activeSection === s.id ? 'rgba(180,255,61,0.08)' : 'transparent', border: 'none', borderLeft: activeSection === s.id ? '3px solid var(--accent-lime)' : '3px solid transparent', padding: '0.6rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', fontWeight: activeSection === s.id ? 700 : 400, color: activeSection === s.id ? 'var(--accent-lime)' : 'var(--text-secondary)' }}>
            <span>{s.icon}</span>{s.label}
          </button>
        ))}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', marginTop: '0.75rem' }}>
          <a href="/" style={{ display: 'block', textAlign: 'center', padding: '8px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none' }}>← Voltar ao painel</a>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: '2.5rem 3rem', maxWidth: 860, overflowY: 'auto' }}>

        {/* Hero */}
        <div id="visao-geral" style={{ scrollMarginTop: 80, marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(180,255,61,0.1)', border: '1px solid rgba(180,255,61,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-lime)', marginBottom: '1rem' }}>
            📖 GUIA COMPLETO
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.75rem', lineHeight: 1.1 }}>
            Como usar o<br /><span style={{ color: 'var(--accent-lime)' }}>Arena Beach Tennis</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 600 }}>
            Este guia explica do zero como criar um torneio completo — desde o cadastro até o acompanhamento da final. Siga os passos na ordem indicada.
          </p>

          {/* Flow overview */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['Torneio', 'Eventos', 'Jogadores', 'Duplas', 'Chaveamento', 'Resultados', 'Ranking'].map((s, i, arr) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{s}</div>
                {i < arr.length - 1 && <span style={{ color: 'var(--text-faint)', fontSize: '0.9rem' }}>→</span>}
              </div>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        {/* ═══ STEP 1: TORNEIO ═══ */}
        <SectionTitle id="torneio" icon="🏆" title="1. Criar o Torneio" subtitle="O torneio é o container principal. Todos os eventos, duplas e partidas ficam dentro dele." />

        <MockScreen title="torneio-beach-tennis-chi.vercel.app — Torneios">
          <MockNav active="Torneios" />
          <div style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem' }}>
            <MockCard>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Novo Torneio</div>
              <MockInput label="Nome do torneio *" value="GWM Arena Open 2025" />
              <MockInput label="Estado *" value="Paraná" />
              <MockInput label="Cidade *" value="Curitiba" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <MockInput label="Início" value="15/06/2025" />
                <MockInput label="Fim" value="17/06/2025" />
              </div>
              <MockBtn label="+ Criar Torneio" primary />
            </MockCard>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Torneios Cadastrados</div>
              {['GWM Arena Open 2025', 'Copa Verão 2024'].map((t, i) => (
                <MockCard key={t} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Curitiba, PR</div>
                  </div>
                  <Badge label={i === 0 ? 'Rascunho' : 'Finalizado'} color={i === 0 ? '#888' : '#22c55e'} />
                  <MockBtn label="⚡ Eventos" />
                </MockCard>
              ))}
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Torneios" no menu principal.' />
        <Step n={2} text='Preencha o formulário à esquerda: nome do torneio, estado (a cidade será carregada automaticamente), e datas de início e fim.' />
        <Step n={3} text='Clique em "+ Criar Torneio". O torneio aparecerá na lista à direita com status "Rascunho".' />
        <Step n={4} text='(Opcional) Clique no botão "⚡ Eventos" para gerar automaticamente os eventos padrão de beach tennis (Masculino, Feminino, Misto, etc.).' />
        <Tip text="Se você clicar em '⚡ Eventos', o sistema cria automaticamente as categorias mais comuns. Você pode editá-las ou criar manualmente na aba Eventos." />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

        {/* ═══ STEP 2: EVENTOS ═══ */}
        <SectionTitle id="eventos" icon="📋" title="2. Criar Eventos" subtitle="Cada evento é uma categoria dentro do torneio (ex: Masculino A, Feminino B, Misto Open)." />

        <MockScreen title="torneio-beach-tennis-chi.vercel.app — Eventos">
          <MockNav active="Eventos" />
          <div style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem' }}>
            <MockCard>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Novo Evento</div>
              <MockInput label="Torneio *" value="GWM Arena Open 2025" />
              <MockInput label="Nome do evento *" value="Masculino Adulto A" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <MockInput label="Modalidade" value="Masculino" />
                <MockInput label="Formato" value="Grupos + Mata-mata" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <MockInput label="Categoria" value="Adulto A" />
                <MockInput label="Máx. duplas" value="16" />
              </div>
              <MockBtn label="+ Criar Evento" primary />
            </MockCard>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GWM Arena Open 2025</div>
                <MockBtn label="Selecionar todos" />
              </div>
              {['Masculino Adulto A', 'Feminino Adulto A', 'Misto Open'].map((ev, i) => (
                <MockCard key={ev} style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input type="checkbox" readOnly style={{ width: 14, height: 14, accentColor: 'var(--accent-lime)' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginRight: 8 }}>{ev}</span>
                    <Badge label="Rascunho" color="#888" />
                  </div>
                  <MockBtn label="🗑" danger />
                </MockCard>
              ))}
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Eventos" no menu principal.' />
        <Step n={2} text='Selecione o torneio no campo "Torneio *".' />
        <Step n={3} text='Informe o nome do evento (ex: "Masculino Adulto A"), a modalidade (gênero), o formato de disputa e a categoria.' />
        <Step n={4} text='Defina o máximo de duplas se quiser limitar vagas.' />
        <Step n={5} text='Clique em "+ Criar Evento". Repita para cada categoria do torneio.' />
        <Tip text="Formatos disponíveis: Grupos + Mata-mata (mais comum), Mata-mata puro, Round Robin e Fase de Grupos. Para torneios pequenos (até 8 duplas) use Mata-mata ou Round Robin." />
        <Tip text="Para excluir vários eventos de uma vez, marque os checkboxes e clique em 'Excluir N selecionados'." />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

        {/* ═══ STEP 3: JOGADORES ═══ */}
        <SectionTitle id="jogadores" icon="👤" title="3. Cadastrar Jogadores" subtitle="Registre todos os atletas que vão participar do torneio." />

        <MockScreen title="torneio-beach-tennis-chi.vercel.app — Jogadores">
          <MockNav active="Jogadores" />
          <div style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem' }}>
            <MockCard>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Novo Jogador</div>
              <MockInput label="Nome completo *" value="Carlos Silva" />
              <MockInput label="Gênero *" value="Masculino" />
              <MockInput label="E-mail" value="carlos@email.com" />
              <MockBtn label="+ Adicionar Jogador" primary />
            </MockCard>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: '0.8rem', color: 'var(--text-faint)' }}>🔍 Buscar jogador...</div>
              </div>
              {['Carlos Silva', 'Pedro Alves', 'Ana Costa', 'Julia Souza'].map((p, i) => (
                <MockCard key={p} style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: i % 2 === 0 ? 'rgba(61,158,255,0.2)' : 'rgba(255,100,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: i % 2 === 0 ? '#3d9eff' : '#ff64c8', flexShrink: 0 }}>
                    {p.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{i % 2 === 0 ? 'Masculino' : 'Feminino'}</div>
                  </div>
                  <MockBtn label="✏️" />
                  <MockBtn label="🗑" danger />
                </MockCard>
              ))}
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Jogadores" no menu principal.' />
        <Step n={2} text='Preencha o nome completo, gênero e (opcionalmente) o e-mail do atleta.' />
        <Step n={3} text='Clique em "+ Adicionar Jogador". Repita para todos os atletas.' />
        <Step n={4} text='Use a barra de busca para encontrar jogadores já cadastrados. Clique no ícone ✏️ para editar dados.' />
        <Warn text="Cadastre TODOS os jogadores antes de montar as duplas. Um jogador precisa existir no sistema para ser adicionado a uma dupla." />
        <Tip text="O campo de e-mail é opcional, mas útil para comunicação futura com os atletas." />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

        {/* ═══ STEP 4: DUPLAS ═══ */}
        <SectionTitle id="duplas" icon="👥" title="4. Montar as Duplas" subtitle="Forme as duplas combinando dois jogadores para cada par inscrito no torneio." />

        <MockScreen title="torneio-beach-tennis-chi.vercel.app — Duplas">
          <MockNav active="Duplas" />
          <div style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem' }}>
            <MockCard>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Nova Dupla</div>
              <MockInput label="Jogador 1 *" value="Carlos Silva" />
              <MockInput label="Jogador 2 *" value="Pedro Alves" />
              <MockInput label="Seed (cabeça de chave)" placeholder="#1, #2..." value="1" />
              <MockBtn label="+ Criar Dupla" primary />
            </MockCard>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duplas Cadastradas</div>
              {[['#1', 'Carlos Silva / Pedro Alves'], ['#2', 'João Lima / Rafael Melo'], ['#3', 'Marcos Neto / Bruno Costa']].map(([seed, name]) => (
                <MockCard key={name} style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(180,255,61,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-lime)' }}>{seed}</div>
                  <div style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                  <Badge label="Ativa" color="#22c55e" />
                  <MockBtn label="✏️" />
                  <MockBtn label="🗑" danger />
                </MockCard>
              ))}
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Duplas" no menu principal.' />
        <Step n={2} text='Selecione o Jogador 1 e o Jogador 2 nos campos correspondentes.' />
        <Step n={3} text='Informe o seed (cabeça de chave) da dupla: #1 = favorita, #2 = segunda favorita, etc. Deixe em branco se não houver ranking.' />
        <Step n={4} text='Clique em "+ Criar Dupla". Repita para todas as duplas inscritas.' />
        <Tip text="O seed é usado pelo sistema para separar as melhores duplas no sorteio dos grupos, evitando que se enfrentem na fase inicial." />
        <Warn text="Dois jogadores não podem ser usados em duplas diferentes dentro do mesmo evento. Cada jogador só pode ter uma dupla ativa." />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

        {/* ═══ STEP 5: CHAVEAMENTO ═══ */}
        <SectionTitle id="chaveamento" icon="🎯" title="5. Gerar o Chaveamento" subtitle="Com as duplas montadas, gere o bracket automático para cada evento." />

        <MockScreen title="torneio-beach-tennis-chi.vercel.app — Chaveamento">
          <MockNav active="Chaveamento" />
          <div style={{ padding: '1rem 0' }}>
            <MockCard style={{ maxWidth: 420, marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Gerar Chaveamento</div>
              <MockInput label="Evento *" value="Masculino Adulto A" />
              <MockInput label="Número de grupos" value="4 grupos" />
              <div style={{ background: 'rgba(180,255,61,0.06)', border: '1px solid rgba(180,255,61,0.15)', borderRadius: 8, padding: '0.6rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                📊 16 duplas → 4 grupos de 4 → top 2 avançam → quartas, semis e final
              </div>
              <MockBtn label="⚡ Gerar Chaveamento" primary />
            </MockCard>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[['Grupo A', ['#1 Carlos/Pedro', '#4 Lucas/Diego', '#5 Thiago/André', '#8 Paulo/Caio']],
                ['Grupo B', ['#2 João/Rafael', '#3 Marcos/Bruno', '#6 Felipe/Gustavo', '#7 Igor/Vitor']]].map(([grupo, duplas]) => (
                <MockCard key={grupo as string}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-lime)', marginBottom: '0.5rem' }}>{grupo as string}</div>
                  {(duplas as string[]).map(d => (
                    <div key={d} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>{d}</div>
                  ))}
                </MockCard>
              ))}
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Chaveamento" no menu principal.' />
        <Step n={2} text='Selecione o evento que deseja chavear (ex: "Masculino Adulto A").' />
        <Step n={3} text='Escolha o número de grupos (2, 3, 4, 6 ou 8). O sistema calcula automaticamente quantas duplas ficam por grupo.' />
        <Step n={4} text='Clique em "⚡ Gerar Chaveamento". Os grupos serão formados respeitando os seeds (cabeças de chave não ficam no mesmo grupo).' />
        <Step n={5} text='Repita o processo para cada evento do torneio.' />
        <Tip text="Para 8 duplas: use 2 grupos de 4. Para 16 duplas: use 4 grupos de 4. Para 12 duplas: use 3 grupos de 4 ou 4 grupos de 3." />
        <Warn text="Gere o chaveamento somente quando todas as duplas estiverem cadastradas. Após a geração, o sorteio dos grupos já estará definido." />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

        {/* ═══ STEP 6: LANÇAR RESULTADOS ═══ */}
        <SectionTitle id="partidas" icon="🎾" title="6. Lançar Resultados das Partidas" subtitle="Após cada partida jogada, registre o placar no sistema." />

        <MockScreen title="torneio-beach-tennis-chi.vercel.app — Lançar Resultado">
          <div style={{ padding: '1rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Grupo A — Partida 1
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <MockCard style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>DUPLA 1</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Carlos / Pedro</div>
              </MockCard>
              <div style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-faint)' }}>VS</div>
              <MockCard style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>DUPLA 2</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Lucas / Diego</div>
              </MockCard>
            </div>
            {[['Set 1', '6', '3'], ['Set 2', '6', '4']].map(([set, g1, g2]) => (
              <MockCard key={set} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto 1fr', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{set}</div>
                <div style={{ background: 'rgba(180,255,61,0.1)', border: '1px solid rgba(180,255,61,0.3)', borderRadius: 8, padding: '6px 12px', textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--accent-lime)' }}>{g1}</div>
                <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>×</div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{g2}</div>
              </MockCard>
            ))}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <MockBtn label="+ Adicionar Set" />
              <MockBtn label="✅ Salvar Resultado" primary />
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='No chaveamento (aba "Chaveamento"), localize a partida e clique no ícone de placar ou no nome da partida.' />
        <Step n={2} text='Na tela de resultado, você verá as duas duplas. Informe os games de cada set (ex: Set 1 → 6×3, Set 2 → 6×4).' />
        <Step n={3} text='Se houver tiebreak, informe o placar do tiebreak no campo adicional que aparece quando o placar de games for igual (6×6).' />
        <Step n={4} text='Clique em "+ Adicionar Set" se a partida for para o terceiro set.' />
        <Step n={5} text='Clique em "✅ Salvar Resultado". O sistema atualiza automaticamente a classificação do grupo.' />
        <Tip text="O sistema determina o vencedor automaticamente com base no placar dos sets. Você não precisa marcar quem ganhou — só informa os games." />
        <Tip text="Você pode acessar a tela de placar diretamente pela URL do evento em tempo real, ideal para o árbitro usar no tablet durante a partida." />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

        {/* ═══ STEP 7: ACOMPANHAMENTO ═══ */}
        <SectionTitle id="acompanhamento" icon="📊" title="7. Acompanhar o Torneio" subtitle="Monitore a classificação dos grupos, o bracket e o ranking em tempo real." />

        <MockScreen title="torneio-beach-tennis-chi.vercel.app/torneios/gwm-arena-open">
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              {['Inscrição', 'Grupos', 'Bracket', 'Ranking', 'Desempenho'].map((t, i) => (
                <div key={t} style={{ padding: '0.5rem 0.85rem', fontSize: '0.78rem', fontWeight: i === 1 ? 700 : 400, color: i === 1 ? 'var(--accent-lime)' : 'var(--text-muted)', borderBottom: i === 1 ? '2px solid var(--accent-lime)' : '2px solid transparent' }}>{t}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[['Grupo A', [['1°', '#1 Carlos/Pedro', '3', '0', '6-3 6-4'], ['2°', '#4 Lucas/Diego', '1', '2', '3-6 4-6'], ['3°', '#5 Thiago/André', '0', '3', 'Pendente']]],
                ['Grupo B', [['1°', '#2 João/Rafael', '2', '0', '6-2 6-1'], ['2°', '#3 Marcos/Bruno', '2', '1', '6-4 3-6 6-3'], ['3°', '#6 Felipe/Gustavo', '0', '3', 'Pendente']]]].map(([grupo, rows]) => (
                <MockCard key={grupo as string}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-lime)', marginBottom: '0.5rem' }}>{grupo as string}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 20px 20px', gap: '4px', fontSize: '0.7rem' }}>
                    <div style={{ color: 'var(--text-faint)' }}>Pos</div><div style={{ color: 'var(--text-faint)' }}>Dupla</div><div style={{ color: 'var(--text-faint)', textAlign: 'center' }}>V</div><div style={{ color: 'var(--text-faint)', textAlign: 'center' }}>D</div>
                    {(rows as string[][]).map(([pos, name, v, d]) => (
                      <>
                        <div key={pos + name} style={{ color: pos === '1°' || pos === '2°' ? 'var(--accent-lime)' : 'var(--text-faint)', fontWeight: 700 }}>{pos}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.68rem' }}>{name}</div>
                        <div style={{ textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{v}</div>
                        <div style={{ textAlign: 'center', color: '#ff4060', fontWeight: 700 }}>{d}</div>
                      </>
                    ))}
                  </div>
                </MockCard>
              ))}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.5rem' }}>🟢 Classificados para o mata-mata</div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a página pública do torneio clicando em "Ver torneio" ou acessando /torneios no menu.' />
        <Step n={2} text='Na aba "Grupos" você vê a tabela de classificação de cada grupo em tempo real. As duplas em verde estão classificadas.' />
        <Step n={3} text='Na aba "Bracket" você visualiza a chave do mata-mata — à medida que os resultados são lançados, o bracket avança automaticamente.' />
        <Step n={4} text='Na aba "Ranking" você vê a classificação geral com pontos acumulados de todos os eventos.' />
        <Step n={5} text='Na aba "Desempenho" você vê estatísticas individuais de cada atleta (games, sets, vitórias).' />
        <Tip text="Esta página é pública — você pode enviar o link para atletas e espectadores acompanharem em tempo real sem precisar de login." />
        <Tip text="O link /ao-vivo/[eventId] mostra apenas o bracket e placar de um evento específico, ideal para projetar em telão no local." />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

        {/* ═══ STEP 8: FINALIZAÇÃO ═══ */}
        <SectionTitle id="finalizacao" icon="🏅" title="8. Finalizar o Torneio" subtitle="Após todas as partidas, o sistema gera o resultado final e o ranking definitivo." />

        <MockScreen title="Final — Masculino Adulto A">
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-lime)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>FINAL — MASCULINO ADULTO A</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>GWM Arena Open 2025</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '1rem', alignItems: 'center', maxWidth: 500, margin: '0 auto' }}>
              <MockCard style={{ textAlign: 'center', background: 'rgba(180,255,61,0.08)', border: '1px solid rgba(180,255,61,0.3)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🥇</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-lime)', fontWeight: 700 }}>CAMPEÕES</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Carlos / Pedro</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-lime)', marginTop: 4 }}>6-4  7-5</div>
              </MockCard>
              <div style={{ textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-faint)' }}>VS</div>
              <MockCard style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🥈</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>VICE</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>João / Rafael</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 4 }}>4-6  5-7</div>
              </MockCard>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <MockBtn label="🏆 Encerrar Torneio" primary />
              <MockBtn label="📤 Compartilhar Resultados" />
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Lance o resultado da final normalmente como qualquer outra partida.' />
        <Step n={2} text='O sistema identifica automaticamente o campeão e vice-campeão de cada evento.' />
        <Step n={3} text='Acesse a aba "Ranking" na página pública para ver o pódio completo de todos os eventos.' />
        <Step n={4} text='No painel admin, acesse o torneio e mude o status para "Finalizado" para indicar que o torneio encerrou.' />
        <Step n={5} text='Compartilhe o link público do torneio com atletas e patrocinadores para que possam ver os resultados finais.' />
        <Tip text="Os resultados ficam disponíveis permanentemente no sistema, mesmo após o encerramento do torneio." />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

        {/* Quick Reference */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '3rem' }}>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem' }}>📌 Resumo Rápido</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              ['1. Criar torneio', 'Aba Torneios → preencher nome/cidade/datas'],
              ['2. Criar eventos', 'Aba Eventos → uma entrada por categoria'],
              ['3. Cadastrar jogadores', 'Aba Jogadores → nome + gênero obrigatórios'],
              ['4. Montar duplas', 'Aba Duplas → escolher 2 jogadores + seed'],
              ['5. Gerar chaveamento', 'Aba Chaveamento → selecionar evento + nº grupos'],
              ['6. Lançar resultados', 'Chaveamento → clicar na partida → informar games'],
              ['7. Acompanhar', '/torneios → abas Grupos, Bracket, Ranking'],
              ['8. Finalizar', 'Alterar status do torneio para Finalizado'],
            ].map(([titulo, desc]) => (
              <div key={titulo} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{titulo}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.8rem', paddingBottom: '2rem' }}>
          Arena Beach Tennis • Manual do Sistema v1.0
        </p>
      </main>
    </div>
  );
}
