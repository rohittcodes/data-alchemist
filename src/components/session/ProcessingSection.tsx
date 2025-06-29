import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, Download } from "lucide-react"

interface SessionData {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
}

interface ProcessingSectionProps {
  sessionData: SessionData
  processing: boolean
  progress: number
  onStartProcessing: () => void
}

export function ProcessingSection({
  sessionData,
  processing,
  progress,
  onStartProcessing
}: ProcessingSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {processing && <Loader2 className="h-5 w-5 animate-spin" />}
          {sessionData.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
          Data Processing
        </CardTitle>
        <CardDescription>
          {sessionData.status === 'uploaded' && 'Ready to process your data'}
          {processing && 'Processing your data...'}
          {sessionData.status === 'completed' && 'Data processing completed successfully!'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(processing || sessionData.status === 'completed') && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {sessionData.status === 'uploaded' && !processing && (
              <Button onClick={onStartProcessing} className="flex-1">
                Start Processing
              </Button>
            )}
            
            {sessionData.status === 'completed' && (
              <>
                <Button className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download Results
                </Button>
                <Button variant="outline">
                  View Log
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
