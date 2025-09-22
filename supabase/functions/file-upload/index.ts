import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user from auth
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return new Response(JSON.stringify({ error: 'File and projectId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Read file content
    const fileContent = await file.text();
    let parsedContent = '';
    let contentPreview = '';

    // Parse based on file type
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      parsedContent = fileContent;
      contentPreview = fileContent.substring(0, 200) + (fileContent.length > 200 ? '...' : '');
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      // Basic CSV parsing - just use as text for now
      parsedContent = fileContent;
      const lines = fileContent.split('\n').slice(0, 5);
      contentPreview = lines.join('\n') + (fileContent.split('\n').length > 5 ? '\n...' : '');
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // For PDF, we'd need a proper PDF parser, for now just store basic info
      parsedContent = 'PDF file uploaded - content parsing not yet implemented';
      contentPreview = `PDF file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    } else {
      parsedContent = fileContent;
      contentPreview = fileContent.substring(0, 200) + (fileContent.length > 200 ? '...' : '');
    }

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabaseClient
      .from('files')
      .insert({
        project_id: projectId,
        user_id: user.id,
        filename: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        content_preview: contentPreview,
        parsed_content: parsedContent
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to save file metadata' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File processed successfully:', fileRecord.id);

    return new Response(JSON.stringify({
      success: true,
      file: fileRecord,
      preview: contentPreview
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in file-upload function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});