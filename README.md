# Chat0

Blazingly-Fast, Open-source, and Free AI Chat App with Convex backend.

## Features

- Open Source
- Secure cloud data storage with Convex
- User authentication and multi-user support
- Bring your own API keys (we don't store them)
- Chat Navigator - Easily Navigate to any message in the chat
- Multi-model support - Google Gemini, OpenAI, DeepSeek and more
- Optimized React codebase (No Unnecessary re-renders)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 💻 Running Locally

To run Chat0 locally, you'll need to follow these steps:

### 1. Clone the repository:
```bash
git clone https://github.com/senbo1/chat0.git
cd chat0
```

### 2. Install dependencies:
We use `pnpm` for package management.
```bash
pnpm install
```

### 3. Set up Convex backend:

#### a. Create a Convex account
- Sign up at [https://www.convex.dev/](https://www.convex.dev/)
- Create a new project in the Convex dashboard

#### b. Initialize Convex in your project
```bash
npx convex init
```
- Follow the prompts to log in and select your project

#### c. Deploy the Convex functions and schema
```bash
npx convex deploy
```

#### d. Set up environment variables
Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```
Replace the URL with your actual Convex deployment URL from the dashboard.

### 4. Run the development server:
```bash
pnpm dev
```

### 5. Open your browser:
Navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

## 🔐 Authentication Setup

Chat0 uses Convex for user authentication:

1. Register a new account on the app's login page
2. Your credentials are securely stored in the Convex database
3. All your chat data is linked to your user account

## 🗄️ Database Structure

The Convex backend uses the following tables:
- `users`: User accounts with email and password
- `threads`: Chat threads linked to users
- `messages`: Individual messages in threads
- `messageSummaries`: Summaries of messages for navigation

## 🔑 API Keys

To use AI models, you'll need to:
1. Go to the Settings page after logging in
2. Add your API keys for the models you want to use:
   - OpenAI API key
   - Google Gemini API key
   - OpenRouter API key (for other models)
3. Your API keys are stored locally in your browser and never sent to our servers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🐛 Issues & Support

If you encounter any issues or have questions, please [open an issue](https://github.com/senbo1/chat0/issues) on GitHub.

## 💰 Buy me a coffee

- [coff.ee/senbo](https://coff.ee/senbo)
