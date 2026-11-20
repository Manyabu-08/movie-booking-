# CineBook AI — Google Cloud & AI Studio Deployment Guide

## Architecture Summary
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express (`server.ts` compiled to `server.js` via `esbuild`)
- **Database & Auth**: Cloud Firestore (`ai-studio-02ab868f-3614-4ccf-b403-a0d56e8dbc6d`) + Firebase Authentication (project `gleaming-castle-sbvhw`)
- **AI Engine**: `@google/genai` (`gemini-4-hydrogen`) executed strictly server-side via `/api/ai/categorize` and `/api/ai/recommend`
- **Hosting**: Google Cloud Run (single container serving API + static SPA)

---

## Option A: Publish Directly from Google AI Studio
1. Confirm **Settings > Secrets** contains `GEMINI_API_KEY`.
2. Ensure Firebase is provisioned and `firestore.rules` are deployed.
3. Click **Share / Deploy to Cloud Run** in the Google AI Studio toolbar and approve Cloud Run deployment.
4. Once deployed, add your Cloud Run hostname (`*.run.app`) to **Firebase Console > Authentication > Settings > Authorized domains** so Google Sign-In popups work on the public URL.

---

## Option B: Deploy via Google Cloud CLI (`gcloud run deploy`)

### 1. Prerequisites
- Install Google Cloud SDK (`gcloud`) and authenticate:
  ```bash
  gcloud auth login
  gcloud config set project gleaming-castle-sbvhw
  ```
- Enable required APIs:
  ```bash
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
  ```

### 2. Store `GEMINI_API_KEY` in Secret Manager
```bash
printf "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
```

### 3. Build & Deploy to Cloud Run
```bash
gcloud run deploy cinebook-ai \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --set-env-vars="NODE_ENV=production"
```

### 4. Firebase Console Configuration Required for Full Features
1. **Email/Password Auth**: In **Firebase Console > Authentication > Sign-in method**, enable **Email/Password** (Google Sign-In is pre-enabled by AI Studio).
2. **Authorized Domains**: Add your Cloud Run URL under **Authentication > Settings > Authorized domains**.
3. **Seed Catalog**: Sign in with the admin account (`bumanya90@gmail.com`) and open **Admin Dashboard** (or click **Seed Sample Catalog**) to populate the initial movies, theatres, and showtimes in Cloud Firestore.
4. **Review Security Rules**: Audit `firestore.rules` in **Firebase Console > Firestore Database > Rules** before sharing broadly.
