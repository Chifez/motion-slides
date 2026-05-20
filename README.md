<img width="1200" height="630" alt="MotionSlides Header" src="https://github.com/user-attachments/assets/a6715a9e-2037-4ace-8d39-39942ac48d92" />

# MotionSlides

**MotionSlides** is a high-fidelity, agentic presentation studio designed to bridge the gap between static design tools and cinematic motion. It brings Apple Keynote-level "Magic Move" transitions, developer-centric diagramming, and an integrated AI Design Studio to the browser.

Built for engineers, architects, and presenters who demand fluid, physics-based animations, MotionSlides treats every slide as a scene state, automatically interpolating motion, color, and structure using an advanced FLIP-based engine.

---

## Table of Contents
1. [Key Features](#-key-features)
2. [AI Design Studio](#-ai-design-studio)
3. [Magic Move Engine](#-magic-move-engine)
4. [Architecture & Infrastructure Diagramming](#-architecture--infrastructure-diagramming)
5. [Sharing & Collaboration](#-sharing--collaboration)
6. [Professional Export](#-professional-export)
7. [Shortcuts & Hotkeys](#️-shortcuts--hotkeys)
8. [How To Guide](#-how-to-guide)
9. [Tech Stack](#️-tech-stack)
10. [Project Structure](#-project-structure)
11. [Architecture: How it Works](#-architecture-how-it-works)
12. [Developer's Guide (Backend)](#-developers-guide-backend)
13. [Getting Started](#-getting-started)
14. [License](#-license)

---

## Key Features

### Premium Design Surface
- **Infinite Canvas & Camera**: Pan, zoom, and navigate a responsive workspace inspired by Figma.
- **Unsplash Integration**: Built-in background image library with curated presets and custom URL support.
- **Smart Identity Tracking**: Every element has a unique ID used for seamless state interpolation.
- **Theme Awareness**: Toggle between sleek Dark and Light modes for both the editor and the presentation viewer.

### View-Only Mode
- **Cinematic Experience**: A specialized guest interface that hides administrative panels and toolbars for a distraction-free presentation.
- **Responsive Viewer**: Automatically scales the canvas to fit any screen size while maintaining the intended aspect ratio (16:9, 4:3, 1:1, or 9:16).

---

## AI Design Studio

MotionSlides includes a unified agentic chat interface designed for rapid technical storytelling:
- **Iterative Refinement**: A single chat input handles initial generation and continuous refinements. No more context switching.
- **System Generation**: Describe an architecture (e.g., "A multi-region Kubernetes cluster with RDS"), and the AI builds the complete diagram.
- **Content Hydration**: Paste a technical README or transcript, and the AI extracts themes, code blocks, and key takeaways into a structured deck.
- **Icon Intelligence**: Automatic contextual injection of **800+ AWS and GCP assets** via a localized RAG icon resolver.

---

## Magic Move Engine

Unlike traditional "slide-by-slide" tools, MotionSlides uses a **State-Based Diffing Engine**:
- **FLIP Animation**: Elements present across multiple slides are automatically matched. The engine calculates the delta and applies smooth interpolation.
- **Code Morphing**: Powered by **Shiki** and custom LCS diffing. Unchanged code lines slide to new positions, while additions and deletions cascade with staggered delays.
- **Spring Physics**: All motion uses second-order differential equations (Springs), providing a weighted, premium feel without rigid linear paths.
- **Identity Heuristics**: Even if you change an element's type or color, MotionSlides maintains its motion identity.

---

## Architecture & Infrastructure Diagramming

Designed for technical documentation and cloud architecture reviews:
- **Smart Anchors**: Elements feature "snap-to" handles (Top, Right, Bottom, Left, Center) for precise line routing.
- **Advanced Connectors**: Support for Elbow, Curved, Straight, and **Branching** lines that stay attached to their targets during transforms.
- **Tiers & Boundaries**: Use the **Section Tool** to define VPC boundaries, security perimeters, or logical groupings with custom dashed borders and corner radii.
- **Clustering**: Automatically stack and cluster similar infrastructure icons (e.g., EC2 instances) to clean up complex diagrams.

---

## Sharing & Collaboration

MotionSlides features a robust, offline-first synchronization architecture:
- **Link-Based Sharing**: Toggle between Private, Link-Shared, and Collaborative modes.
- **Monotonic Sync Engine**: Uses a **Last-Write-Wins (LWW)** conflict resolution strategy hardened with monotonic timestamps to prevent clock-skew from blocking updates.
- **Incognito Support**: Access shared projects instantly via secure Share Keys without requiring a login.
- **Persistence**: Hybrid storage using **Zustand** for state, **IndexedDB** for local persistence, and **Drizzle/Postgres** for cloud synchronization.

---

## Professional Export

Capture your transitions with frame-perfect accuracy:
- **Deterministic Capture Engine**: Uses a virtual clock to "freeze" the browser during capture, ensuring every frame of a Magic Move transition is rendered without drops.
- **Multi-Format Support**: Export high-bitrate **WebM/VP9**, **MP4**, or high-fidelity **PDF**.
- **Frame Pipelining**: Puppeteer-driven server architecture that pipes raw frame buffers directly into FFmpeg for maximum performance.

---

## Shortcuts & Hotkeys

### Editor Mode
| Shortcut | Action |
| :--- | :--- |
| `Cmd/Ctrl + D` | Duplicate selected element(s) |
| `Cmd/Ctrl + G` | **Group** selected elements |
| `Cmd/Ctrl + Shift + G` | **Ungroup** selected group |
| `Backspace / Delete` | Delete selected element(s) |
| `Arrow Up / Down` | Navigate between slides |

### Presentation Mode
| Shortcut | Action |
| :--- | :--- |
| `Space` or `Arrow Right` | Next Slide / Build Step |
| `Arrow Left` | Previous Slide / Build Step |
| `Escape` | Exit Presentation |

---

## How-To Guide

### Grouping Elements
Managing complex diagrams is easy with grouping:
1. **Multi-Select**: Click and drag on the canvas to lasso elements, or hold `Shift` while clicking.
2. **Group**: Press `Cmd/Ctrl + G`. A dashed bounding box will appear.
3. **Transform**: Dragging or scaling the group handles will affect all children proportionally.
4. **Ungroup**: Press `Cmd/Ctrl + Shift + G` to break the group back into individual elements.

### Mastering Magic Move
To create a "Magic Move" transition:
1. Create an element/elements on Slide 1.
2. Duplicate Slide 1 using the icon next to the slide thumbnail, or copy and paste that element into Slide 2.
3. Modify its properties on Slide 2 (change position, size, color, or rotation).
4. MotionSlides will automatically detect the identical IDs and smoothly animate the transition between states.

---

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) / [TanStack Start](https://tanstack.com/start) (React 19)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) + IndexedDB
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Diagramming Core**: [@xyflow/react](https://reactflow.dev/)
- **Icons**: [Lucide](https://lucide.dev/)

### Backend & AI
- **Auth**: [Better-Auth](https://www.better-auth.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **AI Pipeline**: Vercel AI SDK (GPT-4o, Claude 3.5 Sonnet)
- **Syntax Highlighting**: [Shiki](https://shiki.style/)

---

## Project Structure

- **`apps/web`**: Main React application, editor UI, and TanStack Start server handlers.
- **`apps/export-server`**: Dedicated Node.js service for headless Puppeteer + FFmpeg rendering.
- **`packages/shared`**: Centralized Scene Graph definitions and TypeScript types.
- **`scripts/`**: Tools for asset manifest generation and RAG indexing.

---

## Architecture: How it Works

The Magic Move engine operates on a 5-step lifecycle:
1. **Match**: The `motionEngine` compares Slide A and Slide B to find elements with matching IDs or matching heuristics.
2. **Diff**: It identifies which elements are *Continuing*, *Added*, or *Removed*.
3. **Measure**: The browser records the "Final" layout of all elements.
4. **Invert**: The engine calculates the delta from the "Initial" layout.
5. **Animate**: Framer Motion projects the elements back to their initial state and animates the deltas using spring physics.

---

## Developer's Guide (Backend)

MotionSlides leverages a high-performance backend architecture for AI and media processing.

### AI Generation Pipeline
The backend (TanStack Start handlers) handles the transformation of raw text into structured slide data:
1. **RAG Icon Resolver**: Scans the `public/icons` directory to build a contextual map of available SVG paths, ensuring the AI selects real assets.
2. **Structured Output**: Uses **Zod** to enforce strict JSON schemas, guaranteeing that generated slides are always renderable.
3. **SSE Streaming**: Progress events are streamed to the client in real-time.

### Export Server
The `export-server` handles high-bitrate video synthesis:
- **Virtual Clock**: Injects a timing override into the browser to capture animations frame-by-frame with 100% determinism.
- **Frame Pipelining**: Pipes raw JPEG buffers from Puppeteer directly into FFmpeg stdin to minimize disk I/O.

---

## Getting Started

### Prerequisites
- **Node.js** (v20+)
- **npm** (recommended) or pnpm/yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Chifez/motion-slides.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in `apps/web` with your database and AI provider keys.
4. Start the development studio:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built for the creative developer community.
