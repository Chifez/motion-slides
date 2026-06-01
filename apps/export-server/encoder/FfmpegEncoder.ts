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
import crypto from 'crypto'
import type { ExportProject, SlideAudio } from '@motionslides/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FfmpegEncoderOptions {
  outputPath: string
  format:     string
  fps:        number
  width:      number
  height:     number
  sceneGraph?: ExportProject
}

export interface AudioTrackInfo {
  url: string
  trimStart: number
  trimEnd: number
  volume: number
  loop: boolean
  playbackRate: number
  startTime: number // when it starts in the final video timeline (seconds)
  duration: number  // active duration
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function computeAudioTimeline(sceneGraph: ExportProject, fps: number): {
  slideAudioTracks: AudioTrackInfo[]
  bgMusicTrack: AudioTrackInfo | null
  totalDuration: number
} {
  const { project, playbackSettings } = sceneGraph
  const totalSlides = project.slides.length
  const FRAME_MS = 1000 / fps
  const ENTRANCE_FRAMES = 10

  let currentTimelineTime = 0
  const slideAudioTracks: AudioTrackInfo[] = []

  for (let i = 0; i < totalSlides; i++) {
    const slide = project.slides[i]
    const hasTransition = i > 0
    const transitionDuration = hasTransition ? (playbackSettings.transitionDuration ?? 500) : 0
    
    // Autoplay delay with Math.max rule
    const activeAudioDurationMs = slide?.audio
      ? ((slide.audio.trimEnd - slide.audio.trimStart) / slide.audio.playbackRate) * 1000
      : 0
    const autoplayDelay = Math.max(playbackSettings.autoplayDelay ?? 3000, activeAudioDurationMs)

    // Calculate number of frames for transition + entrance + hold
    const transitionFrames = hasTransition ? Math.ceil(transitionDuration / FRAME_MS) : 0
    const entranceFrames = ENTRANCE_FRAMES
    const remainingHoldMs = autoplayDelay - (entranceFrames * FRAME_MS)
    const holdFrames = Math.max(0, Math.ceil(remainingHoldMs / FRAME_MS))

    const totalSlideFrames = transitionFrames + entranceFrames + holdFrames
    const slideDurationSec = totalSlideFrames / fps

    if (slide?.audio) {
      // Voiceover starts playing after the transition duration
      const startTime = currentTimelineTime + (transitionDuration / 1000)
      const duration = (slide.audio.trimEnd - slide.audio.trimStart) / slide.audio.playbackRate
      
      slideAudioTracks.push({
        url: slide.audio.url,
        trimStart: slide.audio.trimStart,
        trimEnd: slide.audio.trimEnd,
        volume: slide.audio.volume,
        loop: slide.audio.loop,
        playbackRate: slide.audio.playbackRate,
        startTime,
        duration,
      })
    }

    currentTimelineTime += slideDurationSec
  }

  let bgMusicTrack: AudioTrackInfo | null = null
  if (playbackSettings.backgroundMusic) {
    const bgm = playbackSettings.backgroundMusic
    bgMusicTrack = {
      url: bgm.url,
      trimStart: bgm.trimStart,
      trimEnd: bgm.trimEnd,
      volume: bgm.volume,
      loop: bgm.loop,
      playbackRate: bgm.playbackRate,
      startTime: 0,
      duration: currentTimelineTime, // stretch to the whole video duration
    }
  }

  return {
    slideAudioTracks,
    bgMusicTrack,
    totalDuration: currentTimelineTime,
  }
}

// ─── FfmpegEncoder ────────────────────────────────────────────────────────────

export class FfmpegEncoder {
  private opts:    FfmpegEncoderOptions
  private proc:    ChildProcess | null = null
  private frames:  Buffer[] = []   // used only for PDF accumulation
  
  // Track downloaded audio files for cleanup
  private tempAudioDir: string | null = null
  private localAudioFiles: string[] = []

  constructor(opts: FfmpegEncoderOptions) {
    this.opts = opts
  }

