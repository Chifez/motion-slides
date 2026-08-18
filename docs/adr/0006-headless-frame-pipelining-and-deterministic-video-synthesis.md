# ADR 006: Headless Frame Pipelining & Deterministic Video Synthesis

## Status
**Accepted** (2026-08-18)

## Context & Problem Statement
MotionSlides produces high-resolution presentation videos (WebM/VP9, MP4) and vector PDFs with complex Magic Move transitions and spring physics. Capturing these transitions in real-time on a client browser using standard screen recording or `canvas.captureStream()` results in dropped frames, stutter, CPU throttling, and audio/video desynchronization.

We need an export architecture that:
1. Renders transitions with 100% frame determinism at high bitrates (60fps 1080p/4K) regardless of system load.
2. Injects a virtual clock into the browser environment to advance animations frame-by-frame (`requestAnimationFrame` override) without relying on real wall-clock time.
3. Synthesizes video frames at maximum speed without creating thousands of intermediate image files on physical disk.
4. Manages asynchronous export jobs reliably using a persistent background task queue.

## Decision Drivers
- **Deterministic Quality**: Every single frame of spring physics and code morphing must be captured without jitter or dropped frames.
- **Resource Efficiency**: Direct memory-to-stream frame piping to eliminate disk I/O bottlenecks.
- **Scalability**: Decouple intensive video rendering from the user-facing web server into a standalone export worker service (`apps/export-server`).
- **Multi-Format Output**: Produce high-fidelity WebM (VP9), MP4 (H.264), and high-resolution PDF decks.

## Decision Outcome
We implemented a dedicated **Headless Frame Pipelining Architecture** (`apps/export-server`):

1. **Standalone Microservice**:
   - `apps/export-server` is an isolated Node.js service using Express, BullMQ, Redis, Puppeteer, and fluent-ffmpeg.
2. **Virtual Clock Injection (`renderer/`)**:
   - Puppeteer loads the presentation in dedicated headless capture mode (`/export-view`).
   - A virtual clock script intercepts `performance.now()`, `Date.now()`, and `requestAnimationFrame`, advancing time in exact $\Delta t = 1/60\text{s}$ increments.
3. **Direct Stdin Buffer Pipelining**:
   - Puppeteer captures raw JPEG/PNG frame buffers directly in memory.
   - Buffers are piped immediately into FFmpeg's `stdin` stream via `fluent-ffmpeg`, avoiding temporary disk writes.
4. **Persistent Job Queue**:
   - BullMQ and Redis manage export queues, concurrency limits, progress tracking, and job retries.
5. **Deterministic PDF Export**:
   - Vector PDFs are synthesized using `pdfkit` / Puppeteer page print with explicit page dimensions and zero margin clipping.

---

## Negative Space & Forbidden Alternatives

The following tools, paradigms, and patterns are **STRICTLY FORBIDDEN** in this repository:

| Forbidden Alternative | Reason for Rejection & Threat to Architecture |
| :--- | :--- |
| **Client-Side `canvas.captureStream()` / MediaRecorder** | Wall-clock dependent, susceptible to browser tab throttling, drops frames under heavy JS execution, produces low-bitrate recordings. |
| **Intermediate Disk Frame Spooling** | Writing 3,600 individual image files to disk for a 60-second video destroys SSD throughput and creates disk exhaustion vulnerabilities. |
| **Running Puppeteer Inside the Web App (`apps/web`)** | Headless Chrome consumes heavy CPU/RAM; running it inside the Nitro web process degrades editor responsiveness and causes server crashes. |
| **Real-Time Wall-Clock Recording** | Any recording mechanism that relies on real elapsed time fails to guarantee 60fps consistency during complex slide morphs. |

---

## Agent Guardrails (Automated Enforcement Rules)

AI Agents modifying this codebase must adhere to the following strict guardrails:

1. **Isolate Video Encoding Workloads**:
   - All FFmpeg, Puppeteer capture, and video encoding logic MUST reside within `apps/export-server/`. Never import `puppeteer` or `fluent-ffmpeg` into `apps/web/`.
2. **Virtual Clock Preservation**:
   - Never remove or bypass the virtual clock hook in `apps/web/src/routes/export-view.tsx`. The headless renderer depends on deterministic step triggers.
3. **Pipe Frames Directly to FFmpeg `stdin`**:
   - Do NOT modify the frame capture loop to save intermediary `.png`/`.jpg` files to filesystem directories. Always stream raw buffers.
4. **Queue Gating**:
   - Client export requests from `apps/web` must dispatch jobs to the export server queue via `export-client.ts`.

---

## Consequences & Trade-offs

### Positive
- **Studio-Grade Video Output**: Flawless, crisp 60fps renders with zero dropped frames.
- **Fast Render Times**: Memory-piped FFmpeg encoding executes significantly faster than disk-bound pipelines.
- **Isolated Failure Domain**: Heavy rendering jobs do not impact web editor performance.

### Negative
- **Infrastructure Requirement**: Running the export pipeline requires Redis and an external FFmpeg binary.

---

## References & Code Artifacts
- Export Server Entrypoint: [apps/export-server/index.ts](file:///c:/Users/c/Desktop/motionslides/apps/export-server/index.ts)
- Queue Manager: [apps/export-server/queue.ts](file:///c:/Users/c/Desktop/motionslides/apps/export-server/queue.ts)
- Web Export View Route: [apps/web/src/routes/export-view.tsx](file:///c:/Users/c/Desktop/motionslides/apps/web/src/routes/export-view.tsx)
- Web Export Client: [apps/web/src/lib/export-client.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/export-client.ts)
