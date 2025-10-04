import { ImageGenerator } from "./ImageGenerator";
import { ASRQueryController } from "./ASRQueryController";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { NanoBananaAPI } from "./NanoBananaAPI";
import { SupabaseAPI } from "./SupabaseAPI";

@component
export class InteractableImageGenerator extends BaseScriptComponent {
  @ui.separator
  @ui.label("Image Editing with Nano Banana (fal.ai)")
  @ui.separator
  @input
  @hint("Your fal.ai API key")
  private falApiKey: string = "";

  @ui.separator
  @ui.label("Supabase Storage (Optional)")
  @ui.separator
  @input
  @hint("Supabase Project URL (e.g., https://abc.supabase.co)")
  private supabaseUrl: string = "";
  @input
  @hint("Supabase API Key (anon/public key)")
  private supabaseApiKey: string = "";

  @ui.separator
  @ui.label("Scene References")
  @ui.separator
  @input
  private image: Image;
  @input
  private textDisplay: Text;
  @input
  private asrQueryController: ASRQueryController;
  @input
  private cameraButton: Interactable;
  @input
  private spinner: SceneObject;

  private imageGenerator: ImageGenerator = null;
  private nanoBananaAPI: NanoBananaAPI = null;
  private supabaseAPI: SupabaseAPI = null;
  private cameraModule: CameraModule = require("LensStudio:CameraModule");
  private capturedTexture: Texture = null;
  private currentRecordId: string = null;

  onAwake() {
    this.imageGenerator = new ImageGenerator();

    // Initialize Nano Banana API if key is provided
    if (this.falApiKey && this.falApiKey.length > 0) {
      this.nanoBananaAPI = new NanoBananaAPI(this.falApiKey);
      print("Nano Banana API initialized");
    } else {
      print("Warning: fal.ai API key not provided. Image editing will not work.");
    }

    // Initialize Supabase API if credentials are provided
    if (
      this.supabaseUrl &&
      this.supabaseUrl.length > 0 &&
      this.supabaseApiKey &&
      this.supabaseApiKey.length > 0
    ) {
      this.supabaseAPI = new SupabaseAPI(this.supabaseUrl, this.supabaseApiKey);
      print("Supabase API initialized for persistent storage");
    } else {
      print(
        "Info: Supabase credentials not provided. Images will not be saved to cloud."
      );
    }

    let imgMat = this.image.mainMaterial.clone();
    this.image.clearMaterials();
    this.image.mainMaterial = imgMat;
    this.createEvent("OnStartEvent").bind(() => {
      this.spinner.enabled = false;
      this.asrQueryController.onQueryEvent.add((query) => {
        this.processVoiceCommand(query);
      });

      // Set up camera button
      if (this.cameraButton) {
        this.cameraButton.onTriggerEnd.add(() => {
          this.capturePhoto();
        });
      }
    });
  }

  processVoiceCommand(prompt: string) {
    // If we have a captured image, edit it with Nano Banana
    if (this.capturedTexture) {
      this.editImage(prompt);
    } else {
      // Otherwise, generate a new image with Gemini
      this.createImage(prompt);
    }
  }

  editImage(prompt: string) {
    if (!this.nanoBananaAPI) {
      this.textDisplay.text = "Error: fal.ai API key not set";
      print("Cannot edit image: Nano Banana API not initialized");
      return;
    }

    this.spinner.enabled = true;
    this.textDisplay.text = "Editing: " + prompt;

    this.nanoBananaAPI
      .editImage(this.capturedTexture, prompt)
      .then(async (editedImage) => {
        print("Image edited successfully with Nano Banana");
        this.textDisplay.text = prompt;
        this.image.mainMaterial.mainPass.baseTex = editedImage;
        // Keep the edited image as the new captured texture for further edits
        this.capturedTexture = editedImage;

        // Upload edited image to Supabase if available
        if (this.supabaseAPI && this.currentRecordId) {
          try {
            const editedFilename = SupabaseAPI.generateFilename("edited");
            print("🎨 Uploading edited image to Supabase...");
            const editedUrl = await this.supabaseAPI.uploadImage(
              editedImage,
              editedFilename
            );
            await this.supabaseAPI.updateEditRecord(
              this.currentRecordId,
              editedUrl,
              prompt
            );
            print("✅ Edit saved! URL: " + editedUrl);
          } catch (error) {
            print("Warning: Failed to save edit to Supabase: " + error);
          }
        }

        this.spinner.enabled = false;
      })
      .catch((error) => {
        print("Error editing image with Nano Banana: " + error);
        this.textDisplay.text = "Error Editing Image";
        this.spinner.enabled = false;
      });
  }

  createImage(prompt: string) {
    this.spinner.enabled = true;
    this.textDisplay.text = "Generating: " + prompt;
    this.imageGenerator
      .generateImage(prompt)
      .then((image) => {
        print("Image generated successfully: " + image);
        this.textDisplay.text = prompt;
        this.image.mainMaterial.mainPass.baseTex = image;
        this.spinner.enabled = false;
      })
      .catch((error) => {
        print("Error generating image: " + error);
        this.textDisplay.text = "Error Generating Image";
        this.spinner.enabled = false;
      });
  }

  async capturePhoto() {
    try {
      this.spinner.enabled = true;
      this.textDisplay.text = "Capturing photo...";

      const imageRequest = CameraModule.createImageRequest();
      const imageFrame = await this.cameraModule.requestImage(imageRequest);

      // Store and display the captured photo
      this.capturedTexture = imageFrame.texture;
      this.image.mainMaterial.mainPass.baseTex = imageFrame.texture;
      this.textDisplay.text = "Photo captured! Say a prompt to edit it.";

      print("Photo captured successfully from Spectacles camera");

      // Upload to Supabase if available
      if (this.supabaseAPI) {
        try {
          const filename = SupabaseAPI.generateFilename("original");
          print("📸 Uploading captured photo to Supabase...");
          const imageUrl = await this.supabaseAPI.uploadImage(
            imageFrame.texture,
            filename
          );
          print("✅ Upload successful! URL: " + imageUrl);

          // Create database record
          this.currentRecordId = await this.supabaseAPI.createEditRecord(
            imageUrl,
            "Spectacles"
          );
          print("💾 Database record created: " + this.currentRecordId);
        } catch (error) {
          print("Warning: Failed to upload to Supabase: " + error);
          // Don't fail the capture if Supabase upload fails
        }
      }

      this.spinner.enabled = false;
    } catch (error) {
      print("Error capturing photo: " + error);
      this.textDisplay.text = "Error capturing photo";
      this.spinner.enabled = false;
    }
  }
}
