"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { FileUpload } from "@/components/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CheckSquare, ArrowRight, Database, TrendingUp, Activity, BarChart3, Zap } from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { motion } from "motion/react"
import Image from "next/image"
import { SignInButton } from "@clerk/nextjs"

export default function Home() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [uploadedFiles, setUploadedFiles] = React.useState<{
    clients?: File
    workers?: File
    tasks?: File
  }>({})

  // Redirect authenticated users to the main dashboard
  React.useEffect(() => {
    if (isLoaded && user) {
      router.push('/data')
    }
  }, [isLoaded, user, router])

  const handleFileSelect = (fileType: 'clients' | 'workers' | 'tasks') => (file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file || undefined
    }))
  }

  const canProceed = Object.values(uploadedFiles).filter(Boolean).length > 0

  const handleGetStarted = () => {
    if (user) {
      router.push('/data')
    } else {
      // For anonymous users, show sign-in
      router.push('/sign-in')
    }
  }

  return (
    <AppLayout showSidebar={false}>
      <div className="flex justify-end px-8 pt-4 gap-4">
        <SignInButton />
      </div>
      <div className="MIN-H-FULL relative flex items-center justify-center p-8">
        {/* Main Content Container */}
        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Hero Title */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 relative">
                  <Image 
                    src="/logo.svg" 
                    alt="Data Alchemist" 
                    width={40} 
                    height={40}
                    className="text-white"
                  />
                </div>
                <span className="text-sm font-medium text-gray-400 tracking-wider uppercase">Data Alchemist</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-5xl lg:text-6xl font-bold text-white leading-tight"
              >
                One-click for Asset
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Defense
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-lg text-gray-400 max-w-lg leading-relaxed"
              >
                Drag and drop all assets, where it manages to blockchain technology meets financial expertise through the smartest technology.
              </motion.p>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex items-center gap-4"
            >
              <Button 
                onClick={handleGetStarted}
                className="px-8 py-3 bg-white text-black hover:bg-gray-100 font-medium rounded-full transition-all duration-200"
              >
                Get Started
              </Button>
              <Button 
                variant="outline"
                className="px-8 py-3 border-white/20 text-white hover:bg-white/10 font-medium rounded-full transition-all duration-200"
              >
                Documentation
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex items-center gap-8 pt-8"
            >
              <div>
                <div className="text-2xl font-bold text-white">98.2%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Monitoring</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">$2.7M</div>
                <div className="text-sm text-gray-400">Assets Secured</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            {/* Main Dashboard Card */}
            <div className="relative">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
              
              {/* Main card */}
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Meet Marvellous Insights</h3>
                    <p className="text-sm text-gray-400">Keep your team organised this cutting-edge insights for a user growth of all major fields</p>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Success Transactions */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">Success Transactions</span>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">98.2%</div>
                    <div className="text-xs text-green-400">+12.5% from last month</div>
                    
                    {/* Mini chart */}
                    <div className="mt-3 flex items-end gap-1 h-8">
                      {[4, 6, 3, 8, 5, 9, 7, 10, 6, 8].map((height, i) => (
                        <div 
                          key={i}
                          className="bg-green-400/60 rounded-sm flex-1"
                          style={{ height: `${height * 3}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Liquidity Labyrinth */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">Liquidity Labyrinth</span>
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">$847K</div>
                    <div className="text-xs text-blue-400">Available liquidity pool</div>
                    
                    {/* Mini chart */}
                    <div className="mt-3 flex items-end gap-1 h-8">
                      {[7, 4, 8, 5, 9, 6, 10, 7, 5, 8].map((height, i) => (
                        <div 
                          key={i}
                          className="bg-blue-400/60 rounded-sm flex-1"
                          style={{ height: `${height * 3}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Financial Opportunities */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-white">Your Palette Financial Opportunities</h4>
                      <p className="text-xs text-gray-400">What is your appetite risk on a portfolio opportunity!</p>
                    </div>
                  </div>
                  
                  {/* Growth indicators */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">19.2</div>
                      <div className="text-xs text-gray-400">Growth</div>
                      <div className="text-xs text-green-400">$2.7m</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">24</div>
                      <div className="text-xs text-gray-400">Growth</div>
                      <div className="text-xs text-blue-400">$3.2m</div>
                    </div>
                  </div>

                  {/* Chart visualization */}
                  <div className="flex items-end justify-center gap-2 h-16">
                    {[60, 80, 40, 90, 70, 85, 55].map((height, i) => (
                      <div 
                        key={i}
                        className={`rounded-t-sm ${
                          i === 1 ? 'bg-red-400' : 
                          i === 3 ? 'bg-white' : 
                          i === 5 ? 'bg-orange-400' : 
                          'bg-gray-600'
                        }`}
                        style={{ height: `${height}%`, width: '12px' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute -top-4 -left-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-white font-medium">Live Data</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="absolute -bottom-4 -right-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white font-medium">AI Powered</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* File Upload Section - Hidden initially, shown on scroll or interaction */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: canProceed ? 1 : 0, y: canProceed ? 0 : 100 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md"
        >
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-medium mb-4">Upload Your Data</h3>
            <div className="space-y-3">
              {Object.entries(uploadedFiles).map(([key, file]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 capitalize">{key}</span>
                  <span className={file ? "text-green-400" : "text-gray-500"}>
                    {file ? "✓ Ready" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
