"use client"

import type React from "react"
import { Play } from "lucide-react" // Grid3X3アイコンを削除

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Clock, Calendar, AlertTriangle, Check, X } from "lucide-react"
import type { Task } from "@/types/task"
import { formatDaysUntilDue, getDueDateUrgency, getTodayEnd, getTomorrowEnd, getNextSunday } from "@/utils/date-utils"
import { calculateProgressPercentage, isTaskBreakdown, isTaskInProgress } from "@/utils/progress-utils"

// 色の定数を追加（ファイルの上部に）
const COLORS = {
  DARK_GRAY: "#444444",
  BLUE: "#007AFF",
  RED: "#FF5F68",
  TEAL: "#287566",
  WHITE: "#FFFFFF",
} as const

interface TaskItemProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (id: string, title: string, dueDate?: Date) => void
  onDelete: (id: string) => void
  onBreakdown?: (id: string) => void
  onExecute?: (id: string) => void
  accentColor: string
  tutorialStep?: string | null
  showTutorial?: boolean
}

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onBreakdown,
  onExecute,
  accentColor,
  tutorialStep,
  showTutorial,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDueDate, setEditDueDate] = useState(task.dueDate ? task.dueDate.toISOString().slice(0, 16) : "")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 編集モードの状態
  const [selectedDateOption, setSelectedDateOption] = useState<string | null>(null)
  const [showDateOptions, setShowDateOptions] = useState(false)
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("23:59")

  // 進捗情報を取得
  const isBreakdown = isTaskBreakdown(task.id)
  const isInProgress = isTaskInProgress(task.id)
  const progressPercentage = calculateProgressPercentage(task.id)

  // 期日の緊急度を取得
  const dueDateInfo = task.dueDate ? getDueDateUrgency(task.dueDate) : null

  // チュートリアル中のボタン有効性を判定
  const isTutorialButtonEnabled = (buttonType: string): boolean => {
    if (!showTutorial) return true

    switch (tutorialStep) {
      case "simple-task-completion":
        return buttonType === "task-check" && task.id === "tutorial-sample-task"
      case "task-breakdown":
        return buttonType === "task-breakdown" && task.title.includes("プレゼン資料")
      default:
        return false
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) {
          handleCancel()
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isEditing])

  const handleSave = () => {
    if (
      (editTitle.trim() && editTitle !== task.title) ||
      editDueDate !== (task.dueDate?.toISOString().slice(0, 16) || "")
    ) {
      const newDueDate = editDueDate ? new Date(editDueDate) : undefined
      onEdit(task.id, editTitle.trim(), newDueDate)
    }
    setIsEditing(false)
    setShowDateOptions(false)
    setSelectedDateOption(null)
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDueDate(task.dueDate ? task.dueDate.toISOString().slice(0, 16) : "")
    setIsEditing(false)
    setShowDateOptions(false)
    setSelectedDateOption(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const handleDueDateSelect = (type: string) => {
    setSelectedDateOption(type)
    switch (type) {
      case "today":
        setEditDueDate(getTodayEnd().toISOString().slice(0, 16))
        break
      case "tomorrow":
        setEditDueDate(getTomorrowEnd().toISOString().slice(0, 16))
        break
      case "weekend":
        setEditDueDate(getNextSunday().toISOString().slice(0, 16))
        break
      case "custom":
        setShowDateOptions(true)
        return
      case "none":
        setEditDueDate("")
        break
    }
    setShowDateOptions(false)
  }

  const handleCustomDateSubmit = () => {
    if (customDate) {
      const [hours, minutes] = customTime.split(":")
      const date = new Date(customDate)
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)
      setEditDueDate(date.toISOString().slice(0, 16))
      setShowDateOptions(false)
    }
  }

  const activeButtonColor = accentColor.includes("red")
    ? "bg-red-100 border-red-500 text-red-700"
    : "bg-blue-100 border-blue-500 text-blue-700"

  return (
    <div
      ref={containerRef}
      className={`task-item bg-white rounded-lg border transition-all duration-300 ${task.completed ? "opacity-60" : ""} ${
        isInProgress ? "border-teal-300" : "border-gray-200"
      } p-2.5 hover:shadow-md`}
    >
      {isEditing ? (
        // 編集モード - 縦に展開
        <div className="space-y-3">
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            className="text-base font-bold"
            placeholder="タスクを入力..."
          />

          {/* 期日設定セクション */}
          <div>
            <h4 className="text-sm font-bold mb-2 text-gray-700">期限設定</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDueDateSelect("today")}
                className={`px-2 py-1.5 text-sm border rounded text-left transition-all duration-200 font-bold ${
                  selectedDateOption === "today" ? `${activeButtonColor} shadow-md` : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                今日
              </button>
              <button
                type="button"
                onClick={() => handleDueDateSelect("tomorrow")}
                className={`px-2 py-1.5 text-sm border rounded text-left transition-all duration-200 font-bold ${
                  selectedDateOption === "tomorrow"
                    ? `${activeButtonColor} shadow-md`
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                明日
              </button>
              <button
                type="button"
                onClick={() => handleDueDateSelect("weekend")}
                className={`px-2 py-1.5 text-sm border rounded text-left transition-all duration-200 font-bold ${
                  selectedDateOption === "weekend"
                    ? `${activeButtonColor} shadow-md`
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                今週末
              </button>
              <button
                type="button"
                onClick={() => handleDueDateSelect("custom")}
                className={`px-2 py-1.5 text-sm border rounded text-left flex items-center gap-1 transition-all duration-200 font-bold ${
                  selectedDateOption === "custom"
                    ? `${activeButtonColor} shadow-md`
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Calendar className="w-3 h-3" />
                日付指定
              </button>
              <button
                type="button"
                onClick={() => handleDueDateSelect("none")}
                className={`px-2 py-1.5 text-sm border rounded text-left col-span-2 transition-all duration-200 font-bold ${
                  selectedDateOption === "none" ? `${activeButtonColor} shadow-md` : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                期限なし
              </button>
            </div>
          </div>

          {showDateOptions && (
            <div className="space-y-2 p-2 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-300">
              <div>
                <label className="text-xs font-bold text-gray-700">日付</label>
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">時刻</label>
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCustomDateSubmit}
                className="px-2 py-1 text-sm text-white rounded transition-all duration-200 font-bold"
                style={{ backgroundColor: accentColor.includes("red") ? COLORS.RED : COLORS.BLUE }}
              >
                設定
              </button>
            </div>
          )}

          {editDueDate && (
            <div className="bg-gray-50 p-2 rounded text-sm animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-3 h-3" />
                <span className="font-bold">期限: {new Date(editDueDate).toLocaleString("ja-JP")}</span>
              </div>
            </div>
          )}

          {/* 保存・キャンセルボタン */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!editTitle.trim()}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-bold text-sm ${
                !editTitle.trim() ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ backgroundColor: accentColor.includes("red") ? COLORS.RED : COLORS.BLUE }}
            >
              <Check className="w-4 h-4" />
              保存
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-bold text-sm bg-white hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        // 表示モード - ○ボタンを独立して左に配置
        <div className="flex items-start gap-2.5">
          {/* 左：完了チェックボタン（独立） */}
          <button
            onClick={() => onToggleComplete(task.id)}
            disabled={showTutorial && !isTutorialButtonEnabled("task-check")}
            className={`task-check-button flex items-center justify-center transition-all duration-200 flex-shrink-0 self-center ml-1 mr-1 ${
              task.completed ? "border-transparent" : "border-gray-300 hover:border-gray-400 hover:scale-110"
            } ${showTutorial && !isTutorialButtonEnabled("task-check") ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{
              width: "20px",
              height: "20px",
              minWidth: "20px",
              minHeight: "20px",
              borderWidth: "2px",
              borderRadius: "50%",
              borderColor: task.completed ? "transparent" : "#d1d5db",
              backgroundColor: task.completed ? (accentColor.includes("red") ? COLORS.RED : COLORS.BLUE) : COLORS.WHITE,
            }}
          >
            {task.completed && (
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* 右：コンテンツエリア */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* 期日表示 */}
            {task.dueDate && dueDateInfo && (
              <div className="flex justify-start">
                <div
                  className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-bold transition-all duration-300 due-date-text ${
                    dueDateInfo.className
                  } ${dueDateInfo.shouldBlink ? "animate-pulse" : ""}`}
                  style={{
                    backgroundColor:
                      dueDateInfo.level === "overdue"
                        ? "#dc2626"
                        : dueDateInfo.level === "today"
                          ? "#dc2626"
                          : dueDateInfo.level === "tomorrow"
                            ? "#f97316"
                            : dueDateInfo.level === "soon"
                              ? "#fef08a"
                              : dueDateInfo.level === "normal"
                                ? "#e5e7eb"
                                : "#f3f4f6",
                  }}
                >
                  {dueDateInfo.showAlert && <AlertTriangle className="w-2.5 h-2.5" />}
                  <Clock className="w-2.5 h-2.5" />
                  <span className="font-bold text-xs">{formatDaysUntilDue(task.dueDate)}</span>
                  {task.dueDate.getHours() !== 23 || task.dueDate.getMinutes() !== 59 ? (
                    <span className="font-bold text-xs">
                      {task.dueDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* タスクタイトルとアクションボタン */}
            <div className="flex items-center gap-2">
              {/* タスクタイトル */}
              <div
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest(".drag-handle")) {
                    return
                  }
                  // チュートリアル中は編集を無効化
                  if (showTutorial) {
                    return
                  }
                  setIsEditing(true)
                }}
                className={`flex-1 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 -m-1.5 transition-colors duration-200 min-w-0 ${
                  showTutorial ? "cursor-not-allowed" : ""
                }`}
              >
                <div
                  className={`text-sm font-bold text-left transition-colors duration-200 task-title leading-snug ${task.completed ? "line-through" : ""}`}
                  style={{ color: COLORS.DARK_GRAY }}
                >
                  {task.title}
                </div>
              </div>

              {/* 実行・分解ボタン */}
              <div className="flex-shrink-0">
                {isBreakdown ? (
                  <button
                    onClick={() => onExecute?.(task.id)}
                    className="flex items-center gap-1 px-2 py-1 text-white rounded-md transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-bold text-xs"
                    style={{ backgroundColor: COLORS.TEAL }}
                    title="続きから実行"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>実行</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onBreakdown?.(task.id)}
                    disabled={showTutorial && !isTutorialButtonEnabled("task-breakdown")}
                    className={`task-breakdown-button flex items-center gap-1 px-2 py-1 border-2 rounded-md transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-bold text-xs ${
                      showTutorial && !isTutorialButtonEnabled("task-breakdown") ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{
                      borderColor: accentColor.includes("red") ? COLORS.RED : COLORS.BLUE,
                      color: accentColor.includes("red") ? COLORS.RED : COLORS.BLUE,
                      backgroundColor: COLORS.WHITE,
                    }}
                    title="分解してから実行"
                  >
                    <img
                      src={
                        accentColor.includes("red")
                          ? "/images/breakdown-icon-red.png"
                          : "/images/breakdown-icon-blue.png"
                      }
                      alt="分解"
                      className="w-3 h-3"
                    />
                    <span>分解</span>
                  </button>
                )}
              </div>
            </div>

            {/* プログレスバー */}
            {isInProgress && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPercentage}%`,
                      backgroundColor: COLORS.TEAL,
                    }}
                  ></div>
                </div>
                <span
                  className="text-xs font-bold progress-percentage min-w-[2rem] text-right"
                  style={{ color: COLORS.TEAL }}
                >
                  {progressPercentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
