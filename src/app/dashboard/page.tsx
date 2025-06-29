"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new analysis page
    router.replace('/analysis')
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Redirecting to Analysis...</div>
    </div>
  )
}
