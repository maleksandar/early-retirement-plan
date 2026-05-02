import enRaw from './en.json'
import srRaw from './sr.json'

export type Lang = 'sr' | 'en'
export type Dict = typeof srRaw

const dicts: Record<Lang, Dict> = {
  sr: srRaw,
  en: enRaw as Dict,
}

function getStringAtPath(root: unknown, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = root
  for (const p of parts) {
    if (cur !== null && typeof cur === 'object' && p in cur) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return undefined
    }
  }
  return typeof cur === 'string' ? cur : undefined
}

/** Dot-separated path into {@link Dict}, e.g. `app.title`, `form.age.label`. */
export type TranslationPath = string

export function tr(lang: Lang, path: TranslationPath): string {
  return (
    getStringAtPath(dicts[lang], path) ??
    getStringAtPath(dicts.sr, path) ??
    path
  )
}

/** Replaces `{key}` placeholders in the translated string. */
export function trParams(lang: Lang, path: TranslationPath, params: Record<string, string | number>): string {
  let s = tr(lang, path)
  for (const [k, v] of Object.entries(params)) {
    s = s.replaceAll(`{${k}}`, String(v))
  }
  return s
}
