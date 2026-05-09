# ShowUp2Move 🏃⚽🏀

> **Get on the pitch in minutes.**  
> A sports matchmaking web app that connects players, forms teams, and coordinates games — all in one click.

---

## 🎯 The Problem

You want to play football on Saturday. You text 10 friends. 3 reply. Nobody shows up.  
**ShowUp2Move fixes this.**

---

## 💡 What It Does

- Click **ShowUpToday?** when you're ready to play
- The system finds compatible nearby players
- Forms a group automatically
- Assigns a captain
- Creates an event
- Everyone chats and votes on a venue
- Just show up and play

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS |
| Backend | PHP (no framework) |
| Server | XAMPP (Apache) |
| Database | MySQL |
| DB Manager | phpMyAdmin |
| HTTP Requests | Axios |
| Tunnel | Ngrok |
| AI | Groq API |
| Maps | Leaflet + OpenStreetMap |

---

## 👥 User Roles

### 👤 Member
- Set sport, skill level, location, availability
- Click ShowUpToday to enter the matching pool
- Browse and join open events
- Filter events by sport, sort by time or players
- Chat with group members
- Vote on venues
- View joined events (persists after refresh)

### ⚽ Captain
- Create events with sport, time, location, group size
- Manage team members
- Open venue votes
- Post chat announcements
- Track player confirmations

---

## 🗄️ Database — 15 Tables

```
users               All user accounts
sports_profiles     Sport, skill, location per user
user_sports         Which sports each user plays
availability_log    Daily availability responses
events              All sports events
event_members       Who joined which event
groups              Auto-formed player groups
group_members       Players in each group
chat_messages       Group chat messages
venues              Sports locations with coordinates
venue_polls         Venue voting polls
venue_poll_options  Poll choices
venue_votes         Member votes
notifications       System notifications
sport_rules         Min/max players per sport
```

---

## ✅ Features

- Real token-based authentication
- Role-based routing (Member / Captain)
- ShowUpToday daily availability prompt
- Smart player matching with fit scores
- Open Events + Joined Events tabs
- Filter by sport, sort by time or players
- Captain creates real events saved to MySQL
- Group chat saved to database, polls every 3s
- Interactive venue map with Leaflet
- Venue voting system
- Everything persists after page refresh

---

## 🚀 How To Run Locally

### Requirements
- XAMPP (Apache + MySQL)
- Node.js + npm

### Backend Setup
```
1. Start XAMPP — Apache + MySQL
2. Place backend folder in: C:/xampp/htdocs/donortrace/
3. Open phpMyAdmin: http://localhost/phpmyadmin
4. Create database called: donortrace
5. Import migration SQL files from: /backend/migrations/
```

### Frontend Setup
```
cd frontend
npm install
npm run dev
```

### Open The App
```
http://localhost:5173
```

---

## 📁 Project Structure

```
hack2026/
├── backend/
│   ├── api/
│   │   ├── auth/         login, register
│   │   ├── events/       list, create, join
│   │   ├── profile/      get, update
│   │   ├── availability/ respond, today
│   │   ├── matching/     run, status
│   │   ├── chat/         send, list
│   │   └── venues/       list, vote
│   ├── config/
│   │   ├── database.php
│   │   └── auth.php
│   └── migrations/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/     api.js
│   │   ├── contexts/     AuthContext.jsx
│   │   └── hooks/
│   └── vite.config.js
└── README.md
```

---

## 🎬 Demo Flow

1. Register as Member → set sport Football
2. Click ShowUpToday → pick Evening
3. Go to Match → see available players with fit scores
4. Go to Events → browse open games
5. Click Join → go to Joined tab → refresh → still there ✅
6. Login as Captain → create a new event
7. Member sees it instantly → joins
8. Captain opens chat → coordinates with team

---

## 👨‍💻 Built By

**umarkhattak256** — Hackathon 2026

---

> *ShowUp2Move removes every excuse not to show up. You say yes — we handle the rest.*