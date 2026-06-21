### Task 1: Dev Infrastructure

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`
- Create: `src/test-setup.ts`
- Create: `vercel.json`
- Create: `.env.local` (gitignored, never committed)

**Interfaces:**
- Produces: `npm test` runs Vitest; `vercel dev` serves Vite + `/api/*` serverless routes locally

- [ ] **Step 1: Install dev dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vercel/node
```

Expected: packages install without errors.

- [ ] **Step 2: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Create src/test-setup.ts**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Add test scripts to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create vercel.json**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

- [ ] **Step 6: Create .env.local (never commit)**

Create `.env.local` at project root:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

Get credentials: https://developer.spotify.com/dashboard → create an app → copy Client ID and Secret.

- [ ] **Step 7: Ensure .env.local is gitignored**

Open `.gitignore`. If these lines are missing, add them:
```
.env
.env.local
```

- [ ] **Step 8: Install Vercel CLI if not present**

```bash
npm install -g vercel
```

- [ ] **Step 9: Verify Vitest config works**

```bash
npm test
```

Expected: `No test files found, exiting with code 0` or similar. No errors.

- [ ] **Step 10: Commit**

```bash
git add vite.config.ts src/test-setup.ts vercel.json package.json package-lock.json .gitignore
git commit -m "chore: add vitest, testing-library, vercel config"
```

---

