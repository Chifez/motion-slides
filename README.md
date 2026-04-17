# 🎬 MotionSlides

**MotionSlides** is a high-fidelity, web-based presentation engine designed to bring Apple Keynote-level "Magic Move" transitions and developer-centric features to the browser.

Built for presenters who demand fluid, physics-based animations and seamless code-block transitions, MotionSlides treats every slide as a scene state, automatically calculating the most elegant way to move, morph, and build elements.

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

###  Prototype Mode
Map out your presentation flow using a visual, node-based transition editor powered by `@xyflow/react`. Define how slides connect and which triggers (click, auto, timer) drive the story.

---

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + SSR)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) (Layout Projection & Springs)
- **Code Highlighting**: [Shiki](https://shiki.style/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Diagramming**: [@xyflow/react](https://reactflow.dev/)

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

3. Start the development server:
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
