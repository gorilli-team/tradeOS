# Vercel Deployment Guide

## Prerequisites

1. **Vercel account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket** - Your code should be in a git repository
3. **Environment variables** - Prepare your environment variables

## Step 1: Prepare Environment Variables

You'll need to set these in Vercel:

### Required Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Optional Variables

```env
NEXT_PUBLIC_SWAP_CONTRACT_ADDRESS=0x... # If using swap contracts
NEXT_PUBLIC_TEST_TOKEN_ADDRESS=0x... # If using test tokens
NEXT_PUBLIC_USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

## Step 2: Deploy via Vercel Dashboard

### Option A: Import from Git (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/frontend`
   - **Build Command:** `pnpm build` (or leave default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `pnpm install`

5. Add environment variables (see Step 1)
6. Click **"Deploy"**

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Navigate to frontend directory:
   ```bash
   cd apps/frontend
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Follow the prompts:
   - Link to existing project or create new
   - Set environment variables when prompted

6. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Monorepo Settings

Since this is a monorepo, make sure Vercel is configured correctly:

### In Vercel Dashboard:

1. Go to **Project Settings** → **General**
2. Set **Root Directory** to: `apps/frontend`
3. Set **Build Command** to: `cd ../.. && pnpm install && cd apps/frontend && pnpm build`
4. Set **Output Directory** to: `.next` (or leave default)

### Or use vercel.json (already created):

The `vercel.json` file in the root is already configured for the monorepo structure.

## Step 4: Update Backend CORS

Make sure your backend allows requests from your Vercel domain:

```typescript
// In apps/backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app', // Add your Vercel URL
  ],
  credentials: true,
}));
```

## Step 5: Update WebSocket URL

If using WebSockets, update the WebSocket URL in the frontend:

The frontend should use `NEXT_PUBLIC_API_URL` for WebSocket connections. Make sure it's set correctly in Vercel environment variables.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy App ID for wallet connection | ✅ Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g., `https://api.tradeos.com`) | ✅ Yes |
| `NEXT_PUBLIC_SWAP_CONTRACT_ADDRESS` | Swap contract address (if deployed) | ❌ No |
| `NEXT_PUBLIC_TEST_TOKEN_ADDRESS` | Test token address (if deployed) | ❌ No |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC address on Sepolia | ❌ No |

## Troubleshooting

### Build Fails: "Cannot find module"

- Make sure `Root Directory` is set to `apps/frontend`
- Check that workspace dependencies are installed correctly
- Try adding `pnpm install` as a build step

### Build Fails: "Type errors"

- Make sure TypeScript is configured correctly
- Check that all workspace packages are built

### Environment Variables Not Working

- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables
- Check Vercel logs for errors

### WebSocket Connection Fails

- Make sure `NEXT_PUBLIC_API_URL` is set correctly
- Check that backend WebSocket server is accessible
- Verify CORS settings on backend

### Monorepo Issues

- Ensure `vercel.json` is in the root directory
- Set `Root Directory` to `apps/frontend` in Vercel dashboard
- Use `pnpm` instead of `npm` for installs

## Continuous Deployment

Once connected to Git, Vercel will automatically:
- Deploy on every push to `main` branch (production)
- Create preview deployments for pull requests
- Rebuild on environment variable changes

## Custom Domain

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

## Next Steps

After deployment:
1. Test the application on the Vercel URL
2. Update backend CORS to include Vercel domain
3. Test wallet connection with Privy
4. Test API connections
5. Set up custom domain (optional)

