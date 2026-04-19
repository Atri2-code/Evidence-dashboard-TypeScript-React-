export type Severity = 'high' | 'medium' | 'low' | 'info';

export interface VideoStream {
  codec_type: 'video' | 'audio';
  codec_name: string;
  width?: number;
  height?: number;
}

export interface VideoMetadata {
  filename: string;
  format_name: string;
  duration_seconds: number;
  size_bytes: number;
  bit_rate: number;
  creation_time: string | null;
  encoder: string | null;
  streams: VideoStream[];
}

export interface Finding {
  id: string;
  severity: Severity;
  category: string;
  detail: string;
}

export interface AnalysisResult {
  metadata: VideoMetadata;
  findings: Finding[];
  integrity_score: number;
  summary: string;
  analysed_at: string;
}
