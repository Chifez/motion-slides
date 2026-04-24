/**
 * FfmpegEncoder.ts
 *
 * Wraps FFmpeg to encode a stream of JPEG frame buffers into MP4, WebM,
 * GIF, or PDF. Frames are written to FFmpeg's stdin pipe.
 *
 * PDF is a special case — it does not use FFmpeg at all. Instead it
 * accumulates one PNG per slide and uses pdfkit to build the PDF.
 */

import { spawn, ChildProcess } from 'child_process'
import fs   from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FfmpegEncoderOptions {
  outputPath: string
  format:     string
  fps:        number
  width:      number
  height:     number
}

// ─── FfmpegEncoder ────────────────────────────────────────────────────────────

export class FfmpegEncoder {
  private opts:    FfmpegEncoderOptions
  private proc:    ChildProcess | null = null
  private frames:  Buffer[] = []   // used only for PDF accumulation

  constructor(opts: FfmpegEncoderOptions) {
    this.opts = opts
  }

  async start(): Promise<void> {
    if (this.opts.format === 'pdf') return   // PDF does not use FFmpeg

    const args = this.buildFfmpegArgs()

    this.proc = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] })

    this.proc.stdout?.on('data', () => {})   // drain stdout
    this.proc.stderr?.on('data', (d: Buffer) => {
      // Uncomment for debugging:
      // process.stderr.write(d)
    })

    this.proc.on('error', (err) => {
      throw new Error(`FFmpeg process error: ${err.message}`)
    })
  }

  writeFrame(buffer: Buffer): void {
    if (this.opts.format === 'pdf') {
      this.frames.push(buffer)   // accumulate for PDF
      return
    }
    if (!this.proc?.stdin?.writable) return
    this.proc.stdin.write(buffer)
  }

  async finalize(): Promise<void> {
    if (this.opts.format === 'pdf') {
      await this.finalizePdf()
      return
    }

    return new Promise<void>((resolve, reject) => {
      if (!this.proc) return resolve()

      this.proc.stdin?.end()

      this.proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`))
        }
      })
    })
  }

  // ── FFmpeg argument builders ───────────────────────────────────────────────

  private buildFfmpegArgs(): string[] {
    switch (this.opts.format) {
      case 'mp4':  return this.mp4Args()
      case 'webm': return this.webmArgs()
      case 'gif':  return this.gifArgs()
      default:     return this.mp4Args()
    }
  }

  private mp4Args(): string[] {
    return [
      '-f',        'image2pipe',    // input is a raw image pipe
      '-framerate', String(this.opts.fps),
      '-i',        'pipe:0',        // read frames from stdin
      '-c:v',      'libx264',       // H.264 codec
      '-preset',   'medium',        // encoding speed/quality balance
      '-crf',      '18',            // near-lossless quality (0=lossless, 51=worst)
      '-pix_fmt',  'yuv420p',       // REQUIRED for QuickTime and iOS compatibility
      '-movflags', '+faststart',    // moov atom at front for streaming
      '-y',                         // overwrite output file without asking
      this.opts.outputPath,
    ]
  }

  private webmArgs(): string[] {
    return [
      '-f',        'image2pipe',
      '-framerate', String(this.opts.fps),
      '-i',        'pipe:0',
      '-c:v',      'libvpx-vp9',
      '-crf',      '30',
      '-b:v',      '0',             // CRF mode for VP9 requires b:v 0
      '-pix_fmt',  'yuva420p',
      '-y',
      this.opts.outputPath,
    ]
  }

  private gifArgs(): string[] {
    // Two-pass palette approach for best GIF quality
    // Pass 1 generates a palette, pass 2 uses it
    // Since we pipe stdin we use the single-pass palettegen+paletteuse filter
    const scale = `${this.opts.width / 2}:-1`   // GIF at 50% resolution
    return [
      '-f',        'image2pipe',
      '-framerate', '15',           // GIF at 15fps max
      '-i',        'pipe:0',
      '-vf',       `fps=15,scale=${scale}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer`,
      '-loop',     '0',             // infinite loop
      '-y',
      this.opts.outputPath,
    ]
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  /**
   * Build a PDF from accumulated frame buffers.
   * One frame per slide — we use the first frame captured per slide.
   * Requires `pdfkit` and `sharp` packages.
   *
   * Install: npm install pdfkit sharp @types/pdfkit
   */
  private async finalizePdf(): Promise<void> {
    // Dynamic import so pdfkit is only loaded when needed
    const PDFDocument = (await import('pdfkit')).default
    const sharp       = (await import('sharp')).default

    const doc = new PDFDocument({
      autoFirstPage: false,
      size:          [this.opts.width, this.opts.height],
    })

    const writeStream = fs.createWriteStream(this.opts.outputPath)
    doc.pipe(writeStream)

    for (const frame of this.frames) {
      // Convert JPEG buffer to PNG for pdfkit embedding
      const png = await sharp(frame).png().toBuffer()
      doc.addPage({ size: [this.opts.width, this.opts.height] })
      doc.image(png, 0, 0, { width: this.opts.width, height: this.opts.height })
    }

    doc.end()

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
  }
}
