import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// Enhanced PDF text extraction function using pure JavaScript
async function extractPDFText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to string for parsing
    let pdfString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      pdfString += String.fromCharCode(uint8Array[i]);
    }
    
    const textStrings: string[] = [];
    
    // Method 1: Extract text from stream objects
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    const streamMatches = pdfString.match(streamRegex);
    
    if (streamMatches) {
      streamMatches.forEach(stream => {
        // Look for text commands in the stream
        const textCommands = stream.match(/\([^)]*\)\s*Tj/g);
        if (textCommands) {
          textCommands.forEach(cmd => {
            const text = cmd.replace(/\)\s*Tj$/, '').replace(/^\(/, '');
            if (text && text.length > 1 && /[a-zA-Z]/.test(text)) {
              textStrings.push(text);
            }
          });
        }
      });
    }
    
    // Method 2: Extract text from parentheses (common PDF text format)
    const parenthesesRegex = /\(([^)]+)\)/g;
    let match;
    while ((match = parenthesesRegex.exec(pdfString)) !== null) {
      let text = match[1];
      
      // Handle PDF escape sequences
      text = text.replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\(/g, '(')
                .replace(/\\)/g, ')')
                .replace(/\\\\/g, '\\');
      
      // Only include readable text
      if (text && text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
        textStrings.push(text);
      }
    }
    
    // Method 3: Extract from hex strings
    const hexRegex = /<([0-9A-Fa-f\s]+)>/g;
    while ((match = hexRegex.exec(pdfString)) !== null) {
      const hex = match[1].replace(/\s/g, '');
      if (hex.length % 2 === 0) {
        let text = '';
        for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.substr(i, 2), 16);
          if (byte >= 32 && byte <= 126) { // Printable ASCII
            text += String.fromCharCode(byte);
          }
        }
        if (text && text.length > 1 && /[a-zA-Z]/.test(text)) {
          textStrings.push(text);
        }
      }
    }
    
    // Method 4: Look for text between BT and ET operators
    const textObjectRegex = /BT\s+(.*?)\s+ET/gs;
    while ((match = textObjectRegex.exec(pdfString)) !== null) {
      const content = match[1];
      
      // Extract Tj commands
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(content)) !== null) {
        const text = tjMatch[1];
        if (text && /[a-zA-Z0-9]/.test(text)) {
          textStrings.push(text);
        }
      }
      
      // Extract TJ array commands
      const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
      while ((tjMatch = tjArrayRegex.exec(content)) !== null) {
        const arrayContent = tjMatch[1];
        const stringMatches = arrayContent.match(/\(([^)]*)\)/g);
        if (stringMatches) {
          stringMatches.forEach(str => {
            const text = str.slice(1, -1);
            if (text && /[a-zA-Z0-9]/.test(text)) {
              textStrings.push(text);
            }
          });
        }
      }
    }
    
    // Method 5: Search for readable text patterns in raw PDF
    if (textStrings.length < 3) {
      const readableTextRegex = /[A-Za-z][A-Za-z0-9\s.,!?;:'"()-]{5,}/g;
      while ((match = readableTextRegex.exec(pdfString)) !== null) {
        const text = match[0];
        // Filter out non-text patterns
        if (!text.match(/^[A-Z]{8,}$/) && // Not all caps
            !text.match(/^\d+$/) && // Not just numbers
            text.split(' ').length > 1) { // Multiple words
          textStrings.push(text.trim());
        }
      }
    }
    
    // Clean and join extracted text
    let extractedText = textStrings
      .filter(text => text && text.trim().length > 0)
      .map(text => text.trim())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove duplicate phrases
    const words = extractedText.split(' ');
    const uniqueWords = [];
    const seen = new Set();
    
    for (const word of words) {
      if (!seen.has(word.toLowerCase()) || word.length > 10) {
        uniqueWords.push(word);
        seen.add(word.toLowerCase());
      }
    }
    
    extractedText = uniqueWords.join(' ');
    
    if (!extractedText || extractedText.length < 10) {
      return 'PDF uploaded successfully. The PDF may contain images, be encrypted, or use complex formatting that prevents text extraction.';
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'PDF uploaded but text extraction encountered an error. The file may be corrupted or use unsupported encoding.';
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log(`${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      console.error('Project verification error:', projectError);
      return new Response(JSON.stringify({ error: 'Project not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File size exceeds 10MB limit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'text/csv', 'application/pdf'];
    const allowedExtensions = ['.txt', '.csv', '.pdf'];
    const isValidType = allowedTypes.includes(file.type) || 
      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Only .txt, .csv, and .pdf files are allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsedContent = '';
    let contentPreview = '';

    try {
      // Process file based on type
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        console.log('Extracting text from PDF...');
        parsedContent = await extractPDFText(file);
        contentPreview = parsedContent.substring(0, 300) + (parsedContent.length > 300 ? '...' : '');
      } else {
        // Handle text files (TXT, CSV)
        const fileContent = await file.text();
        parsedContent = fileContent;
        
        if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
          // For CSV, show first few rows as preview
          const lines = fileContent.split('\n').slice(0, 5);
          contentPreview = lines.join('\n') + (fileContent.split('\n').length > 5 ? '\n...' : '');
        } else {
          // For TXT files
          contentPreview = fileContent.substring(0, 300) + (fileContent.length > 300 ? '...' : '');
        }
      }
    } catch (error) {
      console.error('File processing error:', error);
      return new Response(JSON.stringify({ error: 'Failed to process file content' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Failed to save file metadata to database' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`File processed successfully: ${fileRecord.id}`);

    return new Response(JSON.stringify({
      success: true,
      file: fileRecord,
      message: 'File uploaded and processed successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in file-upload function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});