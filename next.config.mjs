/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静的エクスポートの設定（もしあれば）
  // ↓↓↓ ここに basePath を追加 ↓↓↓
  basePath: '/tokkakariplanner', // ★★★ ここにあなたのリポジトリ名を入力！ ★★★
  // ↑↑↑ ここに basePath を追加 ↑↑↑
};

export default nextConfig;