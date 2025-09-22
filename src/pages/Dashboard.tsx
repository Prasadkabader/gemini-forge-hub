import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { PlusIcon, MessageSquareIcon, LogOutIcon, TrashIcon, BotIcon, FileTextIcon, BrainIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [deletingProject, setDeletingProject] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
      createUserProfile();
    }
  }, [user]);

  const createUserProfile = async () => {
    if (!user) return;
    
    // Check if profile exists, if not create one
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!existingProfile) {
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          display_name: user.email?.split('@')[0] || 'User'
        });

      if (error) {
        console.error('Error creating profile:', error);
      }
    }
  };

  const fetchProjects = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
    
    setLoading(false);
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: newProject.name,
        description: newProject.description
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } else {
      setProjects([data, ...projects]);
      setNewProject({ name: '', description: '' });
      setCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This will also delete all associated prompts and files.`)) {
      return;
    }

    setDeletingProject(projectId);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
      toast({
        title: "Success",
        description: `Project "${projectName}" deleted successfully`,
      });
    }

    setDeletingProject(null);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const getProjectCardVariant = (index: number) => {
    const variants = [
      { bg: 'bg-gradient-to-br from-purple-50 to-purple-100', border: 'border-purple-200', icon: 'text-purple-600' },
      { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-200', icon: 'text-blue-600' },
      { bg: 'bg-gradient-to-br from-green-50 to-green-100', border: 'border-green-200', icon: 'text-green-600' },
      { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-200', icon: 'text-orange-600' },
      { bg: 'bg-gradient-to-br from-pink-50 to-pink-100', border: 'border-pink-200', icon: 'text-pink-600' },
      { bg: 'bg-gradient-to-br from-teal-50 to-teal-100', border: 'border-teal-200', icon: 'text-teal-600' },
    ];
    return variants[index % variants.length];
  };

  const getProjectIcon = (index: number) => {
    const icons = [BotIcon, BrainIcon, MessageSquareIcon, FileTextIcon];
    const IconComponent = icons[index % icons.length];
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">ChatBot Platform</h1>
            <div className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOutIcon className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Your Projects</h2>
            <p className="text-muted-foreground">
              Create and manage your chatbot projects
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new chatbot project to get started
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Chatbot"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of your chatbot project"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Project</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquareIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">No projects yet</CardTitle>
              <CardDescription className="mb-4">
                Get started by creating your first chatbot project
              </CardDescription>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => {
              const variant = getProjectCardVariant(index);
              const IconComponent = getProjectIcon(index);
              return (
                <Card 
                  key={project.id} 
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in ${variant.bg} ${variant.border} border-2`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Link to={`/project/${project.id}`} className="block">
                    <CardHeader className="relative pb-2">
                      <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <IconComponent className="h-16 w-16" />
                      </div>
                      <CardTitle className="flex items-center space-x-3 relative z-10">
                        <div className={`p-2 rounded-lg bg-white/50 ${variant.icon}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <span className="truncate">{project.name}</span>
                      </CardTitle>
                      <CardDescription className="relative z-10 line-clamp-2">
                        {project.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Link>
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteProject(project.id, project.name);
                      }}
                      disabled={deletingProject === project.id}
                    >
                      {deletingProject === project.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;