# evidence-dashboard (TypeScript / React)

> Browser-based forensic video analysis dashboard. Drop in a video file, extract metadata, detect integrity anomalies, and review findings — all client-side with zero backend required.

Built with React + TypeScript. Mirrors the kind of investigative tooling used by public safety platforms to review and validate video evidence.

---

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/evidence-dashboard.git
cd evidence-dashboard
npm install
npm run dev
```

Open `http://localhost:5173`, drop in any video file, and the dashboard analyses it instantly.

---

## What it does

1. **Extracts** video metadata client-side using the browser's native media APIs
2. **Analyses** the file for forensic anomalies using a typed rule engine
3. **Scores** integrity 0–100 based on weighted finding severity
4. **Displays** findings categorised by severity with a summary and metadata breakdown

---

## Anomaly detection rules

| Rule | Severity | Signal |
|------|----------|--------|
| Missing creation timestamp | Medium | Metadata stripping or re-mux |
| Absent encoder tag | Medium | Post-transcoding artifact |
| Duration reported as 0 | High | Corrupt or incomplete container |
| Bitrate < 50 kbps | Medium | Heavy re-compression |
| Container/codec mismatch | High | Possible re-wrap (e.g. VP9 in MP4) |
| Multiple video streams | Medium | Non-standard recording |

---

## Project structure

```
evidence-dashboard/
├── src/
│   ├── App.tsx               # Main dashboard UI
│   ├── types/index.ts        # Shared TypeScript interfaces
│   └── utils/analyzer.ts     # Analysis engine + metadata extraction
├── package.json
└── README.md
```

---

## Skills demonstrated

| Engineering competency | Implementation |
|---|---|
| TypeScript / React | Typed components, hooks, strict interfaces |
| Media processing | Browser MediaAPI metadata extraction |
| Forensic tooling | Rule-based anomaly detection engine |
| Frontend engineering | Responsive dashboard, drag-and-drop, SVG meter |
| Zero-dependency design | Runs fully client-side, no backend needed |

---

## Roadmap

- [ ] Azure Blob Storage integration — load evidence files directly from cloud storage
- [ ] Frame extraction and thumbnail timeline
- [ ] Export findings as PDF case report
- [ ] REST API backend (.NET / C#) for server-side ffprobe analysis
- [ ] Multi-file batch queue with aggregate reporting

---

## License

MIT
