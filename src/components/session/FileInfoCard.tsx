import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface SessionData {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
}

interface FileInfoCardProps {
  sessionData: SessionData
}

export function FileInfoCard({ sessionData }: FileInfoCardProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Uploaded File
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">File Name:</span>
            <span className="text-sm">{sessionData.fileName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">File Size:</span>
            <span className="text-sm">
              {(sessionData.fileSize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Uploaded:</span>
            <span className="text-sm">
              {new Date(sessionData.uploadedAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(sessionData.status)}`}>
              {sessionData.status.charAt(0).toUpperCase() + sessionData.status.slice(1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
