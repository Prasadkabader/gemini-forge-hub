import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { UploadIcon, FileTextIcon, FileIcon, Loader2Icon, CheckIcon } from 'lucide-react';

interface FileUploadProps {
  projectId: string;
  onFileUploaded?: (file: any) => void;
}

interface UploadedFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  content_preview: string;
  created_at: string;
}

export const FileUpload = ({ projectId, onFileUploaded }: FileUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file type
    const allowedTypes = ['text/plain', 'text/csv', 'application/pdf'];
    const allowedExtensions = ['.txt', '.csv', '.pdf'];
    const isValidType = allowedTypes.includes(file.type) || 
      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt, .csv, or .pdf file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://kvqhaejzpygmorqgfkdv.supabase.co/functions/v1/file-upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cWhhZWp6cHlnbW9ycWdma2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzYzODEsImV4cCI6MjA3NDAxMjM4MX0.y6M-6Wlj7g-1KNb355UzyPWc3xsv2n2dRSv_psR3_Eo',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();
      const uploadedFileData = data.file;
      setUploadedFile(uploadedFileData);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been processed and is ready to use`,
      });

      onFileUploaded?.(uploadedFileData);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const createPromptFromFile = (file: UploadedFile) => {
    // This could be expanded to open a dialog or navigate to create prompt
    const promptText = `Based on the uploaded file "${file.filename}":\n\n${file.content_preview}\n\nPlease help me with:`;
    
    // For now, we'll just copy to clipboard
    navigator.clipboard.writeText(promptText).then(() => {
      toast({
        title: "Prompt copied to clipboard",
        description: "You can now paste this into the chat or create a new prompt",
      });
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.csv,.pdf"
              className="hidden"
              disabled={uploading}
            />
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              {uploading ? (
                <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <UploadIcon className="h-6 w-6 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">Upload File</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload .txt, .csv, or .pdf files to add context to your project
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="min-w-32"
            >
              {uploading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Choose File
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadedFile && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-1 bg-green-100 rounded">
                <CheckIcon className="h-4 w-4 text-green-600" />
              </div>
              <span>File Processed</span>
            </CardTitle>
            <CardDescription>
              Your file has been successfully uploaded and processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-background rounded">
                {uploadedFile.file_type.includes('pdf') ? (
                  <FileIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <FileTextIcon className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{uploadedFile.filename}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(uploadedFile.file_size)} • {uploadedFile.file_type}
                </p>
              </div>
            </div>

            {uploadedFile.content_preview && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Content Preview</h4>
                <div className="p-3 bg-muted/30 rounded-lg text-sm max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs">{uploadedFile.content_preview}</pre>
                </div>
              </div>
            )}

            <Button 
              onClick={() => createPromptFromFile(uploadedFile)}
              variant="secondary"
              className="w-full"
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              Create Prompt from This File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};