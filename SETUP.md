# Detailed Setup Guide for Chat0

This guide provides comprehensive instructions for setting up Chat0 with its Convex backend.

## Prerequisites

- Node.js 16+ installed
- pnpm installed (`npm install -g pnpm`)
- A Convex account (free tier available)
- API keys for the AI models you want to use (optional)

## Step 1: Clone and Install

```bash
git clone https://github.com/senbo1/chat0.git
cd chat0
pnpm install
```

## Step 2: Convex Backend Setup

### Create a Convex Account

1. Go to [https://www.convex.dev/](https://www.convex.dev/)
2. Sign up for a free account
3. Create a new project in the dashboard

### Initialize Convex in Your Project

```bash
npx convex init
```

Follow the prompts to:
- Log in to your Convex account
- Select your project
- This will create a `.env.local` file with your Convex URL

### Deploy the Schema and Functions

```bash
npx convex deploy
```

This command deploys:
- Database schema (`schema.ts`)
- Authentication functions (`auth.js`)
- Thread management functions (`threads.ts`)
- Message handling functions (`messages.ts`)
- HTTP endpoints (`http.js`)

### Verify Deployment

1. Go to your Convex dashboard
2. Check the "Functions" tab to ensure all functions are deployed
3. Check the "Schema" tab to verify the database tables are created

## Step 3: Run the Application

```bash
pnpm dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000)

## Step 4: Register and Set Up

1. Navigate to the login/register page
2. Create a new account
3. You'll be redirected to the main chat interface
4. Go to Settings to add your API keys for the AI models

## Troubleshooting

### Convex Connection Issues

If you see errors connecting to Convex:
1. Check that your `.env.local` file has the correct `NEXT_PUBLIC_CONVEX_URL`
2. Ensure you've deployed your functions with `npx convex deploy`
3. Check the Convex dashboard for any deployment errors

### Authentication Problems

If registration or login isn't working:
1. Check the browser console for errors
2. Verify that the `users` table was created in Convex
3. Try running `npx convex dev` to see detailed logs

### Missing Tables or Functions

If you're seeing "function not found" errors:
1. Run `npx convex deploy` again
2. Check the Convex dashboard to ensure all functions are deployed
3. Verify that your schema matches the expected structure

## Development Workflow

When making changes to Convex functions:
1. Edit files in the `convex/` directory
2. Run `npx convex deploy` to update your deployment
3. Changes will be immediately available to your application

## Production Deployment

For production:
1. Deploy your frontend to your preferred hosting (Vercel, Netlify, etc.)
2. Set the environment variable `NEXT_PUBLIC_CONVEX_URL` to your production Convex URL
3. Ensure your Convex project is on an appropriate tier for your expected usage
