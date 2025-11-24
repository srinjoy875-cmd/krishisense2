# KrishiSense - Manual Deployment Guide (No Terminal) 🖱️

This guide uses **GitHub Desktop** and the website. No terminal commands needed!

---

## Phase 1: Create Repository on GitHub

1.  Go to [GitHub.com](https://github.com) and sign in.
2.  Click the **+** icon (top right) -> **New repository**.
3.  Name it: `krishisense2`.
4.  **IMPORTANT:** Check **"Add a README file"**.
5.  Click **Create repository**.

---

## Phase 2: Upload Code using GitHub Desktop

1.  Open **GitHub Desktop**.
2.  Go to **File** -> **Clone Repository**.
3.  Select `krishisense2` (the one you just made) and click **Clone**.
4.  **Open the folder** where you cloned it (usually `Documents\GitHub\krishisense2`).
5.  **Copy ALL your project files** (backend, frontend, firmware, etc.) from your Desktop folder (`KrishiSense-Web-App`) into this new `krishisense2` folder.
6.  Back in **GitHub Desktop**, you will see all the green files.
7.  Type a summary (e.g., "Initial upload") and click **Commit to main**.
8.  Click **Push origin**.

---

## Phase 3: Deploy Backend (Render)

1.  Go to [dashboard.render.com](https://dashboard.render.com).
2.  Click **New +** -> **Web Service**.
3.  Select **Build and deploy from a Git repository**.
4.  Connect `krishisense2`.
5.  **Settings:**
    *   **Name:** `krishisense-backend-2`
    *   **Root Directory:** `backend`
    *   **Runtime:** Node
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
6.  **Environment Variables:**
    *   `DATABASE_URL`: *(Copy from your Render Database)*
    *   `JWT_SECRET`: `mysecretkey123`
7.  Click **Create Web Service**.
8.  **Copy the new Backend URL** once it's live.

---

## Phase 4: Initialize Database

1.  Visit: `YOUR_NEW_BACKEND_URL/setup-db`
2.  You should see: *"Database initialized successfully!"*

---

## Phase 5: Update Frontend Code

1.  Open `krishisense2/frontend/src/services/api.js` in VS Code.
2.  Update `baseURL` with your **NEW** Backend URL.
3.  Open `krishisense2/firmware/device_simulator.js`.
4.  Update `SERVER_URL` with your **NEW** Backend URL.
5.  **Push changes:** Go to GitHub Desktop -> Commit -> Push.

---

## Phase 6: Deploy Frontend (Vercel)

1.  Go to [vercel.com](https://vercel.com).
2.  Click **Add New** -> **Project**.
3.  Import `krishisense2`.
4.  **Settings:**
    *   **Root Directory:** `frontend`
    *   **Framework:** Vite
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
5.  Click **Deploy**.

---

**🎉 DONE!**