  private async downloadFile(url: string, destPath: string): Promise<void> {
    const absoluteUrl = url.startsWith('http') 
      ? url 
      : `${process.env.FRONTEND_URL || 'http://localhost:3000'}${url}`

    const res = await fetch(absoluteUrl)
    if (!res.ok) {
      throw new Error(`Failed to download audio track from ${absoluteUrl}: ${res.statusText}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    await fs.promises.writeFile(destPath, buffer)
  }

  async start(): Promise<void> {
    if (this.opts.format === 'pdf') return   // PDF does not use FFmpeg

    let audioInputs: string[] = []
    let filterComplex: string | undefined = undefined

    // Download audio files and build filter complex if we have audio tracks and are outputting video
    if (this.opts.sceneGraph && (this.opts.format === 'mp4' || this.opts.format === 'webm')) {
      const { slideAudioTracks, bgMusicTrack } = computeAudioTimeline(this.opts.sceneGraph, this.opts.fps)
      
      const hasSlideAudio = slideAudioTracks.length > 0
      const hasBgMusic = bgMusicTrack !== null

      if (hasSlideAudio || hasBgMusic) {
        // Create unique subfolder
        this.tempAudioDir = path.join(process.cwd(), 'apps', 'export-server', 'temp_audio', crypto.randomUUID())
        fs.mkdirSync(this.tempAudioDir, { recursive: true })

        try {
          let inputIndex = 1 // 0 is image pipe
          const localSlideTracks = []

          // Download slide voiceovers
          for (const track of slideAudioTracks) {
            const ext = path.extname(track.url.split('?')[0]) || '.mp3'
            const localPath = path.join(this.tempAudioDir, `slide-${inputIndex}${ext}`)
            await this.downloadFile(track.url, localPath)
            this.localAudioFiles.push(localPath)

            audioInputs.push('-i', localPath)
            localSlideTracks.push({
              ...track,
              inputIndex,
            })
            inputIndex++
          }

          // Download background music
          let localBgMusicTrack = null
          if (bgMusicTrack) {
            const ext = path.extname(bgMusicTrack.url.split('?')[0]) || '.mp3'
            const localPath = path.join(this.tempAudioDir, `bgm-${inputIndex}${ext}`)
            await this.downloadFile(bgMusicTrack.url, localPath)
            this.localAudioFiles.push(localPath)

            if (bgMusicTrack.loop) {
              audioInputs.push('-stream_loop', '-1')
            }
            audioInputs.push('-i', localPath)
            
            localBgMusicTrack = {
              ...bgMusicTrack,
              inputIndex,
            }
            inputIndex++
          }

          // Build filter graph
          const filterParts: string[] = []

          // 1. Process Slide Audio voiceovers
          if (localSlideTracks.length > 0) {
            for (const track of localSlideTracks) {
              const delayMs = Math.round(track.startTime * 1000)
              
              let filter = `[${track.inputIndex}:a]atrim=start=${track.trimStart}:end=${track.trimEnd},asetpts=PTS-STARTPTS`
              
              if (track.playbackRate !== 1) {
                filter += `,atempo=${track.playbackRate}`
              }
              
              filter += `,volume=${track.volume}`
              filter += `[trimmed_${track.inputIndex}]`
              filterParts.push(filter)

              // Apply delay (stereo format)
              filterParts.push(`[trimmed_${track.inputIndex}]adelay=${delayMs}|${delayMs}[delayed_${track.inputIndex}]`)
            }

            // Mix slide voiceovers
            const voiceoverInputs = localSlideTracks.map(t => `[delayed_${t.inputIndex}]`).join('')
            if (localSlideTracks.length > 1) {
              filterParts.push(`${voiceoverInputs}amix=inputs=${localSlideTracks.length}:normalize=0[mixed_voiceover]`)
            } else {
              filterParts.push(`[delayed_${localSlideTracks[0].inputIndex}]anull[mixed_voiceover]`)
            }
          }

          // 2. Process Background Music
          if (localBgMusicTrack) {
            const track = localBgMusicTrack
            let filter = `[${track.inputIndex}:a]atrim=start=${track.trimStart}:end=${track.trimEnd},asetpts=PTS-STARTPTS`
            
            if (track.playbackRate !== 1) {
              filter += `,atempo=${track.playbackRate}`
            }

            // Ducking volume envelope
            const duckMusic = this.opts.sceneGraph.playbackSettings?.duckBackgroundMusic !== false
            if (duckMusic && localSlideTracks.length > 0) {
              const ranges = localSlideTracks.map(t => `between(t,${t.startTime},${t.startTime + t.duration})`).join('+')
              filter += `,volume=eval=frame:volume='${track.volume} * if(${ranges},0.2,1.0)'`
            } else {
              filter += `,volume=${track.volume}`
            }
            
            filter += `[ducked_bgm]`
            filterParts.push(filter)
          }

          // 3. Mix voiceover and background music
          if (localSlideTracks.length > 0 && localBgMusicTrack) {
            filterParts.push(`[mixed_voiceover][ducked_bgm]amix=inputs=2:normalize=0[out_audio]`)
          } else if (localSlideTracks.length > 0) {
            filterParts.push(`[mixed_voiceover]anull[out_audio]`)
          } else if (localBgMusicTrack) {
            filterParts.push(`[ducked_bgm]anull[out_audio]`)
          }

          filterComplex = filterParts.join(';')
        } catch (err) {
          console.error('[FfmpegEncoder] Failed preparing audio tracks:', err)
          // Fallback to video-only export on error
          audioInputs = []
          filterComplex = undefined
          await this.cleanupTempAudio()
        }
      }
    }

    const args = this.buildFfmpegArgs(audioInputs, filterComplex)

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

    try {
      await new Promise<void>((resolve, reject) => {
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
    } finally {
      await this.cleanupTempAudio()
    }
  }

  private async cleanupTempAudio(): Promise<void> {
    if (this.tempAudioDir) {
      try {
        for (const file of this.localAudioFiles) {
          if (fs.existsSync(file)) {
            await fs.promises.unlink(file)
          }
        }
        if (fs.existsSync(this.tempAudioDir)) {
          await fs.promises.rmdir(this.tempAudioDir)
        }
      } catch (err) {
        console.error('[FfmpegEncoder] Cleanup of temp audio failed:', err)
      } finally {
        this.tempAudioDir = null
        this.localAudioFiles = []
      }
    }
  }

  // ── FFmpeg argument builders ───────────────────────────────────────────────

  private buildFfmpegArgs(audioInputs: string[], filterComplex?: string): string[] {
    switch (this.opts.format) {
      case 'mp4':  return this.mp4Args(audioInputs, filterComplex)
      case 'webm': return this.webmArgs(audioInputs, filterComplex)
      case 'gif':  return this.gifArgs()
      default:     return this.mp4Args(audioInputs, filterComplex)
    }
  }

  private mp4Args(audioInputs: string[], filterComplex?: string): string[] {
    const args = [
      '-f',        'image2pipe',    // input is a raw image pipe
      '-framerate', String(this.opts.fps),
      '-i',        'pipe:0',        // read frames from stdin
    ]

    args.push(...audioInputs)

    if (filterComplex) {
      args.push(
        '-filter_complex', filterComplex,
        '-map',            '0:v',
        '-map',            '[out_audio]',
        '-c:v',            'libx264',
        '-preset',         'medium',
        '-crf',            '18',
        '-pix_fmt',        'yuv420p',
        '-c:a',            'aac',
        '-b:a',            '192k',
        '-movflags',       '+faststart',
        '-shortest',
        '-y',
        this.opts.outputPath,
      )
    } else {
      args.push(
        '-c:v',      'libx264',       // H.264 codec
        '-preset',   'medium',        // encoding speed/quality balance
        '-crf',      '18',            // near-lossless quality (0=lossless, 51=worst)
        '-pix_fmt',  'yuv420p',       // REQUIRED for QuickTime and iOS compatibility
        '-movflags', '+faststart',    // moov atom at front for streaming
        '-y',                         // overwrite output file without asking
        this.opts.outputPath,
      )
    }

    return args
  }

  private webmArgs(audioInputs: string[], filterComplex?: string): string[] {
    const args = [
      '-f',        'image2pipe',
      '-framerate', String(this.opts.fps),
      '-i',        'pipe:0',
    ]

    args.push(...audioInputs)

    if (filterComplex) {
      args.push(
        '-filter_complex', filterComplex,
        '-map',            '0:v',
        '-map',            '[out_audio]',
        '-c:v',            'libvpx-vp9',
        '-crf',            '30',
        '-b:v',            '0',
        '-pix_fmt',        'yuva420p',
        '-c:a',            'libopus',
        '-b:a',            '128k',
        '-shortest',
        '-y',
        this.opts.outputPath,
      )
    } else {
      args.push(
        '-f',        'image2pipe',
        '-framerate', String(this.opts.fps),
        '-i',        'pipe:0',
        '-c:v',      'libvpx-vp9',
        '-crf',      '30',
        '-b:v',      '0',             // CRF mode for VP9 requires b:v 0
        '-pix_fmt',  'yuva420p',
        '-y',
        this.opts.outputPath,
      )
    }

    return args
  }

  private gifArgs(): string[] {
    // Two-pass palette approach for best GIF quality
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

  private async finalizePdf(): Promise<void> {
    const PDFDocument = (await import('pdfkit')).default
    const sharp       = (await import('sharp')).default

    const doc = new PDFDocument({
      autoFirstPage: false,
      size:          [this.opts.width, this.opts.height],
    })

    const writeStream = fs.createWriteStream(this.opts.outputPath)
    doc.pipe(writeStream)

    for (const frame of this.frames) {
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
