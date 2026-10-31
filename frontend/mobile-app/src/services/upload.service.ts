
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isBackendConfigured } from "./api";

const MOCK_UPLOADS_KEY = "worthly_mock_uploads";

export interface CsvFile {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number;
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

    const response = await api.post("/transactions/upload/csv", formData, {
      // The shared Axios client defaults to JSON. Override that for FormData
      // so Axios leaves the body intact and the native adapter adds the
      // multipart boundary; otherwise FastAPI sees no `file` field (422).
      headers: { "Content-Type": "multipart/form-data" },
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
    void uploadId;
    throw new Error("Upload status lookup is not available in the FastAPI contract yet.");
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
