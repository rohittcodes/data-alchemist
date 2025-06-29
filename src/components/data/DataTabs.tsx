import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data"
import { Download, FileText } from "lucide-react"

interface DataType {
  key: string
  label: string
  icon: any
  color: string
}

interface DataTabsProps {
  sessionData: any
  dataTypes: DataType[]
  availableDataTypes: DataType[]
  onCellEdit: (type: string, rowIndex: number, columnId: string, value: string) => Promise<void>
  onDownload: (type: string) => void
}

export function DataTabs({
  sessionData,
  dataTypes,
  availableDataTypes,
  onCellEdit,
  onDownload
}: DataTabsProps) {
  const getDataArray = (data: any) => {
    return data?.rows || data?.data || data
  }

  const getRecordCount = (type: DataType) => {
    const currentData = sessionData?.[type.key]
    if (!currentData) return 0
    const dataArray = getDataArray(currentData)
    return Array.isArray(dataArray) ? dataArray.length : 0
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Data Tables
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={availableDataTypes[0]?.key} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {dataTypes.map((type) => {
              const isAvailable = availableDataTypes.some(t => t.key === type.key)
              const recordCount = getRecordCount(type)
              
              return (
                <TabsTrigger 
                  key={type.key} 
                  value={type.key}
                  disabled={!isAvailable}
                  className="flex items-center gap-2"
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                  {isAvailable && (
                    <span className="ml-1 text-xs bg-white/20 px-1 rounded">
                      {recordCount}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {availableDataTypes.map((type) => {
            const currentData = sessionData?.[type.key]
            const dataArray = getDataArray(currentData)

            return (
              <TabsContent key={type.key} value={type.key} className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <type.icon className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-semibold text-white">{type.label}</h3>
                    <span className="text-sm text-gray-400">
                      {Array.isArray(dataArray) ? dataArray.length : 0} records
                    </span>
                  </div>
                  <Button
                    onClick={() => onDownload(type.key)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </div>

                {Array.isArray(dataArray) && dataArray.length > 0 ? (
                  <DataTable 
                    data={dataArray}
                    onCellEdit={(rowIndex, columnId, value) => 
                      onCellEdit(type.key, rowIndex, columnId, value)
                    }
                    className="bg-transparent"
                  />
                ) : (
                  <div className="text-center py-16">
                    <type.icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No {type.label} Data</h3>
                    <p className="text-gray-400">No {type.label.toLowerCase()} data found in this session.</p>
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
