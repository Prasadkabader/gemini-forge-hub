import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareIcon, RocketIcon, SparklesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquareIcon className="h-6 w-6" />
            <span className="text-xl font-bold">ChatBot Platform</span>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4 lg:text-6xl">
            Build Amazing{" "}
            <span className="text-primary">AI Chatbots</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, manage, and deploy intelligent chatbots with the power of Google Gemini AI. 
            Store prompts, manage conversations, and scale your AI solutions.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">
                <RocketIcon className="h-4 w-4 mr-2" />
                Start Building
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquareIcon className="h-5 w-5" />
                <span>Smart Projects</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize your chatbots into projects. Each project can have multiple prompts and conversation history.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SparklesIcon className="h-5 w-5" />
                <span>Gemini AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Powered by Google's advanced Gemini AI model for natural, intelligent conversations and responses.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RocketIcon className="h-5 w-5" />
                <span>Easy to Use</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Beautiful, responsive interface that works perfectly on desktop and mobile devices.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/auth">
            <Button size="lg" variant="outline">
              Get Started Today
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
