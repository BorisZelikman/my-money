export const APP_LANGUAGES = ['en', 'ru', 'de', 'he'] as const

export type AppLanguage = (typeof APP_LANGUAGES)[number]

export const APP_LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  de: 'Deutsch',
  he: 'עברית',
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && APP_LANGUAGES.includes(value as AppLanguage)
}
