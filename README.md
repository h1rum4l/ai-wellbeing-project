<div align="center">

<img src="https://img.shields.io/badge/stressina.AI-Intelligent%20Wellbeing-06b6d4?style=for-the-badge&logo=react&logoColor=white" alt="stressina.AI"/>

# 🧠 stressina.AI
### Intelligent Healthcare & Well-being Solution

> **A Fuzzy Logic approach to Real-Time Stress Classification and Adaptive Coping Recommendations**

---

![Node.js](https://img.shields.io/badge/Node.js-v22.13%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Built--in-003B57?style=flat-square&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-FB923C?style=flat-square&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-Educational-8B5CF6?style=flat-square)

</div>

---

## 📋 Table of Contents

- [🌟 Project Overview](#-project-overview)
- [🏗️ System Architecture](#️-system-architecture)
- [🤖 AI / Fuzzy Logic Engine](#-ai--fuzzy-logic-engine)
- [✨ Key Features](#-key-features)
- [🔧 Technology Stack](#-technology-stack)
- [📦 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔑 Demo Credentials](#-demo-credentials)
- [🌐 Available Scripts](#-available-scripts)
- [☁️ Deployment Options](#️-deployment-options)
- [⚠️ Disclaimer](#️-disclaimer)

---

## 🌟 Project Overview

**stressina.AI** is a full-stack intelligent well-being decision-support system with a **Liquid Glass** UI theme (Dark Midnight Navy & Cyan). It evaluates three physiological and behavioral indicators:

| # | Input | Range |
|---|---|---|
| 1 | 💓 **Heart Rate Variability (HRV)** | 20.0 – 120.0 ms |
| 2 | 📱 **Daily Screen Time** | 0.0 – 16.0 hours |
| 3 | 😴 **Sleep Duration** | 2.0 – 10.0 hours |

These inputs are processed by a **Mamdani-Type Fuzzy Inference System (FIS)** with **centroid defuzzification**, producing a continuous **Stress Index (0–100)** classified into:

<div align="center">

| 🟢 Low | 🟡 Medium | 🔴 High |
|:---:|:---:|:---:|
| Stress Index 0–40 | Stress Index 40–65 | Stress Index 65–100 |

</div>

The system then passes the category into an **independent Rule-Based Recommendation Engine** and generates transparent **white-box explanations** for every decision.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (React Frontend)                     │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │  Assessment  │  │  AI Chat / Panda│  │  History / Quests │  │
│  │     Tab      │  │    Companion    │  │     / Games       │  │
│  └──────┬───────┘  └────────┬────────┘  └────────┬──────────┘  │
│         │                   │                     │             │
│  ┌──────▼───────────────────▼─────────────────────▼──────────┐  │
│  │               Fuzzy Logic Inference Engine                 │  │
│  │  Fuzzification → Rule Evaluation → Aggregation → Defuzz   │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │ REST API calls                    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │  Express.js API     │  :8787
                   │  (Node.js v22.13+)  │
                   └──────────┬──────────┘
                              │
                   ┌──────────▼──────────┐
                   │   SQLite Database   │
                   │  (node:sqlite)      │
                   │  stressina.sqlite   │
                   └─────────────────────┘
```

---

## 🤖 AI / Fuzzy Logic Engine

The core intelligence runs **entirely in the browser** — no external AI API calls needed.

```
Input Values (HRV, Screen Time, Sleep)
         │
         ▼
  ┌─────────────┐
  │Fuzzification│  → Triangular membership functions per variable
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │Rule Engine  │  → 27 IF-THEN Mamdani rules (MIN operator)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ Aggregation │  → MAX union of clipped fuzzy sets
  └──────┬──────┘
         ▼
  ┌─────────────────┐
  │  Defuzzification│  → Centroid method → crisp stress index
  └──────┬──────────┘
         ▼
  ┌─────────────────────────────┐
  │ Classification + Recommend  │  → Low / Medium / High + tips
  └─────────────────────────────┘
```

| Module | File | Purpose |
|---|---|---|
| 🧮 Inference Engine | `src/engine/inference.ts` | Full Mamdani FIS pipeline |
| 📐 Membership Functions | `src/engine/membership.ts` | Triangular MF computation |
| 📜 Fuzzy Rules | `src/engine/rules.ts` | All 27 IF-THEN rules |
| ⚙️ Fuzzy Config | `src/engine/fuzzyConfig.ts` | Universe of discourse config |
| 🏷️ Classifier | `src/engine/classifier.ts` | Crisp → Low/Medium/High |
| 💡 Recommendations | `src/recommendation/` | Personalized coping tips |
| 🔍 Explanations | `src/explanation/` | White-box XAI rationale |
| 💬 Chat Assistant | `src/chat/assistant.ts` | Rule-based wellbeing bot |

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🎯 Core Assessment
- Real-time sliders for HRV, Screen Time & Sleep
- Live centroid defuzzification gauge
- Active rules breakdown & fuzzification tables
- Stress index trend charts & CSV export

</td>
<td width="50%">

### 🌿 Relax & Breathing Sanctuary
- Box breathing (4-4-4-4), 4-7-8, Coherent 5-5
- Glowing SVG animated circular timer
- 5-4-3-2-1 sensory grounding exercises
- Calm card matching mini-game

</td>
</tr>
<tr>
<td width="50%">

### 🐼 Stressina AI Companion
- Floating interactive panda mascot
- Context-aware wellbeing conversations
- Pattern-matched empathetic responses
- Mobile-ready quick launcher dock

</td>
<td width="50%">

### 📊 History  & Analytics
- Account-scoped assessment history
- Interactive stress trend visualizations
- Chat conversation review
- Streak system & quest tracking

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Account & Privacy
- Secure registration & login
- bcrypt password hashing
- JWT authentication (7-day tokens)
- Privacy toggles + full data export/delete

</td>
<td width="50%">

### 📈 Dataset & Architecture
- 122-sample synthetic batch validation
- 8-stage computational pipeline walkthrough
- Interactive membership function SVG curves
- Publication-grade accuracy metrics

</td>
</tr>
</table>

---

## 🔧 Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| ⚛️ React | 19.x | UI framework |
| 🔷 TypeScript | 5.7.x | Type safety |
| ⚡ Vite | 6.x | Build tool & dev server |
| 🎨 TailwindCSS | 4.x | Utility-first styling |
| 🎯 Lucide React | latest | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| 🟢 Node.js | ≥ 22.13.0 | Runtime (required) |
| 🚂 Express | 5.x | REST API server |
| 🗃️ SQLite | Built-in `node:sqlite` | Persistent storage |
| 🔑 jsonwebtoken | 9.x | JWT authentication |
| 🔒 bcryptjs | 3.x | Password hashing |
| 🛡️ Helmet | 8.x | Security headers |
| 🚦 express-rate-limit | 8.x | API rate limiting |

---

## 📦 Project Structure

```
ai-wellbeing-project/
│
├── 📁 server/
│   ├── index.js          ← Express REST API (auth, assessments, chats, habits)
│   └── db.js             ← SQLite schema + demo data seeding
│
├── 📁 src/
│   ├── 📁 engine/        ← 🤖 Fuzzy Logic inference engine (runs in browser)
│   │   ├── inference.ts  ← Main FIS pipeline
│   │   ├── membership.ts ← Triangular MF functions
│   │   ├── rules.ts      ← 27 IF-THEN fuzzy rules
│   │   ├── fuzzyConfig.ts← Universe of discourse config
│   │   └── classifier.ts ← Stress category labeling
│   │
│   ├── 📁 chat/          ← 💬 Rule-based AI chat
│   ├── 📁 recommendation/← 💡 Coping strategy engine
│   ├── 📁 explanation/   ← 🔍 XAI explanation engine
│   │
│   ├── 📁 components/
│   │   ├── 📁 tabs/      ← Assessment, Chat, History, Quests, etc.
│   │   ├── 📁 views/     ← Home, HelpCare, StressinaCorner
│   │   ├── 📁 games/     ← StressCrush relaxation game
│   │   ├── 📁 mascot/    ← 🐼 Stressina Panda companion
│   │   ├── 📁 auth/      ← Login & Register modal
│   │   ├── 📁 common/    ← Shared UI components
│   │   └── 📁 visualizations/ ← Charts & diagrams
│   │
│   ├── 📁 storage/       ← API client + Zustand-style stores
│   ├── 📁 types/         ← TypeScript interfaces
│   └── 📁 utils/         ← Sound, haptics, voice utilities
│
├── 📁 data/              ← Auto-created: SQLite DB + JWT secret (gitignored)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

> [!IMPORTANT]
> **Node.js v22.13 or higher is required.** The backend uses Node's built-in `node:sqlite` module which was introduced in Node 22.

```bash
# Verify your Node.js version (must be ≥ 22.13.0)
node --version

# Verify npm
npm --version
```

### Installation & Run

```bash
# 1️⃣ Clone the repository
git clone https://github.com/h1rum4l/ai-wellbeing-project.git
cd ai-wellbeing-project

# 2️⃣ Install all dependencies
npm install

# 3️⃣ Start both API server + frontend together
npm run dev
```

The terminal will show:
```
[api] Stressina API listening on :8787
[web]   ➜  Local:   http://localhost:3000/
```

**Open your browser at → `http://localhost:3000`** 🎉

---

## 🔑 Demo Credentials

Two demo accounts are **auto-seeded** on first run — no signup needed:

| Account | Email | Password |
|---|---|---|
| 🐼 Primary Demo | `maya@stressina.ai` | `stressina123` |
| 👤 Alt Demo | `maya@example.com` | `password123` |

You can also register a new account directly in the UI.

---

## 🌐 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | 🚀 Start API + frontend together **(recommended)** |
| `npm run dev:web` | ⚡ Start only the Vite frontend |
| `npm run dev:api` | 🔧 Start only the Express API |
| `npm run build` | 📦 Build frontend for production |
| `npm run start` | 🏭 Run production build (requires `build` first) |
| `npm run lint` | ✅ TypeScript type checking |
| `npm run preview` | 👁️ Preview production build locally |

### Port Reference

| Service | Port | URL |
|---|---|---|
| 🌐 Frontend | 3000 | `http://localhost:3000` |
| 🔧 Backend API | 8787 | `http://localhost:8787/api/health` |

---

## ☁️ Deployment Options

Once pushed to GitHub, deploy for free:

### ▲ Vercel *(Recommended)*
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import this GitHub repository
3. Framework auto-detected as **Vite**
4. Click **Deploy** ✅

### 🌐 Netlify
1. Go to [app.netlify.com/start](https://app.netlify.com/start)
2. Import the repository
3. Set **Build command:** `npm run build`
4. Set **Publish directory:** `dist`

### 📄 GitHub Pages
1. In `vite.config.ts`, set `base: '/ai-wellbeing-project/'`
2. Go to **Settings → Pages → Source: GitHub Actions**
3. Use the standard Vite workflow to publish on every push

---

## ⚠️ Disclaimer

> **Educational / Non-Clinical Use Only**
>
> stressina.AI provides educational well-being estimates based on user-entered data. It is **not a medical diagnosis** and is **not a substitute for professional healthcare advice**. If you are experiencing significant distress, please consult a qualified health professional.

---

<div align="center">

**Built with ❤️ for student wellbeing**

![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)
![Powered by Fuzzy Logic](https://img.shields.io/badge/Powered%20by-Fuzzy%20Logic-8B5CF6?style=flat-square)
![Node.js Required](https://img.shields.io/badge/Requires-Node.js%20v22.13%2B-339933?style=flat-square&logo=nodedotjs)

</div>
