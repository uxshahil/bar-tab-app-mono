# Bar Tab App

A high-performance, real-time bar management system consisting of a **Vue 3** frontend ("App") and a **Node.js/Express** backend ("API").

## 🚀 Getting Started

### 1. Requirements
- [Node.js 18+](https://nodejs.org/)
- Running instance of `bar-tab-api` (Local or Docker)
- Supabase Project

### 2. Installation
```bash
cd bar-tab-app
npm install
```

### 3. Environment Setup
Create `.env`:
```ini
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_generic_anon_key
VITE_API_URL=http://localhost:3000  # URL of the running bar-tab-api
VITE_VAT=0.15                       # Tax rate configuration
TESTING_USER_EMAIL=johndoe19@example.com
```

### 4. Start Development Server
```bash
npm run dev:fresh
```
*   `dev:fresh` will: **Reset & Seed Database** -> **Generate Types** -> **Start Vite Server**.
*   Running on: `http://localhost:5173` (default)
---

## 🔐 Credentials & Access (RBAC)

**Test User:** `johndoe19@example.com` / `password`

| Role | Access | Powers |
| :--- | :--- | :--- |
| **Admin** | System Config Only | **No Operational Access**. Cannot create or add to tabs. Can only add/edit users and drinks. |
| **Bar Manager** | Full Operations | **Superuser for the Bar**. Can add/edit users, drinks. Can create and manage all tabs. |
| **Bar Staff** | Front-of-House | **Tab Management**. Can create tabs and manage tabs. Cannot edit users or drinks. |

---



## 🛠 Technical Highlights

### ⚡ Real-Time Architecture
*   **Socket.io**: Used for instant communication between the Kitchen/Bar and the POS.
*   **Supabase Realtime**: Subscribes to database changes for live data synchronization.

#### 🔌 Socket Event Reference
The application listens for the following events to trigger effective SWR revalidation:

| Resource | Events |
| :--- | :--- |
| **User** | `user:created` `user:updated` `user:deleted` |
| **Bar** | `bar:created` `bar:updated` `bar:deleted` |
| **Menu** | `menu:created` `menu:updated` `menu:deleted` |
| **Drink** | `drink:created` `drink:updated` `drink:deleted` |
| **Tab** | `tab:created` `tab:updated` |
| **Tab Items** | `tab:item:added` `tab:item:updated` `tab:item:deleted` |

### 🔄 SWR (Stale-While-Revalidate) Strategy
To ensure zero-latency interactions:
1.  **Optimistic UI**: Price updates and Tab changes reflect **instantly** in the UI.
2.  **Background Sync**: The app silently revalidates data with the server.
3.  **Smart Caching**: `useDrinksStore` and other loaders intelligently cache responses to minimize network requests.

### 💎 UX Improvements
*   **Skeleton Loading**: The `AppResourcePage` wrapper automatically renders a `DataTableSkeleton` while data is fetching, providing instant visual feedback and preventing layout shifts.
*   **Persistent Pagination**: The application uses a global Pinia store backed by **LocalStorage** to remember the user's pagination state (Page/Size) for every table. This ensures the user never loses their place, even after a full browser refresh. (`usePaginationStore` + Controlled State).

### 🗄️ Database Seeding
The `npm run dev:fresh` command triggers a robust seeding process (`database/seed.js`), populating the system with a complete set of:
*   Mock Users (Admin, Manager, Staff)
*   Drink Categories & Glassware types
*   Full Menu content