# FireBuilder - GitHub Pages Deployment Guide

This guide explains how to build and deploy FireBuilder to GitHub Pages on a subpath (e.g., `https://paulnewton.github.io/firebuilder/`).

## Prerequisites

- Node.js 18+ and pnpm installed
- A GitHub repository (e.g., `paulnewton/firebuilder`)
- GitHub Pages enabled in repository settings

## Step 1: Configure the Repository

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Set **Source** to "Deploy from a branch"
4. Select branch: `main` (or your deployment branch)
5. Select folder: `/ (root)`
6. Save

## Step 2: Update Vite Configuration

The `vite.config.ts` is already configured with `base: "/firebuilder/"` for subpath deployment.

## Step 3: Build the Application

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# The output will be in dist/spa/
```

## Step 4: Deploy to GitHub Pages

### Option A: Manual Deployment (Push dist folder)

```bash
# Build the app
pnpm build

# Create a separate branch for gh-pages (first time only)
git checkout --orphan gh-pages
git rm -rf .

# Copy the built files
cp -r dist/spa/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# Switch back to main branch
git checkout main
```

### Option B: Automated Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: "pnpm"
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/spa
          cname: false
```

Then commit and push:
```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

## Step 5: Access Your App

After deployment completes, visit:
```
https://paulnewton.github.io/firebuilder/
```

## Troubleshooting

### 404 Error on subpath routes

This is already handled! The app uses React Router's `basename` property configured to handle the `/firebuilder/` subpath correctly.

### Static assets returning 404

Ensure the `base` property in `vite.config.ts` is set to your subpath:
```typescript
export default defineConfig({
  base: '/firebuilder/',
  // ... rest of config
});
```

### Deployment not updating

1. Check GitHub Actions logs in repository settings
2. Clear your browser cache
3. Verify files were pushed to the correct branch
4. Wait 1-2 minutes for GitHub Pages to rebuild

## Local Testing

To test the subpath locally:

```bash
# Build the app
pnpm build

# Serve with the correct base path
npx http-server dist/spa/ -c-1
```

Then visit `http://localhost:8080/firebuilder/`

## Production Environment

Your deployed app includes:
- Offline-first LocalStorage support
- Full visual page builder functionality
- AI assistant (requires API keys configured)
- GitHub Pages deployment capability from within the app
- Export to HTML and JSON

All features work completely offline and persist data locally in the browser.
