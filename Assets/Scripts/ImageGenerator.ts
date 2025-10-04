import { Gemini } from "Remote Service Gateway.lspkg/HostedExternal/Gemini";
import { GeminiTypes } from "Remote Service Gateway.lspkg/HostedExternal/GeminiTypes";

export class ImageGenerator {
  generateImage(prompt: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      let request: GeminiTypes.Models.GenerateContentRequest = {
        model: "gemini-2.0-flash-preview-image-generation",
        type: "generateContent",
        body: {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
              role: "user",
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        },
      };

      Gemini.models(request)
        .then((response) => {
          if (!response.candidates || response.candidates.length === 0) {
            reject("No image generated in response");
            return;
          }

          let foundImage = false;
          for (let part of response.candidates[0].content.parts) {
            if (part?.inlineData) {
              foundImage = true;
              let b64Data = part.inlineData.data;
              Base64.decodeTextureAsync(
                b64Data,
                (texture) => {
                  resolve(texture);
                },
                () => {
                  reject("Failed to decode texture from base64 data.");
                }
              );
              break; // Use the first image found
            }
          }

          if (!foundImage) {
            reject("No image data found in response");
          }
        })
        .catch((error) => {
          reject("Error while generating image: " + error);
        });
    });
  }
}
