import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface DataSessionHeaderProps {
  sessionId: string | null
  onGoBack: () => void
}

export function DataSessionHeader({ sessionId, onGoBack }: DataSessionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button onClick={onGoBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Session Data
          </h1>
          <p className="text-gray-400 mt-1">
            Session ID: {sessionId}
          </p>
        </div>
      </div>
    </div>
  )
}
