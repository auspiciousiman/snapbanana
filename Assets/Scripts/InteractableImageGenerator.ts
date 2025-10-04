import { ImageGenerator } from "./ImageGenerator";
import { ASRQueryController } from "./ASRQueryController";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { NanoBananaAPI } from "./NanoBananaAPI";

@component
export class InteractableImageGenerator extends BaseScriptComponent {
  @ui.separator
  @ui.label("Image Editing with Nano Banana (fal.ai)")
  @ui.separator
  @input
  @hint("Your fal.ai API key")
  private falApiKey: string = "";
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
  private cameraModule: CameraModule = require("LensStudio:CameraModule");
  private capturedTexture: Texture = null;

  onAwake() {
    this.imageGenerator = new ImageGenerator();

    // Initialize Nano Banana API if key is provided
    if (this.falApiKey && this.falApiKey.length > 0) {
      this.nanoBananaAPI = new NanoBananaAPI(this.falApiKey);
      print("Nano Banana API initialized");
    } else {
      print("Warning: fal.ai API key not provided. Image editing will not work.");
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
      .then((editedImage) => {
        print("Image edited successfully with Nano Banana");
        this.textDisplay.text = prompt;
        this.image.mainMaterial.mainPass.baseTex = editedImage;
        // Keep the edited image as the new captured texture for further edits
        this.capturedTexture = editedImage;
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
      this.spinner.enabled = false;

      print("Photo captured successfully from Spectacles camera");
    } catch (error) {
      print("Error capturing photo: " + error);
      this.textDisplay.text = "Error capturing photo";
      this.spinner.enabled = false;
    }
  }
}
