// プリロードスクリプト
// セキュリティのため、レンダラープロセスとメインプロセスの橋渡しを行う

const { contextBridge, ipcRenderer } = require('electron');

// 必要に応じてAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // 将来的に機能を追加する場合はここに記述
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// コンソールにアプリ起動メッセージを表示
window.addEventListener('DOMContentLoaded', () => {
  console.log('ファミリーマート新商品アプリ - Electron版が起動しました');
  console.log('Platform:', process.platform);
  console.log('Electron:', process.versions.electron);
});
