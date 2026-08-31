#!/usr/bin/env bash
set -euo pipefail

# TridentLab - Local server + public tunnel with clickable links
# Usage: ./scripts/serve-tunnel.sh [--port 8000]
# Requires: python3, lt (localtunnel) -> npm i -g localtunnel

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML_DIR="$ROOT/html"
PORT=8000
# parse --port
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port|-p) PORT="$2"; shift 2;;
    *) shift;;
  esac
done

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

hyperlink() {
  local url="$1" text="${2:-$1}"
  # OSC 8 hyperlink: clickable in VSCode, iTerm2, GNOME Terminal, Windows Terminal
  printf '\033]8;;%s\033\\%s\033]8;;\033\\' "$url" "$text"
}

OWNED_SERVER=true
SERVER_PID=""
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  if [[ "$OWNED_SERVER" == "true" && -n "${SERVER_PID:-}" ]]; then
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
  fi
  kill $TUNNEL_PID 2>/dev/null || true
  wait $TUNNEL_PID 2>/dev/null || true
  # keep existing server alive if we didn't own it
  if [[ "$OWNED_SERVER" == "false" ]]; then
    echo -e "Local server on $PORT kept running (was already running before)"
  fi
  exit 0
}
trap cleanup INT TERM

echo -e "${CYAN}▶ TridentLab Local Dev${NC}"
echo "  HTML dir: $HTML_DIR"
echo "  Port:     $PORT"
echo ""

# Check dependencies
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found"; exit 1
fi
if ! command -v lt >/dev/null 2>&1 && ! command -v npx >/dev/null 2>&1; then
  echo "Need 'lt' (localtunnel) or npx. Install: npm i -g localtunnel"
  exit 1
fi

if ss -tln 2>/dev/null | grep -q ":$PORT "; then
  echo -e "${YELLOW}● Port $PORT already in use — reusing existing server${NC}"
  OWNED_SERVER=false
  SERVER_PID=""
else
  echo -e "${GREEN}● Starting local server...${NC}"
  python3 -m http.server "$PORT" --directory "$HTML_DIR" &
  SERVER_PID=$!
  sleep 1.5
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Failed to start server on port $PORT"
    exit 1
  fi
fi

LOCAL_URL="http://localhost:$PORT"
echo -e "  Local:   $(hyperlink "$LOCAL_URL" "$LOCAL_URL")  ${GREEN}● ready${NC}"
echo -e "           → Click link above or open: $LOCAL_URL"
echo ""

# Start tunnel
echo -e "${GREEN}● Starting tunnel (localtunnel)...${NC}"
echo -e "  Waiting for public URL..."

TUNNEL_LOG=$(mktemp)
if command -v lt >/dev/null 2>&1; then
  lt --port "$PORT" > "$TUNNEL_LOG" 2>&1 &
else
  npx --yes localtunnel --port "$PORT" > "$TUNNEL_LOG" 2>&1 &
fi
TUNNEL_PID=$!

# Wait up to 20s for URL
PUBLIC_URL=""
for i in $(seq 1 20); do
  if grep -qE 'https://.*\.loca\.lt' "$TUNNEL_LOG"; then
    PUBLIC_URL=$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$TUNNEL_LOG" | head -1)
    break
  fi
  # lt sometimes prints "your url is: https://..."
  if grep -qE 'your url is:' "$TUNNEL_LOG"; then
    PUBLIC_URL=$(grep -oE 'https://[^ ]+' "$TUNNEL_LOG" | head -1)
    break
  fi
  sleep 1
  # check still running
  if ! kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "Tunnel process died. Log:"
    cat "$TUNNEL_LOG"
    if [[ "$OWNED_SERVER" == "true" ]]; then kill $SERVER_PID 2>/dev/null || true; fi
    exit 1
  fi
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo -e "${YELLOW}⚠ Could not parse tunnel URL, showing log:${NC}"
  cat "$TUNNEL_LOG"
  echo ""
  echo "Local server still running at $LOCAL_URL"
  echo "Tunnel log at: $TUNNEL_LOG"
  if [[ "$OWNED_SERVER" == "true" ]]; then wait $SERVER_PID; fi
  exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Ready!${NC}"
echo -e "  Local:  $(hyperlink "$LOCAL_URL" "$LOCAL_URL")"
echo -e "  Public: $(hyperlink "$PUBLIC_URL" "$PUBLIC_URL")  ${YELLOW}← share this${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Click any link above to open in browser${NC} (Ctrl+Click in VSCode)"
echo -e "  Tunnel log: $TUNNEL_LOG"
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop"
echo ""

# Also print plain URLs for terminals without OSC8 support
echo "Plain URLs:"
echo "  Local:  $LOCAL_URL"
echo "  Public: $PUBLIC_URL"
echo ""

tail -f "$TUNNEL_LOG" &
TAIL_PID=$!
if [[ "$OWNED_SERVER" == "true" ]]; then
  wait $SERVER_PID $TUNNEL_PID
else
  wait $TUNNEL_PID
fi
