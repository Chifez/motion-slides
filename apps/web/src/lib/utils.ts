import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const ALLOWED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.webm',
  '.aac',
  '.opus',
  '.flac',
  '.mp4',
]

export function isValidAudioFile(file: File): boolean {
  const mime = file.type.toLowerCase()
  const nameLower = file.name.toLowerCase()
  return (
    mime.startsWith('audio/') ||
    mime.startsWith('video/webm') ||
    ALLOWED_AUDIO_EXTENSIONS.some(ext => nameLower.endsWith(ext))
  )
}
