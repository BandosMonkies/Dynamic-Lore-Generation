#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start_npc_server.sh
#
# Launch the Qwen NPC AI Flask server.
# Run this FIRST, then start the Phaser game with: npm run dev
#
# Usage:
#   cd ML-MODEL-SERVER
#   bash start_npc_server.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Qwen NPC AI Server — Launcher                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Model  : ./Qwen-NPC-INT4                                   ║"
echo "║  Server : http://localhost:5000                              ║"
echo "║  Game   : http://localhost:5173  (npm run dev)              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verify model directory exists
if [ ! -d "./Qwen-NPC-INT4" ]; then
  echo "❌ ERROR: Model directory './Qwen-NPC-INT4' not found."
  echo "   Make sure you're running this from inside ML-MODEL-SERVER/"
  exit 1
fi

echo "🚀 Starting Flask server..."
python3 server.py
