import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Zap, TrendingUp } from "lucide-react"

const features = [
  {
    title: "Smart Validation",
    description: "AI-powered data quality checks",
    icon: Shield,
    color: "from-green-500 to-emerald-600"
  },
  {
    title: "Auto Processing",
    description: "Automated data parsing and analysis",
    icon: Zap,
    color: "from-blue-500 to-cyan-600"
  },
  {
    title: "Instant Insights",
    description: "Real-time analytics and reporting",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-600"
  }
]

export function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature) => (
        <Card key={feature.title} className="bg-black/20 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="pb-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-white">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-400">
              {feature.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
