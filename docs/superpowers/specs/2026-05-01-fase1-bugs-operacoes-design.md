# Fase 1 — Bugs Críticos + Operações Básicas

**Data:** 2026-05-01  
**Status:** Aprovado pelo usuário

---

## Problemas identificados

### 1. Entrada de resultados no chaveamento
- **Causa:** `TournamentBracket.tsx` esconde o botão "Venceu" quando `match.team1 || match.team2` é null (rounds do mata-mata ainda sem duplas definidas). Também, a página pública `/torneios/[slug]` pode não estar passando `apiUrl`/`onRefresh` corretamente.
- **Fix:** Mostrar card com "Aguardando classificação" em vez de ocultar; verificar props nos componentes filhos.

### 2. Editar / excluir dupla
- **Causa:** `TeamsController` só tem `GET` e `POST` — sem `PUT /:id` nem `DELETE /:id`.
- **Fix API:** `PUT /teams/:id` (troca jogadores ou seed) + `DELETE /teams/:id` (bloqueado se dupla tem partida concluída).
- **Fix UI:** Botões inline de edição e exclusão com `ConfirmDialog` na `TeamsTab`.

### 3. Exclusão em massa de jogadores
- **Fix UI:** Checkbox em cada linha + "Selecionar todos" + botão "Excluir selecionados".
- **Fix API:** `DELETE /players/bulk` com body `{ ids: string[] }` — bloqueia jogadores com duplas ativas.

### 4. Excluir torneio (qualquer status)
- **Causa:** `DELETE /tournaments/:id` faz apenas soft-delete sem cascata.
- **Fix:** Cascata na ordem: `matchSets → matches → standings → groups → draws → registrations → teams → events → tournament`.
- **Fix UI:** `ConfirmDialog` reforçado para status `ongoing`/`completed`.

### 5. Chaveamento manual
- **Fix UI:** Novo toggle "Automático / Manual" na `DrawTab`. Modo Manual: grid de slots com dropdown para selecionar dupla.
- **Fix API:** `PUT /events/:eventId/bracket/manual` recebendo `[{ matchId, team1Id, team2Id }]`. Bloqueado após primeira partida jogada.

---

## Regras de Beach Tennis validadas
- Grupos de 3-4 duplas (round-robin): ✅ correto
- Top 2 de cada grupo avançam: ✅ correto
- Mata-mata: eliminação simples ✅
- Critérios de desempate: sets ganhos → games ganhos → confronto direto (a validar no código)
- Pontuação: 1000/750/500/250 pts para 1°/2°/3°/4° ✅
