# Asset and licence ledger

Every non-code asset that ships in the app or appears in the demo video is listed here. Judges, and the YouTube no-copyrighted-material rule, depend on it. The `/judge-check` steering audits this file.

| Asset | Where used | Source URL | Licence | Notes |
|---|---|---|---|---|
| _Display font (decided at the Nov 21 mock: Monoton / Unbounded / Syne; Creepster fallback)_ | Logo, H1 | _Google Fonts specimen URL_ | SIL OFL 1.1 (check Reserved Font Name) | Self-hosted via `next/font` |
| Inter font | UI text | https://fonts.google.com/specimen/Inter | SIL OFL 1.1 | |
| JetBrains Mono font | Numbers/HUD | https://fonts.google.com/specimen/JetBrains+Mono | SIL OFL 1.1 | |
| Lucide icons | UI | https://lucide.dev | ISC | |
| OpenFreeMap tiles/style | Map; recoloured copy in `public/map/haunted-style.json` | https://openfreemap.org | Tiles: OpenMapTiles + OSM data (ODbL) | Attribution "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" must be visible in the app and the video |
| _sample rides_ | `public/samples/` | Builder's own rides | MIT (repo) | Privacy-scrubbed; see the ride-ingest spec, Req 8.3 |
| _sample archive_ | `public/samples/archive/` (P1) | Builder's own rides | MIT (repo) | Privacy-scrubbed; 1 km home/work test |
| _sample narration audio_ | `public/samples/narration/` | Generated once (provider decided in spike S3; `TTS_MODEL` = _fill in_) | _quote the provider's terms permitting public use of the output_ | Record model, voice, date and the terms URL |
| _builder's ride photo/footage_ | Demo video cold open | Builder's own | Own work | Brand logos blurred or cropped |
| _SFX (P2 only)_ | Replay ambience | _Kenney / Freesound CC0 / OpenGameArt CC0 URL_ | CC0 | One row per file |
