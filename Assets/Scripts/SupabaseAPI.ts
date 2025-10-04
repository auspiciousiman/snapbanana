/**
 * Integration with Supabase for persistent storage of images and metadata
 */
export class SupabaseAPI {
  private internetModule: InternetModule = require("LensStudio:InternetModule");
  private supabaseUrl: string;
  private supabaseKey: string;
  private bucketName: string = "snap-banana-images";

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  /**
   * Upload an image to Supabase Storage via Edge Function
   * @param texture - The texture to upload
   * @param filename - Filename for the uploaded image
   * @returns Promise that resolves with the public URL of the uploaded image
   */
  async uploadImage(texture: Texture, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Convert texture to base64
      Base64.encodeTextureAsync(
        texture,
        (base64Image) => {
          try {
            // Prepare request body for Edge Function
            const requestBody = {
              base64Image: base64Image,
              filename: filename,
              bucket: this.bucketName,
            };

            // Call Edge Function
            const functionUrl = `${this.supabaseUrl}/functions/v1/upload-image`;

            const request = new Request(functionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.supabaseKey}`,
              },
              body: JSON.stringify(requestBody),
            });

            print(`📸 Uploading image to Supabase: ${filename}`);

            // Upload via Edge Function
            this.internetModule
              .fetch(request)
              .then(async (response) => {
                const responseText = await response.text();

                if (response.status !== 200) {
                  print(`Upload error response: ${responseText}`);
                  reject(
                    `Supabase upload error (${response.status}): ${responseText}`
                  );
                  return;
                }

                const responseJson = JSON.parse(responseText);
                const publicUrl = responseJson.url;
                print(`✅ Upload successful! URL: ${publicUrl}`);
                resolve(publicUrl);
              })
              .catch((error) => {
                reject(`Supabase upload failed: ${error}`);
              });
          } catch (error) {
            reject(`Error preparing upload: ${error}`);
          }
        },
        () => {
          reject("Failed to encode texture to base64");
        },
        CompressionQuality.IntermediateQuality,
        EncodingType.Jpg
      );
    });
  }

  /**
   * Create a new record in the image_edits table
   * @param originalImageUrl - URL of the original captured image
   * @param deviceInfo - Optional device information
   * @returns Promise that resolves with the record ID
   */
  async createEditRecord(
    originalImageUrl: string,
    deviceInfo?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const dbUrl = `${this.supabaseUrl}/rest/v1/image_edits`;

      const requestBody = {
        original_image_url: originalImageUrl,
        device_info: deviceInfo || "Spectacles",
      };

      const request = new Request(dbUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.supabaseKey}`,
          apikey: this.supabaseKey,
          Prefer: "return=representation",
        },
        body: JSON.stringify(requestBody),
      });

      print("💾 Creating database record...");

      this.internetModule
        .fetch(request)
        .then(async (response) => {
          if (response.status !== 201) {
            const errorText = await response.text();
            reject(`Supabase DB error (${response.status}): ${errorText}`);
            return;
          }

          const responseJson = await response.json();
          const recordId = responseJson[0].id;
          print(`✅ Database record created: ${recordId}`);
          resolve(recordId);
        })
        .catch((error) => {
          reject(`Database insert failed: ${error}`);
        });
    });
  }

  /**
   * Update an existing record with edited image information
   * @param recordId - The UUID of the record to update
   * @param editedImageUrl - URL of the edited image
   * @param prompt - The prompt used for editing
   * @returns Promise that resolves when update is complete
   */
  async updateEditRecord(
    recordId: string,
    editedImageUrl: string,
    prompt: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbUrl = `${this.supabaseUrl}/rest/v1/image_edits?id=eq.${recordId}`;

      const requestBody = {
        edited_image_url: editedImageUrl,
        prompt: prompt,
      };

      const request = new Request(dbUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.supabaseKey}`,
          apikey: this.supabaseKey,
        },
        body: JSON.stringify(requestBody),
      });

      print("🎨 Updating database record with edit...");

      this.internetModule
        .fetch(request)
        .then(async (response) => {
          if (response.status !== 204) {
            const errorText = await response.text();
            reject(`Supabase DB update error (${response.status}): ${errorText}`);
            return;
          }

          print("✅ Edit saved to database!");
          resolve();
        })
        .catch((error) => {
          reject(`Database update failed: ${error}`);
        });
    });
  }

  /**
   * Generate a unique filename using timestamp
   */
  static generateFilename(prefix: string = "photo"): string {
    const timestamp = Date.now();
    return `${prefix}_${timestamp}.jpg`;
  }
}
