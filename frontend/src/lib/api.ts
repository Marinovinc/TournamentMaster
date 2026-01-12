/**
 * =============================================================================
 * API Client - Wrapper per chiamate HTTP al backend
 * =============================================================================
 * Gestisce autenticazione, error handling, e upload files
 * =============================================================================
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Export for direct usage when needed (e.g., file uploads)
export const API_BASE_URL = API_URL;

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ msg: string; path: string }>;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Recupera il token JWT da localStorage
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Fetch wrapper con autenticazione automatica
 */
export async function api<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `HTTP ${res.status}`,
        errors: data.errors,
      };
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Upload file con multipart/form-data
 */
export async function uploadFile<T = unknown>(
  endpoint: string,
  file: File | Blob,
  fieldName: string,
  additionalData?: Record<string, string>
): Promise<ApiResponse<T>> {
  const token = getToken();

  const formData = new FormData();
  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Non impostare Content-Type per multipart/form-data
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `HTTP ${res.status}`,
        errors: data.errors,
      };
    }

    return data;
  } catch (error) {
    console.error("Upload Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload foto cattura - converte base64 in Blob e carica
 */
export async function uploadCatchPhoto(
  base64DataUrl: string,
  tournamentId?: string
): Promise<ApiResponse<{
  url: string;
  thumbnailUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}>> {
  // Converti base64 dataUrl in Blob
  const res = await fetch(base64DataUrl);
  const blob = await res.blob();

  // Crea File object
  const file = new File([blob], `catch_${Date.now()}.jpg`, {
    type: "image/jpeg",
  });

  return uploadFile("/api/upload/catch-photo", file, "photo", {
    ...(tournamentId && { tournamentId }),
  });
}

/**
 * Upload video cattura
 */
export async function uploadCatchVideo(
  videoBlob: Blob,
  tournamentId?: string
): Promise<ApiResponse<{
  url: string;
  thumbnailUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}>> {
  const file = new File([videoBlob], `video_${Date.now()}.mp4`, {
    type: "video/mp4",
  });

  return uploadFile("/api/upload/catch-video", file, "video", {
    ...(tournamentId && { tournamentId }),
  });
}

/**
 * Elimina file da Cloudinary
 */
export async function deleteUploadedFile(
  publicId: string,
  type: "image" | "video" = "image"
): Promise<ApiResponse<void>> {
  return api(`/api/upload/file?publicId=${encodeURIComponent(publicId)}&type=${type}`, {
    method: "DELETE",
  });
}

export default api;
