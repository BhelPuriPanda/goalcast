# ⚡ Goalcast

> **Real-time sports match tracker with live commentary — zero refresh required.**

Goalcast is a full-stack, event-driven sports platform that streams live match scores and commentary to every connected viewer the instant they happen. Built on a WebSocket-first architecture, it eliminates the need for polling or manual refreshes — new matches and commentary events propagate to all clients in milliseconds.

https://github.com/user-attachments/assets/575abf8f-5913-438a-8074-5c206e694aae

---

## ✨ Features

- 🔴 **Live match cards** — scores, teams, sport type, and an auto-calculated status (`scheduled → live → finished`) based on real time
- ⚡ **Real-time updates via WebSocket** — new matches appear in the lobby and commentary entries slide into the feed instantly, without a page reload
- 🎙️ **Per-match commentary feed** — timeline-style event log with icons for goals ⚽, cards 🟨🟥, substitutions 🔄, and more
- 🌐 **Viewer-only client** — a read-only, premium dark UI designed for audiences; data is managed server-side
- 🔒 **Rate limiting & security** via Arcjet (configurable)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Client                     │
│         (Vite · React Router · WebSocket)           │
│                                                     │
│  MatchesPage ──────────────── MatchDetailPage       │
│  (match lobby grid)           (score + feed)        │
└──────────────┬──────────────────────┬───────────────┘
               │ HTTP GET             │ WS subscribe
               ▼                      ▼
┌─────────────────────────────────────────────────────┐
│                  Express Server                     │
│              (Node.js · HTTP + WS)                  │
│                                                     │
│  REST API (/matches, /matches/:id/commentary)       │
│  WebSocket Server (/ws) — pub/sub per match         │
└──────────────────────────┬──────────────────────────┘
                           │ Drizzle ORM
                           ▼
                  ┌─────────────────┐
                  │  Neon Postgres  │
                  │  (serverless)   │
                  └─────────────────┘
```

**WebSocket event flow:**

| Event | Trigger | Delivered To |
|-------|---------|--------------|
| `match-created` | `POST /matches` | All connected clients |
| `commentary-added` | `POST /matches/:id/commentary` | Clients subscribed to that match |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 7, React Router v6 |
| Styling | Vanilla CSS (custom design system) |
| HTTP Client | Axios |
| Real-time | Native WebSocket API |
| Backend | Node.js, Express |
| WebSocket Server | `ws` library |
| ORM | Drizzle ORM |
| Database | Neon (serverless PostgreSQL) |
| Validation | Zod |
| Security | Arcjet |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database

### 1. Clone the repo

```bash
git clone https://github.com/BhelPuriPanda/goalcast.git
cd goalcast
```

### 2. Configure the server

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL and other vars
npm install
npm run db:push        # push schema to Neon
```

### 3. Start the backend

```bash
npm run start
# Server running at http://localhost:8000
# WebSocket at ws://localhost:8000/ws
```

### 4. Start the frontend

```bash
cd ../client
npm install
npm run dev
# Viewer at http://localhost:5173
```

---

## 📡 API Reference

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/matches?limit=N` | List matches (newest first, max 100) |
| `POST` | `/matches` | Create a new match |

**Create match — request body:**
```json
{
  "sport": "Football",
  "homeTeam": "Real Madrid",
  "awayTeam": "Barcelona",
  "startTime": "2026-03-12T14:00:00.000Z",
  "endTime": "2026-03-12T16:00:00.000Z"
}
```

> Match `status` is auto-derived from `startTime` / `endTime` vs. current time.

---

### Commentary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/matches/:id/commentary?limit=N` | List commentary for a match |
| `POST` | `/matches/:id/commentary` | Add a commentary event |

**Add commentary — request body:**
```json
{
  "minute": 23,
  "period": "First Half",
  "eventType": "goal",
  "actor": "Vinicius Jr",
  "team": "Real Madrid",
  "message": "GOAL! Vinicius Jr slots it home after a brilliant run!"
}
```

**Supported `eventType` values and their icons:**

| `eventType` | Icon |
|------------|------|
| `goal` | ⚽ |
| `yellow_card` | 🟨 |
| `red_card` | 🟥 |
| `substitution` | 🔄 |
| `foul` | ⚠️ |
| `penalty` | 🎯 |
| `save` | 🧤 |
| `var` | 📺 |
| `injury` | 🩹 |
| `comment` | 💬 |

---

## 📁 Project Structure

```
goalcast/
├── server/
│   ├── server.js                  # Entry — Express + WebSocket bootstrap
│   └── src/
│       ├── routes/
│       │   ├── matches.js         # GET & POST /matches
│       │   └── commentary.js      # GET & POST /matches/:id/commentary
│       ├── db/
│       │   ├── db.js              # Drizzle client
│       │   └── schema.js          # matches + commentary tables
│       ├── ws/
│       │   └── ws-server.js       # WebSocket pub/sub engine
│       ├── validation/
│       │   ├── matches.js         # Zod schemas for matches
│       │   └── commentary.js      # Zod schemas for commentary
│       └── utils/
│           └── match-status.js    # scheduled / live / finished logic
│
└── client/
    ├── vite.config.js             # Proxy /matches + /ws → localhost:8000
    └── src/
        ├── api/api.js             # Axios GET helpers
        ├── ws/ws.js               # WebSocket singleton + auto-reconnect
        ├── components/
        │   ├── MatchCard.jsx
        │   ├── MatchList.jsx
        │   ├── StatusBadge.jsx
        │   └── CommentaryItem.jsx
        └── pages/
            ├── MatchesPage.jsx    # Live match lobby
            └── MatchDetailPage.jsx # Score header + commentary feed
```

---

## 🧑‍💻 Development Notes

- The Vite dev server proxies `/matches` and `/ws` to `localhost:8000`, so no CORS setup is needed locally.
- The WebSocket client maintains a **single persistent connection** shared across all pages and auto-reconnects on drop.
- Match status (`scheduled`, `live`, `finished`) is calculated purely from `startTime` and `endTime` — no manual status field is needed when creating a match.

---

## 📄 License

MIT
