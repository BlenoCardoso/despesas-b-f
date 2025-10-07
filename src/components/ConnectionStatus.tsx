import React from 'react'

interface ConnectionStatusProps {
  connected: boolean
  titleOnline?: string
  titleOffline?: string
}

/**
 * Badge compacto de status de conexão.
 * - Animação de pulso quando online
 * - Cores acessíveis e contraste adequado
 * - Aria-live para leitores de tela
 */
export function ConnectionStatus({ connected, titleOnline = 'Conectado em tempo real', titleOffline = 'Sem conexão em tempo real' }: ConnectionStatusProps) {
  return (
    <div
      className={[
        'group relative flex items-center gap-1 pl-1 pr-2 h-6 rounded-full text-[11px] font-medium select-none',
        'shadow-sm ring-1 ring-inset',
        connected
          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white ring-emerald-400/60'
          : 'bg-gray-200 text-gray-600 ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600'
      ].join(' ')}
      aria-live="polite"
      title={connected ? titleOnline : titleOffline}
      role="status"
    >
      <span className="relative flex h-3 w-3">
        {connected ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white shadow-inner" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        )}
      </span>
      <span className="tracking-tight">
        {connected ? 'Online' : 'Offline'}
      </span>
      {/* Tooltip custom (fallback ao title) */}
      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition rounded-md bg-gray-900 text-white px-2 py-1 text-[10px] shadow-lg whitespace-nowrap">
        {connected ? titleOnline : titleOffline}
      </span>
    </div>
  )
}
