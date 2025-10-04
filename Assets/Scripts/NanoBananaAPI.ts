/**
 * Integration with fal.ai Nano Banana image editing API
 */
export class NanoBananaAPI {
  private internetModule: InternetModule = require("LensStudio:InternetModule");
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Edit an image using Nano Banana model
   * @param texture - The texture to edit
   * @param prompt - Text description of desired edits
   * @returns Promise that resolves with the edited texture
   */
  async editImage(texture: Texture, prompt: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      // Convert texture to base64 asynchronously
      Base64.encodeTextureAsync(
        texture,
        (base64Image) => {
          try {
            const dataUrl = `data:image/png;base64,${base64Image}`;

            // Prepare request body
            const requestBody = {
              prompt: prompt,
              image_urls: [dataUrl],
              num_images: 1,
              output_format: "png",
            };

            // Create fetch request
            const request = new Request(
              "https://fal.run/fal-ai/nano-banana/edit",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Key ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
              }
            );

            print("Calling Nano Banana API with prompt: " + prompt);

            // Make the API call
            this.internetModule
              .fetch(request)
              .then(async (response) => {
                if (response.status !== 200) {
                  const errorText = await response.text();
                  reject(
                    `Nano Banana API error (${response.status}): ${errorText}`
                  );
                  return;
                }

                const responseJson = await response.json();
                print("Nano Banana response: " + JSON.stringify(responseJson));

                // Get the edited image URL from response
                if (responseJson.images && responseJson.images.length > 0) {
                  const imageUrl = responseJson.images[0].url;
                  this.downloadImage(imageUrl)
                    .then((editedTexture) => {
                      resolve(editedTexture);
                    })
                    .catch((error) => {
                      reject(`Failed to download edited image: ${error}`);
                    });
                } else {
                  reject("No edited image returned from Nano Banana API");
                }
              })
              .catch((error) => {
                reject(`Nano Banana API request failed: ${error}`);
              });
          } catch (error) {
            reject(`Error preparing Nano Banana request: ${error}`);
          }
        },
        () => {
          reject("Failed to encode texture to base64");
        },
        CompressionQuality.HighQuality,
        EncodingType.Png
      );
    });
  }

  /**
   * Download an image from a URL and convert to texture
   */
  private async downloadImage(url: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const remoteServiceModule: RemoteServiceModule = require("LensStudio:RemoteServiceModule");
      const remoteMediaModule: RemoteMediaModule = require("LensStudio:RemoteMediaModule");

      try {
        const resource = remoteServiceModule.makeResourceFromUrl(url);

        if (resource) {
          remoteMediaModule.loadResourceAsImageTexture(
            resource,
            (texture) => {
              resolve(texture);
            },
            (error) => {
              reject(`Failed to load image texture: ${error}`);
            }
          );
        } else {
          reject("Failed to create resource from URL");
        }
      } catch (error) {
        reject(`Error downloading image: ${error}`);
      }
    });
  }
}
