"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Calendar, Clock } from "lucide-react"
import { getTodayEnd, getTomorrowEnd, getNextSunday } from "@/utils/date-utils"

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, dueDate?: Date, category?: "immediate" | "later") => void
  category: "immediate" | "later"
  tutorialStep?: string | null
  onTutorialStepComplete?: (step: string) => void
}

export function TaskForm({ isOpen, onClose, onSubmit, category, tutorialStep, onTutorialStepComplete }: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [selectedDateOption, setSelectedDateOption] = useState<string | null>(null)
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("23:59")

  // Auto-fill demo text for tutorial
  useEffect(() => {
    if (tutorialStep === "task-form-explanation" && isOpen) {
      setTitle("プレゼン資料を作成する")
    }
  }, [tutorialStep, isOpen])

  const isTutorialSubmitEnabled = (): boolean => {
    if (!tutorialStep) return true

    if (tutorialStep === "task-form-explanation") {
      return title.trim().includes("プレゼン資料")
    }

    return true
  }

  // チュートリアル中の制御を追加
  const isTutorialFormEnabled = (): boolean => {
    if (!tutorialStep) return true

    if (tutorialStep === "task-form-explanation") {
      return true // フォーム入力は許可
    }

    return false
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit(title.trim(), dueDate, category)
      setTitle("")
      setDueDate(undefined)
      setSelectedDateOption(null)
      setShowCustomDate(false)
      setCustomDate("")
      setCustomTime("23:59")
      onClose()
    }
  }

  const handleDueDateSelect = (type: string) => {
    setSelectedDateOption(type)
    switch (type) {
      case "today":
        setDueDate(getTodayEnd())
        break
      case "tomorrow":
        setDueDate(getTomorrowEnd())
        break
      case "weekend":
        setDueDate(getNextSunday())
        break
      case "custom":
        setShowCustomDate(true)
        return
      case "none":
        setDueDate(undefined)
        break
    }
    setShowCustomDate(false)
  }

  const handleCustomDateSubmit = () => {
    if (customDate) {
      const [hours, minutes] = customTime.split(":")
      const date = new Date(customDate)
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)
      setDueDate(date)
      setShowCustomDate(false)
    }
  }

  const accentColor = category === "immediate" ? "text-red-500" : "text-blue-500"
  const buttonColor = category === "immediate" ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
  const activeButtonColor =
    category === "immediate" ? "bg-red-100 border-red-500 text-red-700" : "bg-blue-100 border-blue-500 text-blue-700"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* フォーム全体を無効化する場合の処理を追加 */}
      <div
        className={`task-form bg-white w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-300 ease-out scale-100 opacity-100 flex flex-col h-auto max-h-[85vh] ${
          tutorialStep && !isTutorialFormEnabled() ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {/* Header - 固定 */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className={`text-lg font-bold ${accentColor}`}>新しいタスク</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - スクロール可能 */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
          {/* チュートリアルヒント */}
          {tutorialStep === "task-form-explanation" && (
            <div
              className="border rounded-lg p-4 mb-4 animate-in slide-in-from-top-2 duration-300"
              style={{ backgroundColor: "#E3F2FD", borderColor: "#0288D1" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: "#0288D1" }}
                >
                  ?
                </div>
                <h3 className="text-sm font-bold" style={{ color: "#263238" }}>
                  タスクを入力しよう
                </h3>
              </div>
              <p className="text-sm mb-2 font-bold" style={{ color: "#263238" }}>
                「プレゼン資料を作成する」と入力して、「タスクを追加」ボタンをクリックしてください。
              </p>
              <div className="bg-white border rounded p-2" style={{ borderColor: "#0288D1" }}>
                <p className="text-xs font-bold" style={{ color: "#0288D1" }}>
                  💡 期限設定は任意です。まずはタスクの追加を体験してみましょう！
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                placeholder="タスクを入力..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-bold"
                autoFocus
              />
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-700">期限設定</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDueDateSelect("today")}
                  className={`justify-start transition-all duration-200 font-bold ${
                    selectedDateOption === "today" ? `${activeButtonColor} shadow-md` : "hover:bg-gray-50"
                  }`}
                >
                  今日
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDueDateSelect("tomorrow")}
                  className={`justify-start transition-all duration-200 font-bold ${
                    selectedDateOption === "tomorrow" ? `${activeButtonColor} shadow-md` : "hover:bg-gray-50"
                  }`}
                >
                  明日
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDueDateSelect("weekend")}
                  className={`justify-start transition-all duration-200 font-bold ${
                    selectedDateOption === "weekend" ? `${activeButtonColor} shadow-md` : "hover:bg-gray-50"
                  }`}
                >
                  今週末
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDueDateSelect("custom")}
                  className={`justify-start transition-all duration-200 font-bold ${
                    selectedDateOption === "custom" ? `${activeButtonColor} shadow-md` : "hover:bg-gray-50"
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  日付指定
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDueDateSelect("none")}
                  className={`justify-start col-span-2 transition-all duration-200 font-bold ${
                    selectedDateOption === "none" ? `${activeButtonColor} shadow-md` : "hover:bg-gray-50"
                  }`}
                >
                  期限なし
                </Button>
              </div>
            </div>

            {showCustomDate && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-gray-700">カスタム日時設定</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustomDate(false)
                      setSelectedDateOption(null)
                    }}
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">日付</label>
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">時刻</label>
                  <Input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCustomDateSubmit}
                    className={`flex-1 ${buttonColor} transition-all duration-200 font-bold`}
                    size="sm"
                    disabled={!customDate}
                  >
                    設定
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCustomDate(false)
                      setSelectedDateOption(null)
                    }}
                    size="sm"
                    className="px-3 font-bold"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}

            {dueDate && (
              <div
                className={`p-3 rounded-lg border transition-all duration-300 animate-in slide-in-from-top-2 ${
                  category === "immediate" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-sm ${
                    category === "immediate" ? "text-red-700" : "text-blue-700"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">期限: {dueDate.toLocaleString("ja-JP")}</span>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer - 固定 */}
        <div className="p-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <Button
            type="submit"
            className={`task-form-submit w-full ${buttonColor} transition-all duration-200 hover:scale-105 font-bold ${
              !title.trim() || (tutorialStep && !isTutorialSubmitEnabled()) ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!title.trim() || (tutorialStep === "task-form-explanation" && !isTutorialSubmitEnabled())}
            onClick={handleSubmit}
          >
            タスクを追加
          </Button>
        </div>
      </div>
    </div>
  )
}
