import { Platform } from "react-native";
import type { ReportPdf } from "./reports.service";

export async function openReportPdf(data: ReportPdf, assessmentId: string) {
  const fileName = `Worthly_Report_${assessmentId.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;

  if (Platform.OS === "web") {
    const blob = new Blob([data as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const { File, Paths } = await import("expo-file-system");
  const file = new File(Paths.cache, fileName);
  file.create({ intermediates: true, overwrite: true });
  await file.write(data);
  await file.preview({ mimeType: "application/pdf", title: "Worthly Report" });
}
