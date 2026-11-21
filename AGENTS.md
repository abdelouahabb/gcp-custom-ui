# CloudPulse 2026 (`gcp-ui`) — Agent Context Handoff

## 1. Repository & Stack
- **Package**: `cloudpulse-2026-gcp-pwa` (v3.0.0)
- **Frontend**: React 19 + Vite 6 + Tailwind CSS + Lucide React + ECharts + Xterm.js (`http://localhost:5173`)
- **Backend**: Express + WebSocket (`ws`) + `ssh2` + Google Cloud REST APIs (`http://127.0.0.1:4000`, [server/index.js](server/index.js), [server/cloudNexusRoutes.js](server/cloudNexusRoutes.js), [server/emulatorsRoutes.js](server/emulatorsRoutes.js), [server/wave26FrontierRoutes.js](server/wave26FrontierRoutes.js))
- **Dev Server**: `npm run dev` (Vite auto-heals and starts `server/index.js` on port `4000`).

## 2. Non-Negotiable Engineering Rules
1. **Zero Simulation / Zero Mock Data**: Every action, scan, query, backup, sweep, deletion, and log stream must execute real Google Cloud REST APIs, `gcloud`, `psql`, `docker`, or SSH/SFTP commands against live infrastructure.
2. **Dynamic Multi-Project Discovery & Zero Hardcoding**: Never hardcode any GCP project ID, personal username, or machine-specific absolute path anywhere in frontend, backend, or docs.
3. **Zero Astral Emojis in UI**: Use `lucide-react` SVG icons only.
4. **Selection & Button Color Discipline**: Warm-Amber (`#f59e0b`) for active tabs/selections/left nav rail; solid blue (`bg-blue-600 text-white`) strictly for enabled primary CTAs.
5. **Mandatory Destructive Action Gatekeeper**: Every mutating `DELETE`/`POST`/`PATCH` endpoint must have a bespoke plain-English modal in `classifyDestructiveAxiosConfig` ([src/App.jsx](src/App.jsx)); non-mutating read-only `POST` endpoints must be explicitly exempted.
6. **Official Gemini 4 Family**: Default to `gemini-4-carbon`, `gemini-4-argon`, `gemini-4-neon`, `gemini-4-hydrogen` (+ `gemini-3.8-flash-cyber`). Never use legacy Gemini 1.5/2.x IDs.
7. **Mermaid Single-Line Labels**: `parseMermaidFlowchart` in [MermaidArchitectureDiagram.jsx](src/components/MermaidArchitectureDiagram.jsx) parses line-by-line—never put raw `\n` inside `["..."]` Mermaid node labels.

## 3. Core Active Studios (Latest Architecture)
- **AlloyDB Mastery & Express Studio (`ALLOYDB_STUDIO`)**: [AlloyDbMasteryStudio.jsx](src/components/AlloyDbMasteryStudio.jsx) — 6 pillars covering 10 differentiation scenarios (PG 18 Express + in-place Enterprise upgrade, `pglogical` zero-lock-in + deterministic DDL X-Ray, SCaNN vs `pgvector` ECharts, 36-Month TCO + Executive Dossier `.md`, Sovereign CMEK/DORA Shield, Terraform `.tf` compiler, live `psql` & local `google/alloydbomni:latest` Docker control plane, Dual-Engine Gemini 4 NL2SQL, and Live Demo Director & Presenter Cockpit).
- **Live 6-Engine Data Fabric Mesh, 4-Stage RAG Loop & Auto-Orchestrator (`DATA_FABRIC_MESH`)**: [DataFabricMeshBridge.jsx](src/components/DataFabricMeshBridge.jsx) (mounted in [DataEngineeringStudio.jsx](src/components/DataEngineeringStudio.jsx)) — unifies Cloud Storage, AlloyDB, Cloud SQL, Managed Spark 3.5 Lightning, BigLake Iceberg, and BigQuery Gemini 4 with live cross-engine bridge synthesis, live 4-stage RAG Loop (`POST /api/project/:id/data-fabric/rag-loop`: GCS Upload → BigQuery Gemini 4 + 768-d `text-embedding-005` → Local AlloyDB Omni `alloydb_scann` index → Sub-5ms Semantic Search), and **Data Fabric Auto-Orchestrator** (`POST /api/project/:id/data-fabric/orchestrate`: Cloud Workflows YAML, Composer Airflow DAG, Dataform SQLX + live Cloud Workflows deploy & execution; documented in Section 57 of `InteractiveDocsGuide.jsx`).
- **BigQuery Studio (`BIGQUERY_STUDIO`)**: [BigQueryStudio.jsx](src/components/BigQueryStudio.jsx) — Pre-Crime Dry-Run & schema-safe SQL Auto-Optimizer, 4-stage live Dremel Execution Flight-Card, DDL/0-row completion card with 1-click `Preview Table`, and 1-click BigQuery Connection SA IAM auto-remediation (`roles/aiplatform.user` + `roles/storage.objectViewer`).
- **Managed Spark 3.5 Lightning, Cloud Storage Studio, Chrono-Log SRE Hub, Global Network World Map, GDE Privacy Shield (`Alt+G`), SDK `594.0.0` Wave 6 Frontier Lab, Local Emulators Studio (`LOCAL_EMULATORS`), Cloud Nexus (`CLOUD_NEXUS`)**: All live, verified, and bi-directionally wired.

## 4. Historical Milestones Archive
All prior waves and detailed milestone logs (A through Q) are archived in [docs/MILESTONES_ARCHIVE.md](docs/MILESTONES_ARCHIVE.md) to keep active prompt context lean.
