import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { ArrowLeftIcon, PlusIcon, SendIcon, BotIcon, UserIcon, FileTextIcon, UploadIcon } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Prompt {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  message: string;
  is_user: boolean;
  created_at: string;
}

const Project = () => {
  const { id } = useParams<{ id: string }>();
  const { user, session } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' });
  const [createPromptOpen, setCreatePromptOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && id) {
      fetchProject();
      fetchPrompts();
      fetchChats();
    }
  }, [user, id]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProject = async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project",
        variant: "destructive",
      });
    } else if (data) {
      setProject(data);
    }
  };

  const fetchPrompts = async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
    } else {
      setPrompts(data || []);
    }
  };

  const fetchChats = async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chats:', error);
    } else {
      setChats(data || []);
    }
    
    setLoading(false);
  };

  const createPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        project_id: id,
        user_id: user.id,
        title: newPrompt.title,
        content: newPrompt.content
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to create prompt",
        variant: "destructive",
      });
    } else {
      setPrompts([data, ...prompts]);
      setNewPrompt({ title: '', content: '' });
      setCreatePromptOpen(false);
      toast({
        title: "Success",
        description: "Prompt created successfully!",
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !user || !id || !session) return;

    setChatLoading(true);
    const userMessage = chatMessage;
    setChatMessage('');

    // Add user message to local state immediately
    const userMessageObj = {
      id: `temp-${Date.now()}`,
      message: userMessage,
      is_user: true,
      created_at: new Date().toISOString()
    };
    setChats(prev => [...prev, userMessageObj]);

    try {
      const response = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          projectId: id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      // Refresh chats to get the complete conversation
      await fetchChats();
      
      toast({
        title: "Message sent",
        description: "AI response received!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      // Remove the temp user message on error
      setChats(prev => prev.filter(msg => msg.id !== userMessageObj.id));
    } finally {
      setChatLoading(false);
    }
  };

  const usePrompt = (prompt: Prompt) => {
    setChatMessage(prompt.content);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link to="/dashboard">
            <Button>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="prompts" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              
              <TabsContent value="prompts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Prompts</h3>
                  <Dialog open={createPromptOpen} onOpenChange={setCreatePromptOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Prompt</DialogTitle>
                        <DialogDescription>
                          Create a reusable prompt for this project
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={createPrompt} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            placeholder="Prompt title"
                            value={newPrompt.title}
                            onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Content</Label>
                          <Textarea
                            id="content"
                            placeholder="Enter your prompt here..."
                            value={newPrompt.content}
                            onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                            rows={4}
                            required
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setCreatePromptOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create Prompt</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {prompts.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground text-center">
                            No prompts yet. Create your first prompt to get started.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      prompts.map((prompt) => (
                        <Card key={prompt.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{prompt.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {prompt.content}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => usePrompt(prompt)}
                            >
                              Use Prompt
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="files" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Files</h3>
                  <Button size="sm" variant="outline">
                    <UploadIcon className="h-4 w-4" />
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <FileTextIcon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">File upload coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BotIcon className="h-5 w-5" />
                  <span>Chat with AI</span>
                </CardTitle>
                <CardDescription>
                  Powered by Google Gemini AI
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chats.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <BotIcon className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Start a conversation</h3>
                        <p className="text-sm">Send a message to begin chatting with the AI assistant.</p>
                      </div>
                    ) : (
                      chats.map((chat) => (
                        <div key={chat.id} className={`flex ${chat.is_user ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[80%] space-x-2 ${chat.is_user ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              chat.is_user ? 'bg-primary' : 'bg-secondary'
                            }`}>
                              {chat.is_user ? (
                                <UserIcon className="h-4 w-4 text-primary-foreground" />
                              ) : (
                                <BotIcon className="h-4 w-4 text-secondary-foreground" />
                              )}
                            </div>
                            <div className={`p-3 rounded-lg ${
                              chat.is_user 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="flex max-w-[80%] space-x-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                            <BotIcon className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
                
                <div className="border-t p-4">
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      disabled={chatLoading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={chatLoading || !chatMessage.trim()}>
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;