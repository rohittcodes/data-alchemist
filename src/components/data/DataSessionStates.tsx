import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, FileText } from "lucide-react"

interface DataSessionStatesProps {
  onGoBack: () => void
}

export function LoadingDataState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400">Loading session data...</p>
      </div>
    </div>
  )
}

export function ErrorDataState({ onGoBack, error }: DataSessionStatesProps & { error: string }) {
  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
        <p className="text-gray-400 mb-6 max-w-md">{error}</p>
        <Button onClick={onGoBack}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  )
}

export function NoDataAvailableState({ onGoBack }: DataSessionStatesProps) {
  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-gray-400 mb-6">This session doesn&apos;t contain any data to display.</p>
        <Button onClick={onGoBack}>
          Go Back to Analysis
        </Button>
      </CardContent>
    </Card>
  )
}
