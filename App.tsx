import { useState, useCallback } from 'react';
import { AnalysisResult, Severity } from './types';
import { analyzeMetadata, extractFromFile, fmtDuration, fmtSize } from './utils/analyzer';

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; dot: string }> = {
  high:   { label: 'HIGH',   color: '#791F1F', bg: '#FCEBEB', dot: '#E24B4A' },
  medium: { label: 'MEDIUM', color: '#633806', bg: '#FAEEDA', dot: '#EF9F27' },
  low:    { label: 'LOW',    color: '#185FA5', bg: '#E6F1FB', dot: '#378ADD' },
  info:   { label: 'INFO',   color: '#5F5E5A', bg: '#F1EFE8', dot: '#888780' },
};

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 80 ? '#639922' : score >= 50 ? '#BA7517' : '#A32D2D';
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={36} fill="none" stroke="var(--color-background-secondary)" strokeWidth={8} />
        <circle cx={48} cy={48} r={36} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 48 48)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x={48} y={44} textAnchor="middle" fontSize={20} fontWeight={500} fill="var(--color-text-primary)">{score}</text>
        <text x={48} y={60} textAnchor="middle" fontSize={10} fill="var(--color-text-secondary)">/100</text>
      </svg>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Integrity score</span>
    </div>
  );
}

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);
  return (
    <div onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)} onDrop={onDrop}
      style={{
        border: `1.5px dashed ${drag ? 'var(--color-border-primary)' : 'var(--color-border-secondary)'}`,
        borderRadius: 'var(--border-radius-lg)', padding: '3rem 2rem',
        textAlign: 'center', cursor: 'pointer',
        background: drag ? 'var(--color-background-secondary)' : 'transparent',
        transition: 'all 0.15s',
      }}
      onClick={() => { const i = document.createElement('input'); i.type = 'file';
        i.accept = 'video/*'; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onFile(f); }; i.click(); }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>
        <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth={1.5}>
          <rect x={2} y={3} width={20} height={18} rx={2} /><path d="M10 9l5 3-5 3V9z" fill="var(--color-text-tertiary)" stroke="none"/>
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
        Drop a video file or click to browse
      </p>
      <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', margin: 0 }}>
        MP4, MOV, AVI, MKV, WebM supported
      </p>
    </div>
  );
}

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    const meta = await extractFromFile(file);
    const analysis = analyzeMetadata(meta);
    setResult(analysis);
    setLoading(false);
  }, []);

  const meta = result?.metadata;
  const nonInfo = result?.findings.filter(f => f.severity !== 'info') ?? [];
  const infoFindings = result?.findings.filter(f => f.severity === 'info') ?? [];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'var(--font-sans)' }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
          Evidence Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          Forensic video integrity analysis · evidence-dashboard
        </p>
      </div>

      {!result && !loading && <DropZone onFile={handleFile} />}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Extracting metadata...
        </div>
      )}

      {result && meta && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 2px', color: 'var(--color-text-primary)' }}>
                {meta.filename}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
                {result.analysed_at.replace('T', ' ').slice(0, 19)} UTC
              </p>
            </div>
            <button onClick={() => setResult(null)} style={{
              fontSize: 12, padding: '6px 14px', cursor: 'pointer',
              borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-secondary)',
              background: 'transparent', color: 'var(--color-text-secondary)',
            }}>
              Analyse another ↩
            </button>
          </div>

          {/* Score + summary */}
          <div style={{
            display: 'flex', gap: 20, alignItems: 'center',
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)', padding: '1.25rem',
          }}>
            <ScoreMeter score={result.integrity_score} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 14, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                {result.summary}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['high','medium','low'] as const).map(sev => {
                  const count = result.findings.filter(f => f.severity === sev).length;
                  const cfg = SEVERITY_CONFIG[sev];
                  return count > 0 ? (
                    <span key={sev} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99,
                      background: cfg.bg, color: cfg.color }}>
                      {count} {cfg.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* Metadata grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))',
            gap: 10,
          }}>
            {[
              { label: 'Format', value: meta.format_name.toUpperCase() },
              { label: 'Duration', value: fmtDuration(meta.duration_seconds) },
              { label: 'File size', value: fmtSize(meta.size_bytes) },
              { label: 'Bit rate', value: meta.bit_rate > 0 ? `${(meta.bit_rate / 1000).toFixed(0)} kbps` : 'Unknown' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-md)', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Metadata tags */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Container tags</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {[
                { label: 'Creation time', value: meta.creation_time ?? 'Not present' },
                { label: 'Encoder', value: meta.encoder ?? 'Not present' },
                { label: 'Streams', value: `${meta.streams.length}` },
                { label: 'Resolution', value: meta.streams.find(s => s.codec_type === 'video')
                  ? `${meta.streams.find(s => s.codec_type === 'video')!.width ?? '?'}×${meta.streams.find(s => s.codec_type === 'video')!.height ?? '?'}` : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0',
                  borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 13 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ color: value === 'Not present' ? '#A32D2D' : 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)', fontSize: 12 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Findings */}
          {nonInfo.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Findings</p>
              {nonInfo.map(f => {
                const cfg = SEVERITY_CONFIG[f.severity];
                return (
                  <div key={f.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: 'var(--color-background-primary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 'var(--border-radius-md)', padding: '0.75rem 1rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot,
                      marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99,
                          background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{f.category}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--color-text-primary)', margin: 0 }}>{f.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stream info */}
          {infoFindings.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {infoFindings.map(f => (
                <span key={f.id} style={{ fontSize: 12, padding: '4px 10px',
                  background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)',
                  color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {f.detail}
                </span>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
