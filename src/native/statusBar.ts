import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

/**
 * Configure native status bar to avoid WebView content being drawn under it
 * and ensure good contrast for icons.
 * - Disables overlay so the WebView is laid out below the status bar
 * - Sets a consistent background color and icon style
 */
export async function configureStatusBar() {
  if (!Capacitor.isNativePlatform()) return

  try {
    // Make sure WebView is not drawn under the status bar
    await StatusBar.setOverlaysWebView({ overlay: false })

    // Pick a solid background that matches the app theme
    await StatusBar.setBackgroundColor({ color: '#2563eb' })
    // Use light icons on the dark(ish) blue background
    await StatusBar.setStyle({ style: Style.Light })
  } catch (err) {
    // Non-fatal: if plugin not available or fails, just continue
    console.warn('[StatusBar] configuration skipped:', err)
  }
}

/**
 * Sync status bar style/color with current theme (light/dark) and update
 * the meta theme-color for web/PWA.
 */
export function startStatusBarThemeSync() {
  if (typeof document === 'undefined') return

  const apply = async () => {
    const isDark = document.documentElement.classList.contains('dark')
    const lightBg = '#ffffff'
    const darkBg = '#111827' // gray-900
    const nativeBg = isDark ? darkBg : '#2563eb' // keep brand blue in light

    try {
      if (Capacitor.isNativePlatform()) {
        await StatusBar.setBackgroundColor({ color: nativeBg })
        await StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark })
      }
    } catch (err) {
      console.warn('[StatusBar] theme sync skipped:', err)
    }

    // Update <meta name="theme-color"> for browsers/PWA
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (meta) meta.content = isDark ? darkBg : '#2563eb'
  }

  // Initial apply
  apply()

  // Watch for class changes on <html> (next-themes toggles 'dark' class)
  const obs = new MutationObserver(() => apply())
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  // Expose a stop method if needed later
  ;(window as any).__statusBarThemeObserver = obs
}
