import { extendTheme } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

const cardReveal = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const contentFade = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

export const theme = extendTheme({
  fonts: {
    heading: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", Meiryo, sans-serif',
    body: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", Meiryo, sans-serif',
  },
  styles: {
    global: {
      ':root': {
        colorScheme: 'light',
        '--bg': 'rgb(241 245 249)',
        '--text': 'rgb(15 23 42)',
        '--muted': 'rgb(100 116 139)',
        '--edge': 'rgb(148 163 184)',
        '--glass-bg': 'rgb(255 255 255 / 64%)',
        '--glass-border': 'rgb(255 255 255 / 36%)',
        '--glass-shadow': '0 20px 48px rgba(15, 23, 42, 0.16)',
        '--accent-glow': 'rgb(14 165 233)',
        '--transition-soft': '240ms cubic-bezier(0.22, 1, 0.36, 1)',
        '--transition-fast': '160ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '*': {
        boxSizing: 'border-box',
      },
      'html, body, #root': {
        height: '100%',
      },
      body: {
        margin: 0,
        background: 'var(--bg)',
        color: 'var(--text)',
        overflow: 'hidden',
        fontFamily: 'inherit',
      },
      '#network': {
        position: 'fixed',
        inset: 0,
        width: '100dvw',
        height: '100dvh',
        background: 'var(--bg)',
      },
      '.overlay': {
        position: 'fixed',
        zIndex: 40,
        pointerEvents: 'auto',
      },
      '.hud-card': {
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(18px) saturate(165%)',
        WebkitBackdropFilter: 'blur(18px) saturate(165%)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        borderRadius: '16px',
        animation: `${cardReveal} 0.7s var(--transition-soft) both`,
        transition: 'transform var(--transition-soft), box-shadow var(--transition-soft)',
      },
      '.hud-card:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 26px 60px rgba(15, 23, 42, 0.14)',
      },
      '#hudTopLeft': {
        top: '16px',
        left: '16px',
        padding: '16px 18px',
        display: 'grid',
        gap: '14px',
        maxWidth: 'min(92vw, 560px)',
      },
      '#hudTopLeft h1': {
        margin: 0,
        fontSize: 'clamp(18px, 2.6vw, 22px)',
        letterSpacing: '0.02em',
      },
      '.file-upload-area': {
        textAlign: 'center',
        padding: '20px',
      },
      '.file-upload-area p': {
        margin: '0 0 10px 0',
        color: 'var(--muted)',
      },
      '.file-label': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6em',
        fontWeight: 600,
        padding: '12px 18px',
        borderRadius: '12px',
        border: '2px dashed var(--edge)',
        background: 'rgba(255, 255, 255, 0.88)',
        cursor: 'pointer',
        width: 'max-content',
        transition:
          'border-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
      },
      '.file-label:hover': {
        borderColor: 'var(--accent-glow)',
        color: 'var(--accent-glow)',
        transform: 'translateY(-1px)',
        boxShadow: '0 16px 30px rgba(14, 165, 233, 0.18)',
      },
      '.file-label input': {
        display: 'none',
      },
      '#date-controls': {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      },
      '.date-nav-btn': {
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '9999px',
        width: '38px',
        height: '38px',
        fontSize: '18px',
        cursor: 'pointer',
        transition: 'background-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)',
      },
      '.date-nav-btn:hover:not(:disabled)': {
        background: 'rgba(255, 255, 255, 0.94)',
        boxShadow: '0 10px 22px rgba(14, 165, 233, 0.12)',
        transform: 'translateY(-1px)',
      },
      '.date-nav-btn:disabled': {
        opacity: 0.45,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
      '#current-date-display': {
        fontSize: '18px',
        fontWeight: 600,
        padding: '6px 14px',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.72)',
        border: '1px solid var(--glass-border)',
        fontVariantNumeric: 'tabular-nums',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      },
      '#hudBottomLeft': {
        left: '16px',
        bottom: '16px',
        padding: '12px 14px',
        width: 'min(92vw, 520px)',
        display: 'none',
      },
      '#infoBox h2': {
        margin: '0 0 6px 0',
        fontSize: '14px',
        color: 'var(--muted)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      },
      '#details': {
        margin: '0.25rem 0 0 1em',
        padding: 0,
        fontSize: '14px',
        lineHeight: 1.55,
      },
      '.muted': {
        color: 'var(--muted)',
      },
      '.btn-primary': {
        background: 'linear-gradient(135deg, rgba(14,165,233,0.9), rgba(59,130,246,0.9))',
        color: '#fff',
        border: 'none',
        borderRadius: '14px',
        padding: '12px 20px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        boxShadow: '0 12px 30px rgba(14, 165, 233, 0.3)',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
      },
      '.btn-primary:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 18px 40px rgba(14, 165, 233, 0.4)',
      },
      '.choice-grid': {
        display: 'grid',
        gap: '12px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        marginTop: '20px',
      },
      '.choice-button': {
        padding: '12px 14px',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        background: 'rgba(255,255,255,0.92)',
        cursor: 'pointer',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
        textAlign: 'left',
      },
      '.choice-button:hover:not(:disabled)': {
        transform: 'translateY(-1px)',
        borderColor: 'var(--accent-glow)',
        boxShadow: '0 12px 26px rgba(14, 165, 233, 0.18)',
      },
      '.choice-button.correct': {
        borderColor: '#22c55e',
        background: 'rgba(34, 197, 94, 0.12)',
        color: '#14532d',
      },
      '.choice-button.incorrect': {
        borderColor: '#f43f5e',
        background: 'rgba(244, 63, 94, 0.12)',
        color: '#881337',
      },
      '.modal': {
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity var(--transition-soft), visibility 0s linear 0.3s',
      },
      '.modal.visible': {
        opacity: 1,
        visibility: 'visible',
        transitionDelay: '0s',
      },
      '.backdrop': {
        position: 'absolute',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
      },
      '.dialog': {
        position: 'relative',
        background: '#fff',
        borderRadius: '18px',
        padding: '26px',
        width: 'min(92vw, 720px)',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: `${contentFade} 0.45s ease`,
      },
      '.dialog header': {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
      },
      '.dialog h2': {
        margin: 0,
      },
      '.dialog .close': {
        border: 'none',
        background: 'transparent',
        fontSize: '20px',
        cursor: 'pointer',
      },
      '.dialog-content': {
        animation: `${contentFade} 0.45s ease`,
      },
      '.answer-box': {
        marginTop: '16px',
        padding: '14px 16px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.05)',
        fontWeight: 600,
      },
      '.result-animation': {
        textAlign: 'center',
        padding: '24px 10px',
        animation: `${contentFade} 0.5s ease`,
      },
      '.copyright-notice': {
        bottom: '16px',
        right: '22px',
        padding: '8px 16px',
        borderRadius: '999px',
        fontSize: '13px',
        background: 'rgba(255,255,255,0.3)',
        border: '1px solid rgba(255,255,255,0.4)',
        boxShadow: 'var(--glass-shadow)',
      },
      '@media (max-width: 720px)': {
        '#hudTopLeft': {
          maxWidth: 'min(96vw, 480px)',
          padding: '14px 16px',
        },
        '#hudBottomLeft': {
          width: 'min(96vw, 480px)',
        },
        '.dialog': {
          padding: '18px',
        },
      },
    },
  },
})

export type ThemeType = typeof theme
