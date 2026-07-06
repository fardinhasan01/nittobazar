const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'dhn7zzleo';
const uploadFolder = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER ?? 'nitto-bazar/products';

export const CLOUDINARY_CLOUD_NAME = cloudName;

function getUploadUrl(file: File): string {
  const isVideo =
    file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi)$/i.test(file.name);
  return `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    return /network|timeout|failed to fetch/i.test(error.message);
  }
  return true;
}

export async function uploadFileToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
  retryCount = 0
): Promise<string> {
  if (!file) {
    throw new Error('No file selected for upload');
  }

  const uploadUrl = getUploadUrl(file);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'nitto-bazar');
  formData.append('folder', uploadFolder);

  try {
    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);
      xhr.timeout = 120000;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText) as {
            secure_url?: string;
            error?: { message?: string };
          };

          if (xhr.status >= 200 && xhr.status < 300) {
            if (!data.secure_url) {
              reject(new Error('Upload completed without a secure URL'));
              return;
            }
            resolve(data.secure_url);
            return;
          }

          reject(new Error(data.error?.message || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));
      xhr.send(formData);
    });
  } catch (error) {
    if (retryCount >= 2 || !isRetryableError(error)) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return uploadFileToCloudinary(file, onProgress, retryCount + 1);
  }
}
