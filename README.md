# AI-Powered Jewellery Manufacturing Assistant 💎

A full-stack **MERN** business dashboard for jewellery manufacturing management. Manage orders, track inventory, assign workers, and leverage **Groq AI** for design ideas and business intelligence.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Auth | JWT-based login & signup with role-based access |
| 📦 Orders | Full CRUD — create, track, assign, and update orders with status & priority |
| 🗃️ Inventory | Manage raw materials with low-stock alerts and real-time value tracking |
| 👷 Workers | Craftsman management with specializations, availability tracking |
| 🤖 AI Design | Generate jewellery design ideas using Groq Llama AI |
| 💬 AI Chat Agent | Floating chat widget that answers live business questions |
| 📊 Dashboard | Charts (bar + pie) with KPI cards and recent orders |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Groq SDK (llama-3.3-70b-versatile) |
| HTTP Client | Axios |
| Charts | Recharts |
| Routing | React Router v6 |

---

## 📁 Project Structure

```
jewellery-assistant/
├── server/                    # Express backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Order.js
│   │   ├── Inventory.js
│   │   └── Worker.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── inventoryController.js
│   │   ├── workerController.js
│   │   └── aiController.js      ← Groq AI logic
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── workerRoutes.js
│   │   └── aiRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── index.js
│   ├── .env                 ← Your secrets go here (never commit)
│   └── .env.example
└── client/                    # React frontend
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   ├── Dashboard.jsx
        │   ├── Orders.jsx
        │   ├── Inventory.jsx
        │   ├── Workers.jsx
        │   └── AIDesignAssistant.jsx
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   ├── Navbar.jsx
        │   ├── StatCard.jsx
        │   ├── Modal.jsx
        │   ├── ChatWidget.jsx
        │   └── ProtectedRoute.jsx
        ├── services/
        │   ├── api.js          ← Axios instance + interceptors
        │   └── services.js     ← API call functions
        └── context/
            └── AuthContext.jsx
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))
- [Groq API Key](https://console.groq.com) (free)

---

### Step 1 — Clone and Install

```bash
# Clone the repo
git clone <your-repo-url>
cd jewellery-assistant

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

### Step 2 — Environment Setup

```bash
# In server/ directory
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/jewellery-assistant
JWT_SECRET=your_random_secret_here
GROQ_API_KEY=gsk_your_groq_key_here
CLIENT_URL=http://localhost:5173
```

> **Get your Groq API key for free:** https://console.groq.com

---

### Step 3 — Run the Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd jewellery-assistant/server
npm run dev
```
Backend runs on: `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd jewellery-assistant/client
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | ✗ |
| POST | `/api/auth/login` | Login + JWT | ✗ |
| GET | `/api/auth/me` | Get current user | ✓ |
| GET/POST | `/api/orders` | List / Create orders | ✓ |
| GET/PUT/DELETE | `/api/orders/:id` | Get / Update / Delete order | ✓ |
| GET | `/api/orders/stats` | Order statistics | ✓ |
| GET/POST | `/api/inventory` | List / Add items | ✓ |
| GET/PUT/DELETE | `/api/inventory/:id` | Manage item | ✓ |
| GET/POST | `/api/workers` | List / Add workers | ✓ |
| GET/PUT/DELETE | `/api/workers/:id` | Manage worker | ✓ |
| POST | `/api/ai/design` | Generate design ideas | ✓ |
| POST | `/api/ai/chat` | Business chat agent | ✓ |

---

## 💡 AI Features

### 🎨 Design Assistant (`/ai-design`)
- Enter a description of any jewellery piece
- Optional filters: metal type, style, occasion
- AI returns 2-3 detailed design concepts including:
  - Design concept and aesthetic
  - Metal & stone recommendations
  - Crafting techniques
  - Approximate cost estimates

### 💬 Business Chat Agent (floating button)
- Fetches **live data** from your MongoDB before each response
- Can answer questions like:
  - *"How many pending orders do we have?"*
  - *"Which items are running low on stock?"*
  - *"Which workers are available right now?"*
  - *"Is JWL-0003 overdue?"*

---

## 📦 Production Build

```bash
cd client
npm run build
```

To serve the built frontend from the Express server, copy the `dist/` folder to `server/public/` and add this to `server/index.js`:

```js
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
```

---

## 🔒 Security Notes

- Never commit your `.env` file — it's in `.gitignore`
- Change `JWT_SECRET` to a long random string before deploying
- Use environment variables in your hosting platform (Render, Railway, etc.)

---

## 📄 License

MIT — feel free to use and modify.

---

Built with ❤️ for Indian jewellery manufacturers.
