const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    autoHideMenuBar: false,
    title: 'ファミリーマート新商品アプリ'
  });

  // index.htmlを読み込む
  mainWindow.loadFile('index.html');

  // メニューバーを設定
  const menu = Menu.buildFromTemplate([
    {
      label: 'ファイル',
      submenu: [
        {
          label: '再読み込み',
          accelerator: 'F5',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: '開発者ツール',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '表示',
      submenu: [
        {
          label: '拡大',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 1);
          }
        },
        {
          label: '縮小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 1);
          }
        },
        {
          label: '実際のサイズ',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        { type: 'separator' },
        {
          label: '全画面表示',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'バージョン情報',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'バージョン情報',
              message: 'ファミリーマート新商品アプリ',
              detail: `バージョン: 1.0.0\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}`
            });
          }
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  // ウィンドウが閉じられた時の処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 外部リンクはデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // 開発環境では自動的に開発者ツールを開く
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// アプリケーションの準備ができたらウィンドウを作成
app.whenReady().then(() => {
  createWindow();

  // macOSでは、Dockアイコンがクリックされた時にウィンドウを再作成
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  // macOS以外ではアプリケーションを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// セキュリティ: 外部のナビゲーションを防止
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // 外部サイトへのナビゲーションは許可しない（新しいウィンドウで開く）
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
      require('electron').shell.openExternal(navigationUrl);
    }
  });
});
