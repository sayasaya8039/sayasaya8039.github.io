# ファミリーマート新商品アプリ - Windows版

ファミリーマートの新商品情報を取得・表示するWindowsデスクトップアプリケーションです。

## 必要な環境

- Node.js (v16以上推奨)
- npm または yarn

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発モードで起動

アプリケーションを開発モードで起動します：

```bash
npm start
```

## ビルド手順

### Windows用の実行可能ファイル（.exe）を作成

#### オプション1: インストーラー付き（推奨）

64bit版と32bit版の両方のインストーラーを作成：

```bash
npm run build:win
```

生成されるファイル：
- `dist/ファミリーマート新商品アプリ Setup 1.0.0.exe` (インストーラー)

#### オプション2: ポータブル版

インストール不要で直接実行できるポータブル版：

```bash
npm run build:win
```

生成されるファイル：
- `dist/FamilyMartProducts-Portable.exe` (ポータブル版)

#### オプション3: すべてのバージョンを作成

```bash
npm run build:all
```

### ビルド成果物の場所

ビルドが完了すると、`dist/` フォルダに以下のファイルが生成されます：

- **インストーラー版**: `ファミリーマート新商品アプリ Setup 1.0.0.exe`
  - インストールが必要
  - スタートメニューとデスクトップにショートカットが作成される
  - アンインストーラー付き

- **ポータブル版**: `FamilyMartProducts-Portable.exe`
  - インストール不要
  - USBメモリなどで持ち運び可能
  - レジストリを汚さない

## アイコンのカスタマイズ

アプリのアイコンを変更したい場合：

1. 256x256ピクセルのPNG画像を用意
2. `icon.png` として保存
3. Windows用には `icon.ico` ファイルも必要です

### ICOファイルの作成方法

オンラインツールを使用：
- [icoconvert.com](https://icoconvert.com/)
- [convertio.co](https://convertio.co/ja/png-ico/)

または、ImageMagickを使用：

```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## 使い方

1. アプリを起動
2. ファミリーマートの新商品ページ（https://www.family.co.jp/goods/newgoods.html）を開く
3. `Ctrl+U` でHTMLソースを表示
4. `Ctrl+A` → `Ctrl+C` でコピー
5. アプリのテキストエリアに貼り付け
6. 「商品情報を解析」ボタンをクリック
7. 商品画像をダウンロード

## トラブルシューティング

### ビルドエラーが発生する場合

```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
npm run build:win
```

### Windows Defenderの警告

初回起動時にWindows Defenderが警告を表示する場合があります。これは署名されていないアプリケーションのため通常の動作です。

「詳細情報」→「実行」で起動できます。

### アイコンが表示されない場合

1. `icon.png` と `icon.ico` が存在することを確認
2. ファイルサイズが適切か確認（PNGは256x256推奨）
3. 再ビルドを実行

## 機能

- ファミリーマート新商品情報の解析
- 商品画像の一括ダウンロード
- カテゴリー別表示
- 高速ダウンロード（複数プロキシサーバー対応）
- オフラインで動作（HTMLソース貼り付け後）

## ライセンス

MIT License

## 開発者向け情報

### プロジェクト構造

```
.
├── main.js           # Electronメインプロセス
├── preload.js        # プリロードスクリプト
├── index.html        # アプリのUI
├── package.json      # 依存関係とビルド設定
├── icon.svg          # アイコン（SVG）
├── icon.png          # アイコン（PNG）
└── icon.ico          # アイコン（Windows用）
```

### スクリプト一覧

- `npm start` - 開発モードで起動
- `npm run build` - ビルド（全プラットフォーム）
- `npm run build:win` - Windows版ビルド（64bit）
- `npm run build:win32` - Windows版ビルド（32bit）
- `npm run build:all` - Windows版ビルド（両方）

### 使用技術

- Electron v28
- electron-builder
- HTML/CSS/JavaScript
- Tailwind CSS
- Font Awesome

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
