import { VideoMetadata, Finding, AnalysisResult, Severity } from '../types';

const KNOWN_ENCODERS = ['libx264', 'libx265', 'h264', 'hevc', 'vp9', 'av1', 'mpeg4', 'prores'];
const CONTAINER_CODEC_MAP: Record<string, string[]> = {
  mp4:  ['h264', 'hevc', 'mpeg4', 'av1'],
  mov:  ['h264', 'hevc', 'prores', 'dnxhd'],
  avi:  ['mpeg4', 'h264', 'xvid'],
  mkv:  ['h264', 'hevc', 'vp9', 'av1'],
  webm: ['vp9', 'av1', 'vp8'],
};

const uid = () => Math.random().toString(36).slice(2, 8);

function integrityScore(findings: Finding[]): number {
  const w: Record<Severity, number> = { high: 30, medium: 15, low: 5, info: 0 };
  return Math.max(0, 100 - findings.reduce((acc, f) => acc + w[f.severity], 0));
}

export function analyzeMetadata(meta: VideoMetadata): AnalysisResult {
  const findings: Finding[] = [];

  if (!meta.creation_time)
    findings.push({ id: uid(), severity: 'medium', category: 'Metadata',
      detail: 'No creation_time tag — common after metadata stripping or re-mux.' });

  if (!meta.encoder)
    findings.push({ id: uid(), severity: 'medium', category: 'Metadata',
      detail: 'Encoder tag absent — typical after transcoding or re-encoding.' });
  else if (!KNOWN_ENCODERS.some(e => meta.encoder!.toLowerCase().includes(e)))
    findings.push({ id: uid(), severity: 'low', category: 'Metadata',
      detail: `Unrecognised encoder: "${meta.encoder}". May indicate non-standard toolchain.` });

  if (meta.duration_seconds === 0)
    findings.push({ id: uid(), severity: 'high', category: 'Container',
      detail: 'Duration is 0 — container header may be corrupt or file is incomplete.' });

  if (meta.bit_rate > 0 && meta.bit_rate < 50_000)
    findings.push({ id: uid(), severity: 'medium', category: 'Bitrate',
      detail: `Very low bitrate (${meta.bit_rate.toLocaleString()} bps) — possible heavy re-compression.` });

  const container = meta.format_name.split(',')[0].trim();
  const videoStreams = meta.streams.filter(s => s.codec_type === 'video');

  videoStreams.forEach(stream => {
    const expected = CONTAINER_CODEC_MAP[container] ?? [];
    if (expected.length && !expected.includes(stream.codec_name))
      findings.push({ id: uid(), severity: 'high', category: 'Container/Codec Mismatch',
        detail: `Codec "${stream.codec_name}" is unusual inside a "${container}" container — possible re-wrap.` });
    findings.push({ id: uid(), severity: 'info', category: 'Stream Info',
      detail: `Video: ${stream.codec_name.toUpperCase()} @ ${stream.width ?? '?'}×${stream.height ?? '?'}` });
  });

  if (videoStreams.length > 1)
    findings.push({ id: uid(), severity: 'medium', category: 'Streams',
      detail: `${videoStreams.length} video streams found — standard recordings contain exactly 1.` });

  const score = integrityScore(findings);
  const high = findings.filter(f => f.severity === 'high').length;
  const medium = findings.filter(f => f.severity === 'medium').length;
  const summary =
    score >= 80 ? 'No significant anomalies detected.' :
    score >= 50 ? `${medium} medium-severity anomalies. Manual review recommended.` :
                  `${high} high-severity anomalies. File integrity is questionable.`;

  return { metadata: meta, findings, integrity_score: score, summary, analysed_at: new Date().toISOString() };
}

export function extractFromFile(file: File): Promise<VideoMetadata> {
  return new Promise(resolve => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'unknown';
      resolve({
        filename: file.name,
        format_name: ext,
        duration_seconds: video.duration ?? 0,
        size_bytes: file.size,
        bit_rate: file.size > 0 && video.duration > 0 ? Math.round((file.size * 8) / video.duration) : 0,
        creation_time: file.lastModified ? new Date(file.lastModified).toISOString() : null,
        encoder: null,
        streams: [{ codec_type: 'video', codec_name: ext === 'webm' ? 'vp9' : 'h264',
          width: video.videoWidth, height: video.videoHeight }],
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ filename: file.name, format_name: file.name.split('.').pop()?.toLowerCase() ?? 'unknown',
        duration_seconds: 0, size_bytes: file.size, bit_rate: 0, creation_time: null, encoder: null, streams: [] });
    };
  });
}

export const fmtDuration = (s: number): string => {
  if (!s) return 'Unknown';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
};

export const fmtSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  for (const u of units) { if (v < 1024) return `${v.toFixed(1)} ${u}`; v /= 1024; }
  return `${v.toFixed(1)} TB`;
};
