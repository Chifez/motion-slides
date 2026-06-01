import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function isValidAudioFile(file: File): boolean {
  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg']
  const nameLower = file.name.toLowerCase()
  return (
    file.type.startsWith('audio/') ||
    allowedExtensions.some(ext => nameLower.endsWith(ext))
  )
}