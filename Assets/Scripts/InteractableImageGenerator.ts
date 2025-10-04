import { ImageGenerator } from "./ImageGenerator";
import { ASRQueryController } from "./ASRQueryController";
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";

@component
export class InteractableImageGenerator extends BaseScriptComponent {
  @ui.separator
  @ui.label("Using Gemini 2.5 Flash Image (Nano Banana) for image generation")
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
  private cameraModule: CameraModule = require("LensStudio:CameraModule");

  onAwake() {
    this.imageGenerator = new ImageGenerator();
    let imgMat = this.image.mainMaterial.clone();
    this.image.clearMaterials();
    this.image.mainMaterial = imgMat;
    this.createEvent("OnStartEvent").bind(() => {
      this.spinner.enabled = false;
      this.asrQueryController.onQueryEvent.add((query) => {
        this.createImage(query);
      });

      // Set up camera button
      if (this.cameraButton) {
        this.cameraButton.onTriggerEnd.add(() => {
          this.capturePhoto();
        });
      }
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
        this.textDisplay.text = prompt;
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

      // Display the captured photo
      this.image.mainMaterial.mainPass.baseTex = imageFrame.texture;
      this.textDisplay.text = "Photo captured!";
      this.spinner.enabled = false;

      print("Photo captured successfully from Spectacles camera");
    } catch (error) {
      print("Error capturing photo: " + error);
      this.textDisplay.text = "Error capturing photo";
      this.spinner.enabled = false;
    }
  }
}
