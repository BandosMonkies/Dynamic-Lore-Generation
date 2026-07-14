# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
from transformers import AutoTokenizer, AutoModelForCausalLM
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import json
import re
import os

# ── Config ────────────────────────────────────────────────────────────────────

MERGED_MODEL_PATH = "./Qwen-NPC-INT4"   # Path to the merged model folder
SERVER_PORT = 5000
# Vite dev server port can be 3000, 5173, 5174, etc. Allow all localhost origins.
GAME_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# ── System Prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are the Tsushima NPC AI Engine. "
    "You receive structured game context and must respond as the specified NPC character. "
    "Output a valid JSON object containing EXACTLY these four keys: "
    "'thoughts' (the NPC's internal reasoning, 1-2 sentences), "
    "'emotion' (current emotion string, e.g. 'wary', 'neutral', 'happy', 'angry', 'sad', 'excited', 'fearful', 'stern'), "
    "'action' (current action string, e.g. 'idle', 'walking', 'working', 'sleeping'), "
    "'dialogue' (what the NPC says aloud to the player, 1-3 sentences, in-character). "
    "Respond ONLY with the JSON object. No extra text, no markdown, no code fences."
)

# ── Model Loading ─────────────────────────────────────────────────────────────

print("=" * 60)
print("[NPC-AI Server] Loading Qwen NPC model...")
print(f"[NPC-AI Server] Model path: {MERGED_MODEL_PATH}")
print("=" * 60)

model = AutoModelForCausalLM.from_pretrained(
    MERGED_MODEL_PATH,
    dtype=torch.float16,
    device_map="auto",
    local_files_only=True,
)
model.eval()

tokenizer = AutoTokenizer.from_pretrained(
    MERGED_MODEL_PATH,
    local_files_only=True,
)

print("=" * 60)
print("[NPC-AI Server] ✅ Model loaded successfully. Starting Flask server...")
print("=" * 60)

# ── Flask App ─────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app, origins=GAME_ORIGINS)


# ── Helpers ───────────────────────────────────────────────────────────────────

def build_user_prompt(payload: dict) -> str:
    """
    Converts the structured JSON payload from the game engine into a
    natural language prompt for the NPC model.
    """
    npc = payload.get("npc", {})
    player = payload.get("player", {})
    world = payload.get("world_state", {})
    relationships = payload.get("relationships", [])
    memory_log = payload.get("memory_log", "").strip()
    trigger_event = payload.get("trigger_event", "Player is speaking to you.")
    quest_context = payload.get("quest_context", [])

    # --- NPC identity block ---
    lines = [
        f"NPC: {npc.get('name', 'Unknown')}",
        f"Role: {npc.get('role', 'Villager')}",
        f"Personality: {npc.get('personality', 'calm and reserved')}",
        f"Current Emotion: {npc.get('emotion', 'neutral')}",
        f"Reputation: {npc.get('reputation', 0)}",
    ]

    # --- Relationship block ---
    if relationships:
        rel_strs = []
        for rel in relationships:
            char = rel.get("character", "Unknown")
            status = rel.get("status", "acquaintance")
            value = rel.get("value", 0)
            rel_strs.append(f"{char} ({status}, bond={value})")
        lines.append(f"Relationships: {', '.join(rel_strs)}")

    # --- World state block ---
    if world:
        phase = world.get("phase", "day")
        hour = world.get("hour", 12)
        weather = world.get("weather", "clear")
        day = world.get("day", 1)
        lines.append(f"World State: Day {day}, {hour:02d}:00 [{phase.upper()}], Weather: {weather}")

    # --- Memory log ---
    if memory_log:
        lines.append(f"Memory Log: {memory_log}")

    # --- Quest context ---
    if quest_context:
        quest_strs = [f"'{q}'" for q in quest_context]
        lines.append(f"Active Quests involving NPC: {', '.join(quest_strs)}")

    # --- Player identity ---
    player_name = player.get("name", "Jin Taira")
    player_location = player.get("location", "unknown village")
    lines.append(f"Player: {player_name} in {player_location}")

    # --- The trigger event (what caused this conversation) ---
    lines.append(f"Trigger Event: {trigger_event}")

    return "\n".join(lines)


def parse_model_output(raw_text: str) -> dict:
    """
    Robustly extracts the JSON object from the model's raw output.
    Falls back to a safe default if parsing fails.
    """
    # Try direct JSON parse first
    try:
        return json.loads(raw_text.strip())
    except json.JSONDecodeError:
        pass

    # Try to extract JSON object from within the text using regex
    match = re.search(r'\{.*?\}', raw_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Fallback: return a safe default structure
    print(f"[NPC-AI Server] ⚠️  Could not parse model output as JSON. Raw: {repr(raw_text[:200])}")
    return {
        "thoughts": "I am unsure how to respond.",
        "emotion": "neutral",
        "action": "idle",
        "dialogue": raw_text.strip()[:300] if raw_text.strip() else "..."
    }


def run_inference(user_prompt: str, max_new_tokens: int = 150) -> tuple[str, float]:
    """
    Runs inference through the Qwen model and returns (raw_text, elapsed_seconds).
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(text, return_tensors="pt").to(model.device)

    start_time = time.time()
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            temperature=None,
            top_p=None,
            pad_token_id=tokenizer.eos_token_id,
        )
    elapsed = time.time() - start_time

    # Decode only the newly generated tokens (strip the prompt)
    raw_text = tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True
    )
    return raw_text, elapsed


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Simple liveness check endpoint for the game engine to poll."""
    return jsonify({"status": "ok", "model": "Qwen-NPC-INT4"}), 200


@app.route("/npc/infer", methods=["POST"])
def npc_infer():
    """
    Main inference endpoint.

    Expects a JSON body matching the game engine's NPCAIManager payload schema.
    Returns a structured JSON response with the NPC's thoughts, emotion, action, and dialogue.
    """
    if not request.is_json:
        return jsonify({"success": False, "error": "Request must be application/json"}), 400

    payload = request.get_json(force=True)

    # Extract optional inference params
    max_new_tokens = int(payload.get("max_new_tokens", 150))
    npc_id = payload.get("npc", {}).get("id", "unknown")

    print(f"\n[NPC-AI Server] 🎮 Infer request for NPC: '{npc_id}'")

    try:
        # Build prompt from game state
        user_prompt = build_user_prompt(payload)
        print(f"[NPC-AI Server] Prompt:\n{user_prompt}\n")

        # Run model inference
        raw_output, inference_time = run_inference(user_prompt, max_new_tokens)
        print(f"[NPC-AI Server] Raw output: {repr(raw_output)}")
        print(f"[NPC-AI Server] ⏱  Inference time: {inference_time:.2f}s")

        # Parse model output into structured dict
        npc_response = parse_model_output(raw_output)

        return jsonify({
            "success": True,
            "npc_id": npc_id,
            "response": npc_response,
            "inference_time": round(inference_time, 2)
        }), 200

    except Exception as e:
        print(f"[NPC-AI Server] ❌ Inference error: {e}")
        return jsonify({
            "success": False,
            "npc_id": npc_id,
            "error": str(e)
        }), 500


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"[NPC-AI Server] 🚀 Running on http://localhost:{SERVER_PORT}")
    print(f"[NPC-AI Server] 🌐 CORS allowed for: {GAME_ORIGINS}")
    print(f"[NPC-AI Server] Endpoints:")
    print(f"  GET  /health     — Liveness check")
    print(f"  POST /npc/infer  — NPC inference")
    app.run(host="0.0.0.0", port=SERVER_PORT, debug=False)
