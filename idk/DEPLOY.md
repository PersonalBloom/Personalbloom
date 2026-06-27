# PersonalBloom — Deployment Guide

Everything you need to go from zero to live. Follow each section in order.

---

## Step 1 — Supabase (your database + auth)

### 1.1 Create a project
1. Go to https://supabase.com and sign up (free)
2. Click **New project**, choose a name (e.g. `personalbloom`), pick a region close to your users, set a strong password, click **Create project**
3. Wait ~2 minutes for it to boot

### 1.2 Run the database migration
1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `packages/db/migrations/001_init.sql` from this project
4. Paste the entire contents into the editor and click **Run**
5. You should see "Success. No rows returned."

This creates all your tables (profiles, quiz_results, study_sessions, flashcards) with security rules so users can only see their own data.

### 1.3 Enable Google login (optional but recommended)
1. Go to **Authentication → Providers → Google**
2. Toggle it on
3. Go to https://console.cloud.google.com → **APIs & Services → Credentials → Create OAuth Client ID**
4. Set Authorized redirect URI to: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
5. Copy the Client ID and Secret back into Supabase

### 1.4 Get your API keys
1. Go to **Settings → API** in Supabase
2. Copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **anon / public key** → this is your `SUPABASE_ANON_KEY`
3. Keep these — you'll need them in the next steps

---

## Step 2 — Web app on Vercel

### 2.1 Push your code to GitHub
```bash
cd personalbloom
git init
git add .
git commit -m "Initial PersonalBloom commit"
# Create a repo at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/personalbloom.git
git push -u origin main
```

### 2.2 Deploy to Vercel
1. Go to https://vercel.com and sign up with GitHub
2. Click **Add New → Project**
3. Import your `personalbloom` repository
4. Vercel will detect it's a Turborepo — set:
   - **Root Directory**: `apps/web`
   - **Framework**: Next.js (auto-detected)
5. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
   ```
6. Click **Deploy** — your site goes live at `yourproject.vercel.app`

### 2.3 Add your domain (optional)
1. In Vercel → **Settings → Domains**, add your custom domain
2. Follow the DNS instructions (point your domain's CNAME to Vercel)
3. Update Supabase: **Authentication → URL Configuration → Site URL** = your live domain
4. Also add `https://yourdomain.com/auth/callback` to **Redirect URLs**

---

## Step 3 — Mobile app with Expo

### 3.1 Install tools (one time)
```bash
npm install -g expo-cli eas-cli
```

### 3.2 Set up environment
```bash
cd apps/mobile
cp .env.example .env
# Edit .env and fill in your Supabase URL and anon key
```

### 3.3 Run locally on your phone
```bash
npx expo start
```
- Install **Expo Go** on your iPhone or Android
- Scan the QR code that appears — the app opens instantly
- Every time you save a file, the app refreshes automatically

### 3.4 Build for the App Store / Play Store
```bash
# Login to Expo
eas login

# Configure your project (first time only)
eas build:configure

# Build for iOS (requires Apple Developer account — $99/year)
eas build --platform ios

# Build for Android (requires Google Play account — $25 one-time)
eas build --platform android
```

After the build finishes, EAS gives you a link to download the `.ipa` (iOS) or `.apk/.aab` (Android) file, which you upload to App Store Connect or Google Play Console.

---

## Step 4 — Local development

To run everything locally:

```bash
# Install all dependencies
npm install

# Start both web and (if set up) mobile simultaneously
npm run dev
```

Web runs at: http://localhost:3000

For mobile only:
```bash
cd apps/mobile
npx expo start
```

---

## Environment variable cheat sheet

| File | Variable | Where to get it |
|------|----------|-----------------|
| `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `apps/mobile/.env` | `EXPO_PUBLIC_SUPABASE_URL` | Same as above |
| `apps/mobile/.env` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same as above |

---

## Soul+ payments with Stripe (when ready)

1. Create a Stripe account at https://stripe.com
2. Go to **Products → Add product** → name it "Soul+" → price $4.99/month recurring
3. Go to **Payment Links → Create** → select Soul+ → copy the link
4. In Vercel environment variables, add: `NEXT_PUBLIC_STRIPE_SOUL_LINK=https://buy.stripe.com/YOUR_LINK`
5. Wire up a **Stripe webhook** → `/api/webhooks/stripe` to update the user's `plan` in Supabase when payment succeeds

---

## Project structure recap

```
personalbloom/
├── apps/
│   ├── web/          ← Next.js (deploys to Vercel)
│   └── mobile/       ← Expo (deploys to App Store / Play Store)
├── packages/
│   ├── db/           ← Supabase types + client (shared)
│   └── ui/           ← Shared components (future)
├── turbo.json
└── package.json
```

---

## Quick troubleshooting

**"Invalid API key" from Supabase** → Double-check your `.env.local` has no extra spaces and you restarted the dev server after editing it.

**Auth redirect not working** → Make sure your Site URL in Supabase exactly matches where your app is running (including `http://` vs `https://`).

**Expo app can't connect** → Your phone and computer need to be on the same Wi-Fi network for local dev.

**Build fails on Vercel** → Check the build logs. Most common cause is a missing environment variable.
