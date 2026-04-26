<img width="1200" height="630" alt="og (2)" src="https://github.com/user-attachments/assets/a6715a9e-2037-4ace-8d39-39942ac48d92" />

# 🎬 MotionSlides

**MotionSlides** is a high-fidelity, web-based presentation engine designed to bring Apple Keynote-level "Magic Move" transitions and developer-centric features to the browser.

Built for presenters who demand fluid, physics-based animations and seamless code-block transitions, MotionSlides treats every slide as a scene state, automatically calculating the most elegant way to move, morph, and build elements.

---

## 📍 Table of Contents
1. [✨ Key Features](#-key-features)
2. [🤖 AI Designer (New)](#-ai-designer)
3. [⌨️ Shortcuts & Hotkeys](#️-shortcuts--hotkeys)
4. [📖 How-To Guide](#-how-to-guide)
   - [Grouping Elements](#grouping-elements)
   - [Mastering Magic Move](#mastering-magic-move)
5. [🛠️ Tech Stack](#️-tech-stack)
6. [📂 Project Structure](#-project-structure)
7. [💻 Developer's Guide (Backend)](#-developers-guide-backend)
8. [🚀 Getting Started](#-getting-started)
9. [🧠 Architecture: How it Works](#-architecture-how-it-works)
10. [📄 License](#-license)

---

## ✨ Key Features

### 🪄 Magic Move (Smart Identity)
Unlike traditional slide decks that rely on simple fade transitions, MotionSlides uses a state-based diffing engine. 
- **FLIP Animation**: Elements present on multiple slides are automatically matched and interpolated using the FLIP (First, Last, Invert, Play) technique.
- **Identity Tracking**: Elements maintain a persistent identity, allowing them to glide, scale, and rotate smoothly across the canvas.
- **Spring Physics**: All motion is powered by second-order differential equations (Springs), giving every transition a weighted, premium feel.

### 💻 Code Morphing
Presenting code has never been smoother.
- **LCS Diffing**: Uses the Longest Common Subsequence algorithm to diff code lines. Unchanged lines slide vertically to their new positions, while new lines cascade in.
- **Syntax-Aware**: Powered by **Shiki**, providing beautiful, accurate syntax highlighting for dozens of languages.
- **Cascading Builds**: Added and removed lines use staggered delays for a professional "building" effect.

### 🎨 Modern Canvas Editor
A professional editing experience inspired by Figma and Keynote.
- **Layer Management**: Control z-index, opacity, and grouping.
- **Smart Connectors**: Line tools that "stretch" and morph between shapes as they move.
- **Vector Shapes**: Custom SVG paths with real-time coordinate interpolation.
- **Rich Text Formatting**: Support for bold, italics, and native **Bulleted/Numbered lists**.

### 🎥 High-Fidelity Export
Capture your transitions in professional quality:
- **Multi-Format Support**: Export as **MP4**, **WebM**, **GIF**, or **PDF**.
- **Deterministic Capture**: The export engine uses a virtual clock to ensure every frame of your Magic Move transition is captured with zero dropped frames.

###  Prototype Mode
Map out your presentation flow using a visual, node-based transition editor powered by `@xyflow/react`. Define how slides connect and which triggers (click, auto, timer) drive the story.

<img width="1919" height="897" alt="capture_20260419_021753" src="https://github.com/user-attachments/assets/9789097d-60cc-4c7d-aa21-bfc16a62b7a5" />

---

## 🤖 AI Designer

MotionSlides includes a specialized AI pipeline for rapid technical deck creation:
- **README to Slides**: Paste any Markdown content. The AI extracts key themes, code blocks, and diagrams to build a complete deck.
- **Architecture Walkthrough**: Describe your system (e.g., "A serverless API with Lambda and S3"). The AI generates professional diagrams.
- **RAG Icon Injection**: Contextually aware icon selection from a library of **800+ AWS and GCP assets**.

---

## ⌨️ Shortcuts & Hotkeys

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

## 📖 How-To Guide

### Grouping Elements
Managing complex diagrams is easy with grouping:
1. **Multi-Select**: Click and drag on the canvas to lasso elements, or hold `Shift` while clicking.
2. **Group**: Press `Cmd/Ctrl + G`. A dashed bounding box will appear.
3. **Transform**: Dragging or scaling the group handles will affect all children proportionally.
4. **Ungroup**: Press `Cmd/Ctrl + Shift + G` to break the group back into individual elements.

### Mastering Magic Move
To create a "Magic Move" transition:
1. Create an element/elements on Slide 1.
2. duplicate slide 1 using the shiny icon next to slide thumbnail /Copy and paste that element into Slide 2.
3. Modify its properties on Slide 2 (change position, size, color, or rotation).
4. MotionSlides will automatically detect the identical IDs and smoothly animate the transition between states.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + SSR)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) (Layout Projection & Springs)
- **AI Engine**: Vercel AI SDK (OpenAI / Claude)
- **Code Highlighting**: [Shiki](https://shiki.style/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Diagramming**: [@xyflow/react](https://reactflow.dev/)

---

## 📂 Project Structure

- **`apps/web`**: Main React application, editor UI, and TanStack Start server handlers.
- **`apps/export-server`**: Dedicated Node.js service for headless Puppeteer + FFmpeg rendering.
- **`packages/shared`**: Centralized Scene Graph definitions and TypeScript types.
- **`scripts/`**: Tools for asset manifest generation and RAG indexing.

---

## 💻 Developer's Guide (Backend)

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

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- npm / pnpm / yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Chifez/motion-slides.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (starts both web and export server):
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧠 Architecture: How it Works

1. **Match**: The `motionEngine` compares Slide A and Slide B to find elements with matching IDs or matching heuristics.
2. **Diff**: It identifies which elements are *Continuing*, *Added*, or *Removed*.
3. **Measure**: The browser records the "Final" layout of all elements.
4. **Invert**: The engine calculates the delta from the "Initial" layout.
5. **Animate**: Framer Motion projects the elements back to their initial state and animates the deltas using spring physics.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built for the creative developer community.
