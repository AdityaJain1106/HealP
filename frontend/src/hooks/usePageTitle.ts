import { useEffect } from 'react'

/**
 * Sets the browser tab title for a page.
 * - Pass a non-empty string → "Page Name | HealP"
 * - Pass an empty string   → "HealP — AI Digital Health Record"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title
    document.title = title
      ? `${title} | HealP`
      : 'HealP - AI Digital Health Record'
    return () => {
      document.title = prev
    }
  }, [title])
}

