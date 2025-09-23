import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enhanced PDF text extraction function
async function extractPDFText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to Latin-1 string for proper PDF parsing
    let pdfString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      pdfString += String.fromCharCode(uint8Array[i]);
    }
    
    let extractedText = '';
    const textStrings: string[] = [];
    
    // Method 1: Extract text from parentheses (most common PDF text format)
    const parenthesesMatches = pdfString.match(/\(([^)\\]*(\\.[^)\\]*)*)\)/g);
    if (parenthesesMatches) {
      parenthesesMatches.forEach(match => {
        let text = match.slice(1, -1); // Remove parentheses
        // Handle common PDF escape sequences
        text = text.replace(/\\n/g, '\n')
                  .replace(/\\r/g, '\r')
                  .replace(/\\t/g, '\t')
                  .replace(/\\b/g, '\b')
                  .replace(/\\f/g, '\f')
                  .replace(/\\(/g, '(')
                  .replace(/\\)/g, ')')
                  .replace(/\\\\/g, '\\');
        
        // Only include if it looks like readable text
        if (text && /[a-zA-Z0-9\s]/.test(text) && text.length > 1) {
          textStrings.push(text);
        }
      });
    }
    
    // Method 2: Extract text from angle brackets (hexadecimal encoded)
    const hexMatches = pdfString.match(/<([0-9A-Fa-f\s]+)>/g);
    if (hexMatches) {
      hexMatches.forEach(match => {
        const hex = match.slice(1, -1).replace(/\s/g, '');
        if (hex.length % 2 === 0) {
          let text = '';
          for (let i = 0; i < hex.length; i += 2) {
            const byte = parseInt(hex.substr(i, 2), 16);
            if (byte > 31 && byte < 127) { // Printable ASCII
              text += String.fromCharCode(byte);
            }
          }
          if (text && text.length > 1) {
            textStrings.push(text);
          }
        }
      });
    }
    
    // Method 3: Look for text between BT and ET operators
    const textObjectMatches = pdfString.match(/BT\s+(.*?)\s+ET/gs);
    if (textObjectMatches) {
      textObjectMatches.forEach(match => {
        // Extract Tj and TJ commands (show text operators)
        const tjMatches = match.match(/\(([^)\\]*(\\.[^)\\]*)*)\)\s*Tj/g);
        if (tjMatches) {
          tjMatches.forEach(tj => {
            const text = tj.replace(/\)\s*Tj$/, '').replace(/^\(/, '');
            if (text && /[a-zA-Z0-9]/.test(text)) {
              textStrings.push(text);
            }
          });
        }
        
        // Extract TJ array commands
        const tjArrayMatches = match.match(/\[([^\]]*)\]\s*TJ/g);
        if (tjArrayMatches) {
          tjArrayMatches.forEach(tja => {
            const content = tja.replace(/\]\s*TJ$/, '').replace(/^\[/, '');
            const stringMatches = content.match(/\(([^)]*)\)/g);
            if (stringMatches) {
              stringMatches.forEach(str => {
                const text = str.slice(1, -1);
                if (text && /[a-zA-Z0-9]/.test(text)) {
                  textStrings.push(text);
                }
              });
            }
          });
        }
      });
    }
    
    // Method 4: Search for common text patterns in the raw PDF
    const rawTextMatches = pdfString.match(/[A-Za-z][A-Za-z0-9\s.,!?;:'"()-]{10,}/g);
    if (rawTextMatches && textStrings.length < 5) {
      rawTextMatches.forEach(text => {
        // Filter out obvious non-text patterns
        if (!text.match(/^[A-Z]{10,}$/) && // Not all caps strings
            !text.match(/^\d+$/) && // Not just numbers
            !text.match(/^[^a-zA-Z]*$/) && // Contains letters
            text.split(' ').length > 2) { // Multiple words
          textStrings.push(text.trim());
        }
      });
    }
    
    // Clean and join the extracted text
    extractedText = textStrings
      .filter(text => text && text.trim().length > 0)
      .map(text => text.trim())
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // If still no readable text found
    if (!extractedText || extractedText.length < 10) {
      return 'PDF uploaded successfully, but no readable text could be extracted. The PDF may contain only images, be encrypted, or use unsupported encoding.';
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'PDF uploaded but text extraction failed due to parsing error.';
  }
}

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
      // Extract text from PDF
      parsedContent = await extractPDFText(file);
      contentPreview = parsedContent.substring(0, 200) + (parsedContent.length > 200 ? '...' : '');
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