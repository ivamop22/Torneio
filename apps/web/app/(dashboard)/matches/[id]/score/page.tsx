'use client';
import { useState } from 'react';

export default function ScorePage() {
  const [sets, setSets] = useState([
    { setNumber: 1, team1Games: 0, team2Games: 0 },
    { setNumber: 2, team1Games: 0, team2Games: 0 }
  ]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Lançamento de placar</h1>
      {sets.map((s, i) => (
        <div key={s.setNumber} style={{ marginBottom: 16 }}>
          <strong>Set {s.setNumber}</strong>
          <div>
            <input type="number" value={s.team1Games} onChange={e => {
              const copy = [...sets]; copy[i] = { ...copy[i], team1Games: Number(e.target.value) }; setSets(copy);
            }} />
            <input type="number" value={s.team2Games} onChange={e => {
              const copy = [...sets]; copy[i] = { ...copy[i], team2Games: Number(e.target.value) }; setSets(copy);
            }} />
          </div>
        </div>
      ))}
    </main>
  );
}
