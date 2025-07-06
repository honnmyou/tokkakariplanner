"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Undo2 } from "lucide-react"

interface UndoToastProps {
  isVisible: boolean
  taskTitle: string
  onUndo: () => void
  onClose: () => void
}

export function UndoToast({ isVisible, taskTitle, onUndo, onClose }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(5) // Changed from 3 to 5

  useEffect(() => {
    if (isVisible) {
      setTimeLeft(5) // Changed from 3 to 5
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onClose()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="undo-toast fixed bottom-20 left-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-40 flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm">「{taskTitle}」をゴミ箱へ移動しました</p>
        <p className="text-xs text-gray-300">{timeLeft}秒後にゴミ箱へ移動</p>
      </div>
      <Button onClick={onUndo} variant="ghost" size="sm" className="text-white hover:bg-gray-700 ml-2">
        <Undo2 className="w-4 h-4 mr-1" />
        取り消し
      </Button>
    </div>
  )
}
