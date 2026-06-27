# 🧠 AI AutoCodeReview

 Developed an **AI AutoCodeReview** tool using Node.js, Express, React.js, and Google Generative AI. Enabled
 intelligent feedback generation via POST requests, with syntax highlighting (PrismJS) and Markdown rendering
 for clean code display.

---

## 🚀 Features

- 🤖 **AI-Powered Code Review**  
  Instantly analyzes code and provides intelligent suggestions using Google Generative AI.

- ⚡ **Real-Time Feedback**  
  Submit code and get instant AI-generated reviews via POST requests.

- 🎨 **Syntax Highlighting**  
  Code is displayed with clean, colorful formatting using **PrismJS**.

- 📝 **Markdown Rendering**  
  Feedback is shown in a clean, structured format using **React Markdown**.

- 🔧 **Modular Full-Stack Architecture**  
  Built with a clean separation between frontend and backend for scalability.

---

## 🧰 Tech Stack

### 🔹 Frontend
- React.js (Vite) – Fast, modern frontend setup
- PrismJS – Beautiful syntax highlighting
- React Markdown – Render formatted AI feedback
- Axios – For HTTP requests

### 🔹 Backend
- Node.js & Express.js – Efficient REST API backend
- Google Generative AI (PaLM/Gemini) – Natural language processing & code understanding

---

## 📸 Screenshots

### 🖥️ 1. Home Interface – Code Input and Review Layout

The user lands on a modern interface split into two main sections:
- **Left Panel** – Code input area with syntax highlighting  
- **Right Panel** – Output area showing AI-reviewed feedback, issues, suggestions, and improvements.

![Code Review UI](FrontEnd/public/home.png)


---

### ✏️ 2. Code Input Section
User enters or pastes their code in a text area with syntax highlighting.

![Code Input](FrontEnd/public/input.png)

---

### 🖱️ 3. Click "Review" Button
User clicks the "Review" button to submit code for AI evaluation.

![Review Button](FrontEnd/public/review.png)

---

### 📤 4. AI-Generated Feedback Output
AI responds with clean, Markdown-formatted suggestions and improvements.

![AI Output](FrontEnd/public/output.png)

## 🚀 Deploy to Render

This project is configured for deployment on Render as two separate services:

| Service | Type | Directory |
|---------|------|-----------|
| Backend API | Web Service (Node) | `BackEnd/` |
| Frontend UI | Static Site | `FrontEnd/` |

### Prerequisites

- A [Render](https://render.com) account
- A Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### Environment Variables

Set these in the Render dashboard (or use the included `render.yaml` Blueprint):

**Backend Web Service:**
| Variable | Description |
|----------|-------------|
| `PORT` | Leave as `3000` (Render overrides this) |
| `GOOGLE_GEMINI_KEY` | Your Google Gemini API key |
| `CORS_ORIGIN` | Frontend URL, e.g. `https://your-frontend.onrender.com` |

**Frontend Static Site:**
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL, e.g. `https://your-backend.onrender.com` |

### One-Click Deploy (Blueprint)

A `render.yaml` is included. Connect your GitHub repo to Render and it will auto-detect the services.

### Manual Deploy Steps

1. **Create a Web Service** for the backend:
   - Root Directory: `BackEnd`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add the environment variables from the table above

2. **Create a Static Site** for the frontend:
   - Root Directory: `FrontEnd`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add Rewrite Rule: `/*` → `/index.html`
   - Add the `VITE_API_URL` environment variable

### Local Development

```bash
# Terminal 1 - Backend
cd BackEnd
cp .env.example .env   # fill in your GOOGLE_GEMINI_KEY
npm install
npm run dev

# Terminal 2 - Frontend
cd FrontEnd
npm install
npm run dev
```

The frontend dev server at `http://localhost:5173` proxies API calls to the backend at `http://localhost:3000`.

---
