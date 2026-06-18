import { useState, useCallback, useEffect } from 'react'
import type { Lang } from '../lib/i18n'
import { t } from '../lib/i18n'

const LANG_KEY = 'esc_lang'

export function useI18n() {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem(LANG_KEY) as Lang) ?? 'fr'
  })

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem(LANG_KEY, lang)
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])

  const tr = useCallback((section: string, key: string) => t(lang, section, key), [lang])

  return { lang, setLang, tr }
}
