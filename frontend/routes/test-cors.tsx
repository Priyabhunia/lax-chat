import { TestCors } from "../components/auth/TestCors";

export default function TestCorsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Supabase Connection Test</h1>
      <TestCors />
    </div>
  );
} 