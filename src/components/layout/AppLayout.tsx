"use client"

import React from "react"
import { useUser } from '@clerk/nextjs'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  const { isLoaded } = useUser()

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {children}
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
