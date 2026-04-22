#!/bin/bash

set -e

PROJECT_DIR=~/Downloads/beach-tennis-platform
API_DIR="$PROJECT_DIR/apps/api"
WEB_DIR="$PROJECT_DIR/apps/web"

wait_for_url() {
  local url="$1"
  local name="$2"

  for i in {1..30}; do
    if curl -s "$url" > /dev/null; then
      echo "$name respondeu em $url"
      return 0
    fi
    echo "Aguardando $name subir... tentativa $i/30"
    sleep 2
  done

  echo "ERRO: $name não respondeu em $url"
  return 1
}

extract_id() {
  echo "$1" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p'
}

echo "==> Indo para o projeto"
cd "$PROJECT_DIR"

echo "==> Matando processos antigos nas portas 3000 e 3001"
kill -9 $(lsof -ti :3000) 2>/dev/null || true
kill -9 $(lsof -ti :3001) 2>/dev/null || true

echo "==> Subindo API"
cd "$API_DIR"
nohup pnpm start:dev > /tmp/beach-tennis-api.log 2>&1 &

echo "==> Subindo frontend"
cd "$WEB_DIR"
nohup pnpm dev > /tmp/beach-tennis-web.log 2>&1 &

echo "==> Testando API e frontend"
if ! wait_for_url "http://localhost:3001/" "API"; then
  echo "===== LOG API ====="
  cat /tmp/beach-tennis-api.log || true
  exit 1
fi

if ! wait_for_url "http://localhost:3000/" "Frontend"; then
  echo "===== LOG WEB ====="
  cat /tmp/beach-tennis-web.log || true
  exit 1
fi

echo "==> Criando torneio"
TOURNAMENT_RES=$(curl -s -X POST http://localhost:3001/tournaments \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Torneio Teste Automatizado",
    "city":"Serra",
    "state":"ES",
    "country":"BR",
    "startDate":"2026-04-25",
    "endDate":"2026-04-27"
  }')

echo "$TOURNAMENT_RES"

TOURNAMENT_ID=$(extract_id "$TOURNAMENT_RES")

if [ -z "$TOURNAMENT_ID" ]; then
  echo "ERRO: não foi possível extrair TOURNAMENT_ID"
  exit 1
fi

echo "TOURNAMENT_ID=$TOURNAMENT_ID"

echo "==> Criando evento"
EVENT_RES=$(curl -s -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d "{
    \"tournamentId\":\"$TOURNAMENT_ID\",
    \"name\":\"Masculino A\",
    \"gender\":\"male\",
    \"format\":\"group_knockout\",
    \"category\":\"A\",
    \"maxPairs\":8,
    \"entryFee\":50
  }")

echo "$EVENT_RES"

EVENT_ID=$(extract_id "$EVENT_RES")

if [ -z "$EVENT_ID" ]; then
  echo "ERRO: não foi possível extrair EVENT_ID"
  exit 1
fi

echo "EVENT_ID=$EVENT_ID"

echo "==> Criando jogadores"
create_player () {
  curl -s -X POST http://localhost:3001/players \
    -H "Content-Type: application/json" \
    -d "{
      \"fullName\":\"$1\",
      \"gender\":\"male\",
      \"nationality\":\"BR\"
    }"
}

P1=$(create_player "Jogador 1")
P2=$(create_player "Jogador 2")
P3=$(create_player "Jogador 3")
P4=$(create_player "Jogador 4")
P5=$(create_player "Jogador 5")
P6=$(create_player "Jogador 6")
P7=$(create_player "Jogador 7")
P8=$(create_player "Jogador 8")

P1_ID=$(extract_id "$P1")
P2_ID=$(extract_id "$P2")
P3_ID=$(extract_id "$P3")
P4_ID=$(extract_id "$P4")
P5_ID=$(extract_id "$P5")
P6_ID=$(extract_id "$P6")
P7_ID=$(extract_id "$P7")
P8_ID=$(extract_id "$P8")

