# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — Vite + Phaser Frontend (Node dev server)
#
# Uses node:20-alpine for a small image.
# Runs `npm run dev -- --host` so Vite binds to 0.0.0.0 (required in Docker).
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine

# ---------- working directory -------------------------------------------------
WORKDIR /app

# ---------- install deps (cached layer) --------------------------------------
# Copy manifests first — layer is reused if only source files change.
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# ---------- copy project source -----------------------------------------------
COPY index.html .
COPY vite.config.js .
COPY src/ ./src/
COPY public/ ./public/

# ---------- runtime -----------------------------------------------------------
EXPOSE 3000

# --host     → bind to 0.0.0.0 instead of 127.0.0.1 (needed inside Docker)
# --port 3000 → match the port in vite.config.js
CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]
