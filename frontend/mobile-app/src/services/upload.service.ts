
import AsyncStorage from "@react-native-async-storage/async-storage";

const MOCK_UPLOADS_KEY = "worthly_mock_uploads";

export interface CsvFile {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number;
}

function isBackendConfigured() {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.EXPO_PUBLIC_API_URL
  );
}

export async function uploadTransactionsCsv(file: CsvFile) {
  if (isBackendConfigured()) {
    const { api } = await import("./api");

    const formData = new FormData();

    formData.append(
      "file",
      {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "text/csv",
      } as any
    );

    const response = await api.post("/transactions/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  const savedUploads = await AsyncStorage.getItem(MOCK_UPLOADS_KEY);
  const uploads = savedUploads ? JSON.parse(savedUploads) : [];

  const mockUpload = {
    id: `mock-upload-${Date.now()}`,
    filename: file.name,
    size: file.size ?? null,
    uploaded_at: new Date().toISOString(),
    status: "selected_in_mock_mode",
  };

  uploads.unshift(mockUpload);

  await AsyncStorage.setItem(MOCK_UPLOADS_KEY, JSON.stringify(uploads));

  return {
    success: true,
    mock: true,
    message:
      "File selected successfully. Connect the backend to process its transactions.",
    data: mockUpload,
  };
}

export async function getUploadStatus(uploadId: string) {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get(
      `/transactions/upload/${encodeURIComponent(uploadId)}`
    );
    return response.data;
  }

  const savedUploads = await AsyncStorage.getItem(MOCK_UPLOADS_KEY);
  const uploads = savedUploads ? JSON.parse(savedUploads) : [];

  const upload = uploads.find((item: any) => item.id === uploadId);

  return {
    success: Boolean(upload),
    mock: true,
    data: upload ?? null,
  };
}
