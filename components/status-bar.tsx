"use client"

export function StatusBar() {
  return (
    <div className="flex justify-between items-center bg-white text-black text-sm font-medium py-0 px-4">
      <div></div> {/* 左側も空にする */}
      <div></div> {/* 右側も空にする */}
    </div>
  )
}
