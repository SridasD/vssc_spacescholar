export interface ContentStat {
  contentType: string;
  totalDocuments: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  percentageCompleted: number;
  partiallyCompleted: number;
}
