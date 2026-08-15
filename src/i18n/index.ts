import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { isAppLanguage, type AppLanguage } from '@/types'
import { resources } from './resources'

const STORAGE_KEY = 'mymoney-language'

function getInitialLanguage(): AppLanguage {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isAppLanguage(stored)) return stored

  const browserLanguage = navigator.language.split('-')[0]
  return isAppLanguage(browserLanguage) ? browserLanguage : 'en'
}

export function applyDocumentLanguage(language: string) {
  const appLanguage: AppLanguage = isAppLanguage(language) ? language : 'en'
  document.documentElement.lang = appLanguage
  document.documentElement.dir = appLanguage === 'he' ? 'rtl' : 'ltr'
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'de', 'he'],
    interpolation: { escapeValue: false },
    returnNull: false,
  })

applyDocumentLanguage(i18n.resolvedLanguage || i18n.language)
i18n.on('languageChanged', (language) => {
  if (isAppLanguage(language)) localStorage.setItem(STORAGE_KEY, language)
  applyDocumentLanguage(language)
})

export default i18n
