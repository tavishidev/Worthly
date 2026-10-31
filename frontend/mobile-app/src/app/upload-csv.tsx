import { useAppStyles, useAppTheme } from "@/components/app-theme";

import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";

import { BrandLockup } from "@/components/brand-lockup";
import { useFeedback } from "@/components/feedback";
import { MotionPressable as TouchableOpacity, ScreenEntrance } from "@/components/motion";
import { COLORS } from "@/constants/colors";
import {
  CsvFile,
  uploadTransactionsCsv,
} from "@/services/upload.service";

export default function UploadCsvScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const { notify } = useFeedback();
  const [selectedFile, setSelectedFile] = useState<CsvFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);

  async function chooseCsvFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.name.toLowerCase().endsWith(".csv")) {
        notify(
          "Unsupported file",
          "Please select a file with the .csv extension.",
          "error"
        );
        return;
      }

      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      });

      setUploadResult(null);
      setIsMockResult(false);
    } catch (error: any) {
      notify(
        "File selection failed",
        error?.message || "Could not open the document picker.",
        "error"
      );
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      notify("No file selected", "Please select a CSV file first.", "error");
      return;
    }

    setLoading(true);
    setUploadResult(null);

    try {
      const response = await uploadTransactionsCsv(selectedFile);

      setIsMockResult(Boolean(response?.mock));

      const message =
        response?.message ||
        (response?.mock
          ? "File selected in mock mode."
          : "Your file was submitted successfully.");

      setUploadResult(message);

      notify(
        response?.mock ? "File selected" : "Upload submitted",
        message,
        "success"
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Please try again.";

      notify("Upload failed", message, "error");
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(bytes?: number) {
    if (bytes === undefined || bytes === null) {
      return "Size unavailable";
    }

    if (bytes < 1024) {
      return `${bytes} bytes`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <ScreenEntrance>
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BrandLockup compact />
        <Text style={styles.eyebrow}>WORTHLY · DATA IMPORT</Text>

        <Text style={styles.heading}>Upload transactions</Text>

        <Text style={styles.subtitle}>
          Import your financial activity using a CSV file. Worthly can use
          these transactions to build your financial overview.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Before you upload</Text>

          <Text style={styles.infoText}>
            • Select a CSV file exported from your bank or financial records.
          </Text>

          <Text style={styles.infoText}>
            • Make sure the file contains transaction dates, descriptions and
            amounts.
          </Text>

          <Text style={styles.infoText}>
            • Your backend team will validate the CSV columns and transaction
            data.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.pickerCard}
          onPress={chooseCsvFile}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={34}
            color={colors.primary}
            style={styles.fileIcon}
          />

          <Text style={styles.pickerTitle}>
            {selectedFile ? "Choose another file" : "Select CSV file"}
          </Text>

          <Text style={styles.pickerSubtitle}>
            Tap here to browse files on your device
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedIcon}>
              <Text style={styles.selectedIconText}>CSV</Text>
            </View>

            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>
                {selectedFile.name}
              </Text>

              <Text style={styles.fileSize}>
                {formatFileSize(selectedFile.size)}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedFile || loading) && styles.disabledButton,
          ]}
          onPress={handleUpload}
          disabled={!selectedFile || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload transactions</Text>
          )}
        </TouchableOpacity>

        {uploadResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              {isMockResult ? "Mock mode" : "Upload response"}
            </Text>

            <Text style={styles.resultText}>{uploadResult}</Text>

            {isMockResult && (
              <Text style={styles.resultNote}>
                The file has not been processed into transactions yet. This
                requires the connected backend.
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/transactions")}
        >
          <Text style={styles.secondaryButtonText}>
            View manual transactions
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Only upload financial files you are authorised to use. Avoid sharing
          passwords, PINs or other banking credentials.
        </Text>
      </ScrollView>
    </View>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: 22,
    paddingBottom: 45,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  heading: {
    color: COLORS.text,
    fontSize: 29,
    fontWeight: "900",
    marginBottom: 9,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 23,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 17,
    marginBottom: 22,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  infoText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  pickerCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    borderRadius: 17,
    padding: 27,
    alignItems: "center",
    marginBottom: 17,
  },
  fileIcon: {
    fontSize: 35,
    marginBottom: 12,
  },
  pickerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  pickerSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 7,
  },
  selectedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  selectedIcon: {
    width: 43,
    height: 43,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIconText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  fileSize: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 3,
  },
  disabledButton: {
    opacity: 0.45,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 13,
    marginTop: 17,
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
  },
  resultText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
  },
  resultNote: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 16,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  disclaimer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 20,
  },
});
