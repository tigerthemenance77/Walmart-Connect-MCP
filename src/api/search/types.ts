export type WalmartApiType = "search" | "display";

export interface SnapshotStatus {
  jobStatus: "pending" | "processing" | "done" | "failed" | "expired";
  estimatedCompletionSeconds: number | null;
  snapshotId: string;
  downloadUrl?: string;
}
