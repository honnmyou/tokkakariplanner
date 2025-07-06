"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface GrandCelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  taskTitle: string
  onCompleteAllTasks?: () => void // 全タスク完了時の処理
}

const GRAND_CELEBRATION_MESSAGES = [
  "🎉 信じられないニャ！！全部やり遂げたニャ！！ 🎉",
  "🌟 これぞまさに伝説の瞬間ニャ！！猫も驚愕ニャ！！ 🌟",
  "🎊 完璧すぎて言葉が出ないニャ！！宇宙一すごいニャ！！ 🎊",
  "🏆 今日という日を永遠に記憶するニャ！！歴史的快挙ニャ！！ 🏆",
  "⭐ もはや神の領域ニャ！！猫界の教科書に載せるニャ！！ ⭐",
  "🎯 完全制覇ニャ！！この感動を全宇宙に伝えたいニャ！！ 🎯",
  "✨ ダイヤモンドより輝いてるニャ！！眩しすぎるニャ！！ ✨",
  "🚀 もう地球を飛び出しそうな勢いニャ！！宇宙デビューニャ！！ 🚀",
]

const CELEBRATION_IMAGES = [
  "/images/cat-celebration-1.png",
  "/images/cat-celebration-2.png",
  "/images/cat-celebration-3.jpg",
]

export function GrandCelebrationModal({ isOpen, onClose, taskTitle, onCompleteAllTasks }: GrandCelebrationModalProps) {
  const [message, setMessage] = useState("")
  const [image, setImage] = useState("")
  const [showAnimation, setShowAnimation] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // ランダムなメッセージと画像を選択
      const randomMessage = GRAND_CELEBRATION_MESSAGES[Math.floor(Math.random() * GRAND_CELEBRATION_MESSAGES.length)]
      const randomImage = CELEBRATION_IMAGES[Math.floor(Math.random() * CELEBRATION_IMAGES.length)]

      setMessage(randomMessage)
      setImage(randomImage)

      // アニメーション開始
      setTimeout(() => setShowAnimation(true), 100)
      setTimeout(() => setShowFireworks(true), 500)
      setTimeout(() => setShowConfetti(true), 800)
    } else {
      // リセット
      setShowAnimation(false)
      setShowFireworks(false)
      setShowConfetti(false)
    }
  }, [isOpen])

  const handleComplete = () => {
    onClose()
    if (onCompleteAllTasks) {
      onCompleteAllTasks()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-100 via-teal-50 to-white flex items-center justify-center z-50 p-4 overflow-hidden">
      {/* 紙吹雪エフェクト - 背景レイヤー */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 animate-bounce opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                backgroundColor: ["#14b8a6", "#0d9488", "#0f766e", "#a7f3d0", "#5eead4"][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* 花火エフェクト - 背景レイヤー */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-ping opacity-40"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                backgroundColor: ["#14b8a6", "#0d9488", "#0f766e", "#a7f3d0"][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 星キラキラエフェクト - 背景レイヤー */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-teal-400 animate-pulse opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${10 + Math.random() * 16}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* メインコンテンツ - 前面レイヤー */}
      <div
        className={`bg-white rounded-3xl w-full max-w-lg transform transition-all duration-1000 ease-out ${
          showAnimation ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-6"
        } shadow-2xl border-2 border-teal-200 z-10 relative`}
        style={{
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ヘッダー部分 */}
        <div className="text-center p-6 pb-4 bg-gradient-to-b from-teal-50 to-white rounded-t-3xl">
          <div className="text-5xl mb-4 animate-bounce">🏆</div>
          <h1 className="text-2xl font-bold mb-2 text-teal-700">🎉 完全制覇！ 🎉</h1>
          <div className="text-lg font-bold text-teal-600">「{taskTitle}」</div>
        </div>

        {/* スクロール可能なコンテンツエリア */}
        <div className="flex-1 p-6 pt-2 text-center overflow-y-auto" style={{ minHeight: 0 }}>
          {/* 祝福画像 */}
          <div className="mb-6">
            <div className="relative inline-block">
              <img
                src={image || "/placeholder.svg"}
                alt="盛大なお祝い猫"
                className={`w-32 h-32 mx-auto object-contain rounded-full border-3 border-teal-300 shadow-lg transform transition-all duration-1000 ${
                  showAnimation ? "scale-100 rotate-0" : "scale-0 rotate-180"
                }`}
              />
              <div className="absolute -top-1 -right-1 text-2xl animate-spin">🌟</div>
              <div className="absolute -bottom-1 -left-1 text-2xl animate-bounce">🎊</div>
            </div>
          </div>

          {/* 盛大な祝福メッセージ */}
          <div className="mb-6">
            <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200">
              <p className="text-lg leading-relaxed font-bold text-teal-800 celebration-message">{message}</p>
            </div>
          </div>
        </div>

        {/* 固定ボタンエリア */}
        <div className="p-6 pt-4 border-t border-teal-100 bg-gradient-to-t from-teal-50 to-white rounded-b-3xl">
          <Button
            onClick={handleComplete}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            ホームに戻る
          </Button>
        </div>
      </div>

      {/* 追加の装飾エフェクト - 背景レイヤー */}
      <div
        className="absolute top-10 left-10 text-4xl animate-bounce opacity-60 z-0"
        style={{ animationDelay: "0.5s" }}
      >
        🎉
      </div>
      <div className="absolute top-20 right-10 text-3xl animate-bounce opacity-60 z-0" style={{ animationDelay: "1s" }}>
        🎊
      </div>
      <div
        className="absolute bottom-20 left-20 text-3xl animate-bounce opacity-60 z-0"
        style={{ animationDelay: "1.5s" }}
      >
        🌟
      </div>
      <div
        className="absolute bottom-10 right-20 text-4xl animate-bounce opacity-60 z-0"
        style={{ animationDelay: "2s" }}
      >
        🏆
      </div>
    </div>
  )
}
