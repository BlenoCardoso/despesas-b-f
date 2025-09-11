import React, { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { useUnreadCount, useNotificationPolling } from '../hooks/useNotifications'
import { NotificationCenter } from './NotificationCenter'

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = useUnreadCount()
  
  // Enable real-time notification polling
  useNotificationPolling()

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
        title={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={handleClose} 
      />
    </>
  )
}

