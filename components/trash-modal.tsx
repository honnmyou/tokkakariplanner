"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Trash2, Calendar, AlertTriangle } from "lucide-react"
import { getTrashItems, emptyTrash, type TrashItem } from "@/utils/storage-manager"

interface TrashModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TrashItem | null>(null)

  // ゴミ箱アイテムを読み込み
  useEffect(() => {
    if (isOpen) {
      const items = getTrashItems()
      setTrashItems(items)
    }
  }, [isOpen])

  const handleEmptyTrash = () => {
    emptyTrash()
    setTrashItems([])
    setShowConfirmEmpty(false)
  }

  const formatDeletedDate = (date: Date): string => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays}日前`
    } else if (diffHours > 0) {
      return `${diffHours}時間前`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分前`
    } else {
      return "たった今"
    }
  }

  const getCategoryDotColor = (category: "immediate" | "later") => {
    return category === "immediate" ? "#FF5F68" : "#007AFF"
  }

  const handleRestoreItem = (itemId: string) => {
    // ゴミ箱から復元する機能（将来的に実装可能）
    console.log("Restore item:", itemId)
  }

  const handleDeleteItemClick = (item: TrashItem) => {
    setDeleteConfirmItem(item)
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmItem) {
      const updatedItems = trashItems.filter((item) => item.id !== deleteConfirmItem.id)
      localStorage.setItem("tokkakari-trash", JSON.stringify(updatedItems))
      setTrashItems(updatedItems)
      console.log("Permanently deleted item:", deleteConfirmItem.id)
      setDeleteConfirmItem(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmItem(null)
  }

  const getCategoryLabel = (category: "immediate" | "later") => {
    return category === "immediate" ? "まず最初にやる事" : "後でじっくり考える事"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all duration-300 ease-out scale-100 opacity-100 flex flex-col"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-800">ゴミ箱</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
          {trashItems.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">ゴミ箱は空です</p>
              <p className="text-sm text-gray-400 mt-1">削除されたタスクがここに表示されます</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trashItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border bg-gray-50 border-gray-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* カテゴリを示す丸 */}
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: getCategoryDotColor(item.category) }}
                        title={item.category === "immediate" ? "まず最初にやる事" : "後でじっくり考える事"}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 leading-tight break-words">{item.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span className="font-bold">{formatDeletedDate(item.deletedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 個別削除ボタン */}
                    <button
                      onClick={() => handleDeleteItemClick(item)}
                      className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="完全に削除"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {trashItems.length > 0 && (
          <div className="p-6 pt-4 border-t border-gray-100 flex-shrink-0">
            <div className="text-center">
              <p className="text-sm text-gray-600 font-bold mb-2">削除されたタスクは30日後に自動的に完全削除されます</p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF5F68" }}></div>
                  <span>まず最初にやる事</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#007AFF" }}></div>
                  <span>後でじっくり考える事</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl transform transition-all duration-300 ease-out scale-100 opacity-100">
            {/* ダイアログヘッダー */}
            <div className="p-6 pb-4 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">完全削除の確認</h3>
              <p className="text-sm text-gray-600 mb-4">
                このタスクを完全に削除しますか？
                <br />
                この操作は取り消せません。
              </p>
            </div>

            {/* 削除対象のタスク表示 */}
            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: getCategoryDotColor(deleteConfirmItem.category) }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm leading-tight break-words">
                      {deleteConfirmItem.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{formatDeletedDate(deleteConfirmItem.deletedAt)}に削除</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ダイアログボタン */}
            <div className="p-6 pt-2 flex gap-3">
              <Button variant="outline" onClick={handleCancelDelete} className="flex-1 font-bold bg-transparent">
                キャンセル
              </Button>
              <Button onClick={handleConfirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold">
                完全削除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