echo "==> Criando duplas"
create_team () {
  curl -s -X POST http://localhost:3001/teams \
    -H "Content-Type: application/json" \
    -d "{
      \"eventId\":\"$EVENT_ID\",
      \"player1Id\":\"$1\",
      \"player2Id\":\"$2\",
      \"seed\":$3,
      \"wildCard\":false
    }"
}

T1=$(create_team "$P1_ID" "$P2_ID" 1)
T2=$(create_team "$P3_ID" "$P4_ID" 2)
T3=$(create_team "$P5_ID" "$P6_ID" 3)
T4=$(create_team "$P7_ID" "$P8_ID" 4)

echo "==> Gerando grupos"
DRAW_RES=$(curl -s -X POST http://localhost:3001/draws/generate-group-knockout \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\":\"$EVENT_ID\",
    \"groupCount\":2
  }")

echo "$DRAW_RES"

echo "==> Obtendo partidas"
MATCHES_JSON=$(curl -s "http://localhost:3001/matches?eventId=$EVENT_ID")
echo "$MATCHES_JSON"

MATCH_A=$(echo "$MATCHES_JSON" | grep -o '"id":"[^"]*"' | sed -n '1p' | sed 's/"id":"//;s/"//')
MATCH_B=$(echo "$MATCHES_JSON" | grep -o '"id":"[^"]*"' | sed -n '2p' | sed 's/"id":"//;s/"//')

TEAM_A_WINNER=$(echo "$MATCHES_JSON" | tr '{' '\n' | grep "$MATCH_A" | sed -n 's/.*"team1Id":"\([^"]*\)".*/\1/p')
TEAM_B_WINNER=$(echo "$MATCHES_JSON" | tr '{' '\n' | grep "$MATCH_B" | sed -n 's/.*"team1Id":"\([^"]*\)".*/\1/p')

if [ -n "$MATCH_A" ] && [ -n "$TEAM_A_WINNER" ]; then
  echo "==> Resultado Grupo A"
  curl -s -X PATCH "http://localhost:3001/matches/$MATCH_A/result" \
    -H "Content-Type: application/json" \
    -d "{
      \"winnerTeamId\":\"$TEAM_A_WINNER\",
      \"sets\":[
        {\"setNumber\":1,\"team1Games\":6,\"team2Games\":3},
        {\"setNumber\":2,\"team1Games\":6,\"team2Games\":4}
      ]
    }"
  echo ""
fi

if [ -n "$MATCH_B" ] && [ -n "$TEAM_B_WINNER" ]; then
  echo "==> Resultado Grupo B"
  curl -s -X PATCH "http://localhost:3001/matches/$MATCH_B/result" \
    -H "Content-Type: application/json" \
    -d "{
      \"winnerTeamId\":\"$TEAM_B_WINNER\",
      \"sets\":[
        {\"setNumber\":1,\"team1Games\":6,\"team2Games\":2},
        {\"setNumber\":2,\"team1Games\":6,\"team2Games\":1}
      ]
    }"
  echo ""
fi

echo "==> Recalculando classificação"
curl -s -X POST "http://localhost:3001/draws/$EVENT_ID/standings/recalculate"
echo ""

echo "==> Consultando classificação"
curl -s "http://localhost:3001/draws/$EVENT_ID/standings"
echo ""

echo "==> Gerando mata-mata"
curl -s -X POST "http://localhost:3001/draws/$EVENT_ID/generate-knockout"
echo ""

echo "==> Partidas finais"
curl -s "http://localhost:3001/matches?eventId=$EVENT_ID"
echo ""

echo ""
echo "========================================"
echo "Sistema pronto."
echo "Frontend: http://localhost:3000"
echo "API:      http://localhost:3001"
echo "Event ID: $EVENT_ID"
echo "Logs API: /tmp/beach-tennis-api.log"
echo "Logs WEB: /tmp/beach-tennis-web.log"
echo "========================================"
