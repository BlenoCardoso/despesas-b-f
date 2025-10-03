import React from 'react'
import { Outlet } from 'react-router-dom'

export function SimpleLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4">
        <Outlet />
      </div>
    </div>
  )
}