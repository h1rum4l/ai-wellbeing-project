# stressina.AI
## Intelligent Healthcare & Well-being Solution
### A Fuzzy Logic Approach to Real-Time Stress Classification and Adaptive Coping Recommendation

**Application Architecture:** React 19 + TypeScript + Vite + Tailwind CSS  
**Theme:** Liquid Glass (Dark Midnight Navy & Cyan)

---

## 1. Project Overview & Context

**stressina.AI** is an intelligent well-being decision-support system featuring a responsive Liquid Glass user interface. It evaluates three physiological and behavioral indicators:
1. **Heart Rate Variability (HRV)** (20.0 – 120.0 ms)
2. **Daily Screen Time** (0.0 – 16.0 hours)
3. **Sleep Duration** (2.0 – 10.0 hours)

It evaluates these inputs using a **Mamdani-Type Fuzzy Inference System (FIS)** with **centroid defuzzification**, categorizes the continuous **Stress Index (0–100)** into **Low / Medium / High**, passes the category into an independent deterministic **Rule-Based Recommendation Engine**, and generates transparent white-box explanations.

> **Important Educational / Non-Clinical Disclaimer:**  
> This system provides an educational well-being estimate based on the information entered by the user. It is not a medical diagnosis or substitute for professional healthcare advice.

---

## 2. Key Features

1. **Real-Time Assessment:** Interactive sliders for HRV, Screen Time, and Sleep Duration with immediate reactive re-evaluation, centroid defuzzification gauge, category status badges, fuzzification tables, and active rules breakdown.
2. **Dedicated Relax & Breathing Sanctuary:** Interactive guided breathing rhythms (Box 4-4-4-4, 4-7-8 Relaxing, Coherent 5-5) with glowing visual countdown HUD, real-time SVG animated circular timer, phase indicators, sensory grounding (5-4-3-2-1), calm card matching, and mindfulness check-in.
3. **stressina AI Companion:** Floating viewport companion with responsive popup and mobile-ready quick launcher.
4. **My History & Analytics:** Account-scoped assessment history, interactive trend charts of stress index over time, CSV export, and conversation review.
5. **Interactive Membership Functions:** Publication-grade interactive SVG curves for HRV, Screen Time, Sleep, and Stress Output with dynamic markers and centroid defuzzification overlay.
6. **System Architecture Pipeline:** 8-stage interactive computational pipeline walkthrough.
7. **Dataset Evaluation:** Built-in batch validation of 122 synthetic samples, displaying accuracy against reference classifications and stress distribution.
8. **Account & Privacy Controls:** Local user registration and login, password hashing, and privacy toggles.

---

## 3. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

---

## 4. How to Push to GitHub

### Method A: From your local machine (Recommended)

1. **Download or clone the project** to your computer.
2. Open a terminal in the project directory:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Set default branch to main
git branch -M main

# 3. Add all project files
git add .

# 4. Commit files
git commit -m "Initial commit of stressina.AI with Liquid Glass theme"

# 5. Create a new repository on GitHub (via https://github.com/new) named "stressina-ai"

# 6. Link your local repository to GitHub (replace with your GitHub username)
git remote add origin https://github.com/<your-username>/stressina-ai.git

# 7. Push to GitHub
git push -u origin main
```

### Method B: Using GitHub CLI (`gh`)

If you have `gh` installed and authenticated:

```bash
git init
git add .
git commit -m "feat: initial commit of stressina.AI"
gh repo create stressina-ai --public --source=. --remote=origin --push
```

---

## 5. Free Deployment Options from GitHub

Once your code is pushed to GitHub, you can deploy it for free:

- **Vercel**: Import the GitHub repo at [vercel.com/new](https://vercel.com/new). Framework will be auto-detected as **Vite**. Click **Deploy**.
- **Netlify**: Import the repository at [netlify.com](https://app.netlify.com/start). Build command: `npm run build`, Publish directory: `dist`.
- **GitHub Pages**:
  1. In `vite.config.ts`, set `base: '/stressina-ai/'` (replace with your repo name).
  2. In your GitHub repo, go to **Settings > Pages > Build and deployment > Source: GitHub Actions**.
  3. Use the standard Vite / Static HTML workflow to publish on every push.

