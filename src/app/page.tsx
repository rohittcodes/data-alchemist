"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { 
  FileSpreadsheet, 
  Brain, 
  Shield, 
  Zap, 
  CheckCircle, 
  TrendingUp, 
  Search,
  FileText,
  Target,
  Upload,
  BarChart3,
  Sparkles,
  Database,
  Activity
} from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { motion } from "motion/react"
import Image from "next/image"
import { SignInButton } from "@clerk/nextjs"

export default function Home() {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  // Redirect authenticated users to the main dashboard
  React.useEffect(() => {
    if (isLoaded && user) {
      router.push('/data')
    }
  }, [isLoaded, user, router])

  const handleGetStarted = () => {
    if (user) {
      router.push('/data')
    } else {
      router.push('/sign-in')
    }
  }

  return (
    <AppLayout showSidebar={false}>
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
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
                Transform Your
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Data Quality
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-lg text-gray-400 max-w-lg leading-relaxed"
              >
                Upload, validate, and perfect your CSV and XLSX files with AI-powered insights. 
                Real-time error detection, intelligent corrections, and comprehensive data quality analysis.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex items-center gap-4"
            >
              <Button 
                onClick={handleGetStarted}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium rounded-xl transition-all duration-200"
              >
                <Upload className="w-5 h-5 mr-2" />
                Start Analyzing Data
              </Button>
              <Button 
                variant="outline"
                className="px-8 py-3 border-white/20 text-white hover:bg-white/10 font-medium rounded-xl transition-all duration-200"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Documentation
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex items-center gap-8 pt-8"
            >
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-400">Data Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">50ms</div>
                <div className="text-sm text-gray-400">Validation Speed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">10M+</div>
                <div className="text-sm text-gray-400">Rows Processed</div>
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Data Quality Dashboard</h3>
                    <p className="text-sm text-gray-400">Real-time validation and insights</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">Health Score</span>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">94.2%</div>
                    <div className="text-xs text-green-400">+8.5% improved</div>
                    
                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full" style={{ width: '94.2%' }} />
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400">Errors Fixed</span>
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">1,247</div>
                    <div className="text-xs text-yellow-400">AI-powered fixes</div>
                    
                    {/* Mini chart */}
                    <div className="mt-3 flex items-end gap-1 h-8">
                      {[6, 8, 4, 9, 7, 10, 8, 5, 9, 7].map((height, i) => (
                        <div 
                          key={i}
                          className="bg-yellow-400/60 rounded-sm flex-1"
                          style={{ height: `${height * 3}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-white">Active Data Sessions</h4>
                      <p className="text-xs text-gray-400">Real-time processing and validation</p>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                  
                  {/* File types */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-white">clients.csv</span>
                      </div>
                      <span className="text-xs text-green-400">Validated ✓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white">workers.xlsx</span>
                      </div>
                      <span className="text-xs text-blue-400">Processing...</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white">tasks.csv</span>
                      </div>
                      <span className="text-xs text-purple-400">AI Analysis</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute -top-4 -left-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-white font-medium">Live Validation</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="absolute -bottom-4 -right-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white font-medium">AI Enhanced</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
