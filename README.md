# Snap Banana

Snap Banana is like having photoshop on your head. Powered by Nano Banana and running on Snap Spectacles, take a photo and use your voice to painlessly edit it. All of your creations will be backed up to Supabase storage automatically.

Built on top of Snap's AI Playground sample application.

## Demo

![Demo Video](demo/snapbanana.mp4)

## Features

- **Voice-Activated Image Generation**: Generate images using voice commands with Gemini AI
- **Camera Capture**: Capture photos directly from Spectacles camera
- **AI Image Editing**: Edit captured photos using voice commands via fal.ai's Nano Banana model
- **Persistent Storage**: Optional Supabase integration for cloud storage of images and edit history

## Setup Instructions

To get this project working, you need to configure two API keys in Lens Studio:

### 1. Snap API Token (RemoteServiceGatewayCredentials)

1. Open the project in Lens Studio
2. In the Objects panel, find the object named `RemoteServiceGatewayCredentials [EDIT ME]`
3. In the Inspector panel, locate the `apiToken` field
4. Enter your Snap API token
   - Get your API token from the [Snap Developer Portal](https://developers.snap.com/)

### 2. fal.ai API Key (InteractableImageGenerator)

1. In the Objects panel, find the object with the `InteractableImageGenerator` script component
2. In the Inspector panel, locate the `falApiKey` field under "Image Editing with Nano Banana (fal.ai)"
3. Enter your fal.ai API key
   - Get your API key from [fal.ai](https://fal.ai/)

### 3. Supabase Configuration (Optional)

If you want to enable persistent cloud storage for images:

1. In the same `InteractableImageGenerator` script component
2. Under "Supabase Storage (Optional)":
   - Enter your `supabaseUrl` (e.g., https://abc.supabase.co)
   - Enter your `supabaseApiKey` (anon/public key)
   - Get these credentials from your [Supabase project settings](https://supabase.com/)

## Usage

1. **Capture Photo**: Tap the camera button to capture a photo from Spectacles
2. **Edit Photo**: After capturing, say a voice command to edit the image (e.g., "make it look like a painting")
3. **Generate Image**: Without capturing first, say a voice command to generate a new image (e.g., "a sunset over mountains")

## Technologies

- **Lens Studio**: Snapchat Spectacles development platform
- **Gemini AI**: Image generation
- **fal.ai Nano Banana**: AI-powered image editing
- **Supabase**: Cloud storage and database (optional)
