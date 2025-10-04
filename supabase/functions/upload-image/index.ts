import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from 'https://deno.land/std@0.177.0/encoding/base64.ts'

Deno.serve(async (req) => {
  try {
    const { base64Image, filename, bucket = 'snap-banana-images' } = await req.json()

    if (!base64Image || !filename) {
      return new Response(
        JSON.stringify({ error: 'Missing base64Image or filename' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Decode base64 to binary
    const imageData = decode(base64Image)

    // Upload to Storage
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filename, imageData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filename)

    return new Response(
      JSON.stringify({ url: publicUrl, path: data.path }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
