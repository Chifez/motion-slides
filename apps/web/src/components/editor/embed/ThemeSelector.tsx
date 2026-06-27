interface ThemeSelectorProps {
  theme: 'dark' | 'light'
  onChange: (theme: 'dark' | 'light') => void
}

export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-(--ms-text-secondary) font-medium">Player Theme</label>
      <div className="grid grid-cols-2 gap-2 bg-(--ms-bg-base) p-1 rounded-lg border border-(--ms-border)">
        <button
          onClick={() => onChange('dark')}
          className={`py-1.5 text-xs font-semibold rounded-md border-none cursor-pointer transition-all ${
            theme === 'dark'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-secondary)'
          }`}
        >
          Dark Theme
        </button>
        <button
          onClick={() => onChange('light')}
          className={`py-1.5 text-xs font-semibold rounded-md border-none cursor-pointer transition-all ${
            theme === 'light'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-transparent text-(--ms-text-muted) hover:text-(--ms-text-secondary)'
          }`}
        >
          Light Theme
        </button>
      </div>
    </div>
  )
}
