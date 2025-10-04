# Supabase Integration Plan for Snap Banana

## Overview
Integrate Supabase to persistently store all captured photos and AI-edited images with metadata in the cloud.

---

## Phase 1: MCP Server Setup ✅ COMPLETE

**Status:** Connected successfully

**Steps:**
1. ✅ Run command: `claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=ikfqhgkrjwyzdqmmgjxp"`
2. ✅ Restart Claude Code to load MCP server
3. ✅ Verify MCP tools are available

**Troubleshooting:**
- If MCP tools don't appear, check Claude Code MCP configuration
- Run `/doctor` to diagnose MCP issues
- Verify Supabase project ref is correct: `ikfqhgkrjwyzdqmmgjxp`

---

## Phase 2: Supabase Infrastructure Setup ✅ COMPLETE

**Status:** Storage bucket and database table created successfully

### Storage Bucket
- **Name:** `snap-banana-images`
- **Access:** Public (for easy URL sharing)
- **Purpose:** Store all captured photos and AI-edited versions

### Database Table: `image_edits`
```sql
CREATE TABLE image_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_image_url TEXT NOT NULL,
  edited_image_url TEXT,
  prompt TEXT,
  user_id TEXT,
  device_info TEXT
);
```

**Columns:**
- `id` - Unique identifier for each edit session
- `created_at` - Timestamp when photo was captured
- `original_image_url` - URL to captured photo in Supabase Storage
- `edited_image_url` - URL to AI-edited version (null if not edited yet)
- `prompt` - Voice prompt used for editing
- `user_id` - For future multi-user support
- `device_info` - Spectacles device identifier (optional)

---

## Phase 3: Code Integration ✅ COMPLETE

**Status:** SupabaseAPI.ts created and integrated into InteractableImageGenerator.ts

### 3.1 Create `Assets/Scripts/SupabaseAPI.ts` ✅

**Responsibilities:**
- Upload JPEG images to Supabase Storage
- Save/update metadata in `image_edits` table
- Use `InternetModule.fetch()` for all API calls
- Return public URLs for uploaded images

**Key Methods:**
```typescript
class SupabaseAPI {
  async uploadImage(texture: Texture, filename: string): Promise<string>
  async createEditRecord(imageUrl: string): Promise<string>
  async updateEditRecord(recordId: string, editedUrl: string, prompt: string): Promise<void>
}
```

**API Endpoints:**
- Upload: `POST https://{project}.supabase.co/storage/v1/object/{bucket}/{filename}`
- Insert: `POST https://{project}.supabase.co/rest/v1/image_edits`
- Update: `PATCH https://{project}.supabase.co/rest/v1/image_edits?id=eq.{id}`

### 3.2 Update `Assets/Scripts/InteractableImageGenerator.ts` ✅

**Added Input Fields:**
```typescript
@input
@hint("Supabase Project URL (e.g., https://abc.supabase.co)")
private supabaseUrl: string = "";

@input
@hint("Supabase API Key (anon/public key)")
private supabaseApiKey: string = "";
```

**Workflow Integration:**

**On Photo Capture:**
1. Capture photo with CameraModule
2. Upload to Supabase Storage → get URL
3. Create database record with original_image_url
4. Store record ID for later updates
5. Display photo in UI

**On AI Edit:**
1. Edit with Nano Banana
2. Upload edited version to Supabase Storage → get URL
3. Update database record with edited_image_url and prompt
4. Display edited image in UI

**Logging:**
```typescript
print("📸 Uploading captured photo to Supabase...");
print("✅ Upload successful! URL: " + imageUrl);
print("💾 Database record created: " + recordId);
print("🎨 Uploading edited image to Supabase...");
print("✅ Edit saved! URL: " + editedUrl);
```

---

## Phase 4: Verification & Testing

### Dashboard Verification
1. **Supabase Dashboard → Storage → snap-banana-images**
   - Verify files appear after capture
   - Check file sizes are reasonable (<1MB per image)
   - Confirm filenames use timestamp format

2. **Supabase Dashboard → Table Editor → image_edits**
   - Verify new rows appear after capture/edit
   - Check all fields populated correctly
   - Confirm URLs are valid

### URL Testing
1. Copy image URL from logs
2. Paste in browser
3. Verify image loads and matches what was captured/edited

### End-to-End Test
1. Capture photo on Spectacles
2. Check Supabase Storage → File appears
3. Check Database → Record created
4. Say edit prompt
5. Check Supabase Storage → Edited version appears
6. Check Database → Record updated with prompt

---

## Configuration Required

### Supabase Project Settings
- **Project URL:** `https://ikfqhgkrjwyzdqmmgjxp.supabase.co`
- **Anon/Public Key:** (from Supabase Dashboard → Settings → API)

### Lens Studio Settings
1. Select `InteractableImageGenerator` object
2. Enter Supabase URL in inspector
3. Enter Supabase API key in inspector
4. Ensure Extended Permissions enabled (camera + internet)

---

## Benefits

✅ **Persistent Storage** - Images never lost
✅ **Edit History** - Track all prompts and versions
✅ **Cross-Device** - Access from anywhere
✅ **Public URLs** - Easy sharing
✅ **Analytics Ready** - Query edit patterns
✅ **Scalable** - Supabase handles growth

---

## Future Enhancements

- **Gallery View** - Browse all past creations in-app
- **User Authentication** - Multi-user support
- **Sharing** - Generate shareable links
- **Analytics** - Most popular prompts, success rates
- **Favorites** - Mark and filter best edits

---

## Current Status

✅ **Phases 1-3 Complete!** Supabase integration is ready for testing.

### Configuration Settings for Lens Studio

In Lens Studio, select the `InteractableImageGenerator` object and enter:

**Supabase Project URL:**
```
https://ikfqhgkrjwyzdqmmgjxp.supabase.co
```

**Supabase API Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZnFoZ2tyand5emRxbW1nanhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MTUzMTgsImV4cCI6MjA3NTE5MTMxOH0.DmFSx6lIP_CbWgl4d9o4srhnNdBfKQHYyEU97jmA24E
```

### Next Steps

**Phase 4: Testing & Verification**
1. Add configuration to Lens Studio (see above)
2. Deploy to Spectacles
3. Test capture workflow:
   - Capture photo → Check Supabase Storage → Check Database
4. Test edit workflow:
   - Say edit prompt → Check Supabase Storage → Check Database
5. Verify URLs in browser

**Updated:** 2025-01-04
