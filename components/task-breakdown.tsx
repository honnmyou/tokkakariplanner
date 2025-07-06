"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Task } from "@/types/task"
import { TaskBreakdownResults } from "./task-breakdown-results"
import { StatusBar } from "@/components/status-bar"
import { breakdownTaskWithAI } from "@/lib/task-breakdown-ai"

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onstart: () => void
  onend: () => void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface TaskBreakdownProps {
  task: Task
  onBack: () => void
  onTasksGenerated: (tasks: string[], isBreakdown?: boolean) => void
  onBackToHome?: () => void
  onTaskCompleted?: (taskId: string) => void
  tutorialStep?: string | null
  onTutorialStepComplete?: (step: string) => void
}

export function TaskBreakdown({
  task,
  onBack,
  onTasksGenerated,
  onBackToHome,
  onTaskCompleted,
  tutorialStep,
  onTutorialStepComplete,
}: TaskBreakdownProps) {
  const [text, setText] = useState("")
  const [interimText, setInterimText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeFillers, setRemoveFillers] = useState(true)
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isRecordingRef = useRef(false)
  const lastClickTime = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showResults, setShowResults] = useState(false)
  const [isManuallyEditing, setIsManuallyEditing] = useState(false)
  const lastCursorPosition = useRef(0)
  const [isInitializing, setIsInitializing] = useState(false)

  // LocalStorage key for saving text
  const storageKey = `task-breakdown-text-${task.id}`

  // Tutorial: voice-input-demoステップで自動的にサンプルテキストを入力
  useEffect(() => {
    if (tutorialStep === "voice-input-demo" && !text.trim()) {
      // 1秒後にサンプルテキストを自動入力
      setTimeout(() => {
        const sampleText =
          "プレゼン資料を作成したいです。内容は新商品の紹介で、10分程度の発表を予定しています。スライドは10枚程度で、グラフや画像も含めたいと思います。来週の金曜日までに完成させる必要があります。"
        setText(sampleText)

        // 自動進行を削除 - ユーザーが「次へ」ボタンを押すまで待つ
        // setTimeout(() => {
        //   if (onTutorialStepComplete) {
        //     onTutorialStepComplete("voice-input-demo")
        //   }
        // }, 2000)
      }, 1000)
    }
  }, [tutorialStep, onTutorialStepComplete, text])

  // Tutorial: breakdown submission monitoring
  useEffect(() => {
    if (tutorialStep === "breakdown-submit" && showResults) {
      setTimeout(() => {
        if (onTutorialStepComplete) {
          onTutorialStepComplete("breakdown-submit")
        }
      }, 1000)
    }
  }, [showResults, tutorialStep, onTutorialStepComplete])

  // Load saved text from localStorage on mount
  useEffect(() => {
    try {
      const savedText = localStorage.getItem(storageKey)
      if (savedText && !tutorialStep) {
        setText(savedText)
        console.log("Loaded saved text from localStorage:", savedText.length, "characters")
      }
    } catch (error) {
      console.error("Failed to load saved text:", error)
    }
  }, [storageKey, tutorialStep])

  // Save text to localStorage whenever it changes
  useEffect(() => {
    if (text.trim() && !tutorialStep) {
      try {
        localStorage.setItem(storageKey, text)
        console.log("Saved text to localStorage:", text.length, "characters")
      } catch (error) {
        console.error("Failed to save text:", error)
      }
    }
  }, [text, storageKey, tutorialStep])

  // フィラー除去関数
  const removeFillerWords = useCallback(
    (text: string): string => {
      if (!removeFillers) return text

      // 基本的なフィラーのみに限定
      const fillerPatterns = [
        /\bえー\b/g,
        /\bあのー\b/g,
        /\bえっと\b/g,
        /\bうーん\b/g,
        /\bまあ\b/g,
        /\bそのー\b/g,
        /\bなんか\b/g,
        /\bっていうか\b/g,
        /\bほら\b/g,
      ]

      let cleanedText = text
      fillerPatterns.forEach((pattern) => {
        cleanedText = cleanedText.replace(pattern, "")
      })

      // 複数の空白を単一の空白に変換
      cleanedText = cleanedText.replace(/\s+/g, " ").trim()
      return cleanedText
    },
    [removeFillers],
  )

  const insertTextAtCursor = useCallback(
    (newText: string, isInterim = false) => {
      const textarea = textareaRef.current
      if (!textarea) {
        if (isInterim) {
          setInterimText(newText)
        } else {
          setText((prev) => prev + newText + " ")
          setInterimText("")
        }
        return
      }

      const start = lastCursorPosition.current
      const currentText = text

      if (isInterim) {
        // 途中結果の場合は、interimTextとして保存
        setInterimText(newText)
      } else {
        // 確結果の場合は、実際のテキストに追加
        const beforeCursor = currentText.substring(0, start)
        const afterCursor = currentText.substring(start)
        const updatedText = beforeCursor + newText + " " + afterCursor

        setText(updatedText)
        setInterimText("")

        // カーソル位置を更新
        setTimeout(() => {
          const newCursorPosition = start + newText.length + 1
          lastCursorPosition.current = newCursorPosition
          textarea.setSelectionRange(newCursorPosition, newCursorPosition)
          textarea.focus()
        }, 0)
      }
    },
    [text],
  )

  // 音声認識の完全なクリーンアップ
  const cleanupRecognition = useCallback(() => {
    console.log("Cleaning up speech recognition...")
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (e) {
        console.log("Error during cleanup:", e)
      }
      recognitionRef.current = null
    }
    setIsRecording(false)
    isRecordingRef.current = false
    setInterimText("")
    setIsInitializing(false)
  }, [])

  // 音声認識インスタンスを作成する関数
  const createSpeechRecognition = useCallback(() => {
    console.log("Creating new speech recognition instance...")

    if (typeof window === "undefined") {
      console.log("Window is undefined")
      return null
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.log("SpeechRecognition not available")
      return null
    }

    const recognition = new SpeechRecognition()

    // 音声認識の設定を調整して文が切れないようにする
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "ja-JP"

    // 追加設定で音声認識の継続性を向上
    if ("maxAlternatives" in recognition) {
      ;(recognition as any).maxAlternatives = 1
    }

    console.log("Speech recognition configured:", {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      lang: recognition.lang,
    })

    recognition.onstart = () => {
      console.log("🎤 Speech recognition STARTED")
      setIsRecording(true)
      isRecordingRef.current = true
      setError(null)
      setIsManuallyEditing(false)
      setIsInitializing(false)

      // Tutorial: 音声入力開始時にbreakdown-screenステップを完了
      if (tutorialStep === "breakdown-screen" && onTutorialStepComplete) {
        onTutorialStepComplete("breakdown-screen")
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log("🔊 Speech recognition result received, results count:", event.results.length)
      let finalTranscript = ""
      let interimTranscript = ""

      // 全ての結果を処理（resultIndexからではなく0から）
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        console.log(`📝 Result ${i}: isFinal=${result.isFinal}, transcript="${transcript}"`)

        if (result.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (!isManuallyEditing) {
        if (interimTranscript.trim()) {
          const cleanedInterim = removeFillerWords(interimTranscript)
          console.log("✏️ Inserting interim text:", cleanedInterim)
          insertTextAtCursor(cleanedInterim, true)
        }

        if (finalTranscript.trim()) {
          const cleanedFinal = removeFillerWords(finalTranscript)
          if (cleanedFinal.trim()) {
            console.log("✅ Inserting final text:", cleanedFinal)
            insertTextAtCursor(cleanedFinal, false)
          }
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("❌ Speech recognition error:", event.error, event.message)

      setIsRecording(false)
      isRecordingRef.current = false
      setInterimText("")
      setIsInitializing(false)

      switch (event.error) {
        case "not-allowed":
          setError("マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。")
          break
        case "no-speech":
          console.log("No speech detected - this is normal, will restart automatically")
          // no-speechエラーの場合は自動的に再開を試みる
          setTimeout(() => {
            if (!isRecordingRef.current && recognitionRef.current) {
              try {
                console.log("🔄 Auto-restarting speech recognition after no-speech...")
                recognitionRef.current.start()
              } catch (e) {
                console.log("Failed to auto-restart:", e)
              }
            }
          }, 1000)
          break
        case "audio-capture":
          setError("マイクが見つかりません。マイクが接続されているか確認してください。")
          break
        case "network":
          setError("ネットワークエラーです。インターネット接続を確認してください。")
          break
        case "aborted":
          console.log("Speech recognition was aborted")
          break
        default:
          console.error("Unknown speech recognition error:", event.error)
          break
      }
    }

    recognition.onend = () => {
      console.log("🛑 Speech recognition ENDED")
      setIsRecording(false)
      isRecordingRef.current = false
      setInterimText("")
      setIsInitializing(false)
      // インスタンスをクリア（再利用不可のため）
      recognitionRef.current = null
    }

    return recognition
  }, [removeFillerWords, insertTextAtCursor, isManuallyEditing, tutorialStep, onTutorialStepComplete])

  // 初期化
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
    console.log("Speech recognition supported:", !!SpeechRecognition)

    // Cleanup on unmount
    return () => {
      cleanupRecognition()
    }
  }, [cleanupRecognition])

  // startRecording関数を改善
  const startRecording = useCallback(async () => {
    console.log("🚀 Starting recording process...")

    if (isRecordingRef.current || isInitializing) {
      console.log("Already recording or initializing, skipping...")
      return
    }

    // Prevent rapid clicking
    const now = Date.now()
    if (now - lastClickTime.current < 1000) {
      console.log("Preventing rapid clicking")
      return
    }
    lastClickTime.current = now

    setIsInitializing(true)
    setError(null)

    try {
      console.log("🎤 Requesting microphone permission...")
      // マイクの権限を毎回確認
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("✅ Microphone permission granted")

      // ストリームを即座に停止（権限確認のためだけに使用）
      stream.getTracks().forEach((track) => track.stop())

      // 既存のインスタンスを完全にクリーンアップ
      cleanupRecognition()

      // 少し待ってから新しいインスタンスを作成
      await new Promise((resolve) => setTimeout(resolve, 100))

      console.log("🔧 Creating new recognition instance...")
      const recognition = createSpeechRecognition()
      if (!recognition) {
        throw new Error("Speech recognition not supported")
      }

      recognitionRef.current = recognition

      // カーソル位置を記録
      if (textareaRef.current) {
        lastCursorPosition.current = textareaRef.current.selectionStart
        console.log("📍 Cursor position recorded:", lastCursorPosition.current)
      }

      // 音声認識を開始
      console.log("▶️ Starting speech recognition...")
      recognition.start()
    } catch (err) {
      console.error("❌ Failed to start recording:", err)
      setIsInitializing(false)

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。")
        } else if (err.name === "NotFoundError") {
          setError("マイクが見つかりません。マイクが接続されているか確認してください。")
        } else {
          setError("音声認識の開始に失敗しました。もう一度お試しください。")
        }
      } else {
        setError("音声認識の開始に失敗しました。もう一度お試しください。")
      }
    }
  }, [createSpeechRecognition, cleanupRecognition, isInitializing])

  // stopRecording関数を改善
  const stopRecording = useCallback(() => {
    console.log("⏹️ Stopping recording...")

    if (!recognitionRef.current || !isRecordingRef.current) {
      console.log("Cannot stop recording: no recognition instance or not recording")
      return
    }

    try {
      console.log("🛑 Calling recognition.stop()...")
      recognitionRef.current.stop()
    } catch (err) {
      console.error("❌ Failed to stop recording:", err)
      // 強制的に状態をリセット
      cleanupRecognition()
    }
  }, [cleanupRecognition])

  const toggleRecording = useCallback(() => {
    console.log("🔄 Toggle recording, current state:", {
      isRecording: isRecordingRef.current,
      isInitializing: isInitializing,
    })

    if (isRecordingRef.current) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [startRecording, stopRecording, isInitializing])

  // チュートリアル中の制御を追加
  const isTutorialBreakdownEnabled = (actionType: string): boolean => {
    if (!tutorialStep) return true

    switch (tutorialStep) {
      case "breakdown-screen":
      case "voice-input":
      case "voice-input-demo":
        return actionType === "voice-input" || actionType === "text-input"
      case "breakdown-submit":
        return actionType === "breakdown-submit" && text.trim().length > 0
      default:
        return false
    }
  }

  const handleBreakdown = async () => {
    if (!text.trim()) return

    // Stop recording before processing
    if (isRecordingRef.current) {
      stopRecording()
    }

    setIsProcessing(true)
    setError(null)

    try {
      // 実際のAI APIを呼び出し
      const result = await breakdownTaskWithAI(task.title, text.trim())

      if (result.success && result.tasks.length > 0) {
        setGeneratedTasks(result.tasks)
        setShowResults(true)
      } else {
        setError(result.error || "タスクの分解に失敗しました。もう一度お試しください。")
      }
    } catch (error) {
      console.error("Task breakdown error:", error)
      setError("タスクの分解中にエラーが発生しました。インターネット接続を確認してください。")
    } finally {
      setIsProcessing(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const handleBackFromResults = () => {
    setShowResults(false)
  }

  const handleStartFromResults = () => {
    onBack()
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setText(newValue)
    setInterimText("") // 手動編集時は途中結果をクリア
    setIsManuallyEditing(true)

    // カーソル位置を更新
    setTimeout(() => {
      if (textareaRef.current) {
        lastCursorPosition.current = textareaRef.current.selectionStart
      }
    }, 0)
  }

  const handleTextFocus = () => {
    setIsManuallyEditing(true)
    // カーソル位置を記録
    if (textareaRef.current) {
      lastCursorPosition.current = textareaRef.current.selectionStart
    }
  }

  const handleTextBlur = () => {
    // フォーカスが外れた後、少し待ってから手動編集フラグをリセット
    setTimeout(() => {
      setIsManuallyEditing(false)
    }, 500)
  }

  const handleClearText = () => {
    setText("")
    setInterimText("")
    // LocalStorageからも削除
    try {
      localStorage.removeItem(storageKey)
      console.log("Cleared text from localStorage")
    } catch (error) {
      console.error("Failed to clear text from localStorage:", error)
    }
    // 音声認識も停止
    if (isRecordingRef.current) {
      stopRecording()
    }
  }

  if (showResults) {
    return (
      <TaskBreakdownResults
        task={task}
        generatedTasks={generatedTasks}
        onBack={handleBackFromResults}
        onStart={handleStartFromResults}
        onTasksGenerated={onTasksGenerated}
        onBackToHome={onBackToHome}
        onTaskCompleted={onTaskCompleted}
        tutorialStep={tutorialStep}
        onTutorialStepComplete={onTutorialStepComplete}
      />
    )
  }

  // 表示用のテキスト（確定テキスト + 途中結果）
  const displayText = text + interimText

  return (
    <div className="breakdown-container min-h-screen bg-gray-50 flex flex-col">
      {/* Status Bar */}
      <StatusBar />

      {/* Header */}
      <div className="bg-teal-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-teal-700">
          <img src="/images/back-arrow.png" alt="戻る" className="w-6 h-6 filter brightness-0 invert" />
        </Button>
        <Button
          variant="outline"
          className={`breakdown-submit text-teal-600 border-white bg-white hover:bg-gray-100 disabled:opacity-50 ${
            tutorialStep && !isTutorialBreakdownEnabled("breakdown-submit") ? "cursor-not-allowed" : ""
          }`}
          onClick={handleBreakdown}
          disabled={
            !text.trim() ||
            isProcessing ||
            (tutorialStep === "breakdown-submit" && !isTutorialBreakdownEnabled("breakdown-submit"))
          }
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              分解中...
            </>
          ) : (
            "分解"
          )}
        </Button>
      </div>

      {/* Content - スクロール可能 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 pb-40">
          {" "}
          {/* 音声入力ボタンのための十分な下部余白 */}
          <h1 className="text-lg font-bold mb-3 text-slate-800">{task.title}</h1>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span className="text-sm">{error}</span>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  ×
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {/* Instructions */}
          <Card className="mb-3">
            <CardContent className="p-3">
              <p className="text-sm text-gray-700 mb-2">
                このタスクで「あなたがやること」と「目指すゴール」を教えてください
              </p>
              <div className="bg-gray-100 p-2 rounded text-xs text-gray-600">
                💬 ゴールが具体的なほど、タスクも細かく分けやすくなります！
                <br />🎤 音声入力またはテキスト入力どちらでもOKです
              </div>
            </CardContent>
          </Card>
          {/* Processing Status */}
          {isProcessing && (
            <Card className="mb-3">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">AIがタスクを分解中...</p>
                    <p className="text-xs text-gray-600">分かりやすいステップに分けています</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Input Area */}
          <Card className="mb-3">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <label htmlFor="filler-toggle" className="text-xs font-medium text-gray-700">
                    フィラー除去
                  </label>
                  <button
                    id="filler-toggle"
                    type="button"
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      removeFillers ? "bg-teal-600" : "bg-gray-200"
                    }`}
                    onClick={() => setRemoveFillers(!removeFillers)}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        removeFillers ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearText}
                    disabled={!text.trim() && !interimText.trim()}
                    className="text-xs h-7 bg-transparent"
                  >
                    クリア
                  </Button>
                  <span className="text-xs text-gray-500">{displayText.length}文字</span>
                </div>
              </div>

              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={displayText}
                  onChange={handleTextChange}
                  onFocus={handleTextFocus}
                  onBlur={handleTextBlur}
                  placeholder="ここにテキストを入力するか、下のマイクボタンで音声入力してください..."
                  className={`tutorial-text-input min-h-[200px] resize-none text-sm ${
                    tutorialStep && !isTutorialBreakdownEnabled("text-input") ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={tutorialStep && !isTutorialBreakdownEnabled("text-input")}
                />
                {interimText && (
                  <div className="absolute bottom-2 right-2 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    認識中...
                  </div>
                )}
              </div>

              {removeFillers && (
                <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mt-2">
                  💡 フィラー除去が有効です。「えー」「あー」「うーん」などの不要な言葉は自動的に除去されます。
                </div>
              )}

              {text && !tutorialStep && (
                <div className="bg-green-50 p-2 rounded text-xs text-green-700 mt-2">
                  💾 入力内容は自動的に保存されています
                </div>
              )}

              {!isSupported && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    お使いのブラウザは音声認識に対応していません。Chrome、Safari、Edgeをお試しください。
                    <br />
                    テキスト入力は引き続きご利用いただけます。
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Voice Input Button - 固定位置 */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <Button
          size="lg"
          className={`voice-input-button w-14 h-14 rounded-full transition-all duration-200 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg"
              : isInitializing
                ? "bg-yellow-500 hover:bg-yellow-600 shadow-lg"
                : isSupported
                  ? "bg-teal-600 hover:bg-teal-700 shadow-md"
                  : "bg-gray-400 cursor-not-allowed shadow-md"
          } ${tutorialStep && !isTutorialBreakdownEnabled("voice-input") ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={toggleRecording}
          disabled={!isSupported || isProcessing || (tutorialStep && !isTutorialBreakdownEnabled("voice-input"))}
        >
          {isInitializing ? (
            <Loader2 className="h-7 w-7 text-white animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-7 w-7 text-white" />
          ) : (
            <Mic className="text-white w-[55px] h-[55px]" />
          )}
        </Button>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs animate-pulse">
            🎤 リアルタイム認識中
          </div>
        </div>
      )}

      {/* Initializing Status */}
      {isInitializing && !isRecording && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs">🔄 音声認識を準備中...</div>
        </div>
      )}
    </div>
  )
}
