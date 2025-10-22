# ファミリーマート新商品画像ダウンローダー

ファミリーマートの「来週の新商品」ページから、5個以上の新商品が掲載されている場合に、新商品の画像を自動的にダウンロードするツールです。

## 機能

- ファミリーマート公式サイトの「来週の新商品」ページをチェック
- 新商品が5個以上ある場合のみ画像をダウンロード
- 右クリック禁止サイトでも、ソースから画像URLを取得してダウンロード
- 画像は `famima_images` フォルダに保存

## 2つのバージョン

### 1. famima_scraper.py (シンプル版)
- requestsとBeautifulSoupを使用
- 軽量で高速
- ただし、サイトのWAF（Web Application Firewall）によってブロックされる可能性がある

### 2. famima_scraper_selenium.py (推奨版)
- Seleniumを使用して実際のブラウザを自動化
- JavaScriptで読み込まれるコンテンツにも対応
- より確実に動作するが、Chrome/Chromiumが必要

## インストール方法

### 1. 必要なパッケージをインストール

```bash
pip install -r requirements.txt
```

### 2. Selenium版を使用する場合（推奨）

Chromeブラウザがインストールされていることを確認してください。
インストールされていない場合：

**Windows:**
- [Google Chrome](https://www.google.com/chrome/)をダウンロードしてインストール

**Mac:**
```bash
brew install --cask google-chrome
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser chromium-chromedriver
```

## 使い方

### Selenium版（推奨）

```bash
python famima_scraper_selenium.py
```

### シンプル版

```bash
python famima_scraper.py
```

## 実行例

```
ブラウザを起動中...
ページを取得中: https://www.family.co.jp/goods/newgoods/nextweek.html
セレクタ 'ul.ly-mod-list4 li img' で 15 個の画像を発見
  1. ファミチキ（新味）
  2. チーズドッグ
  ...

新商品数: 15
5個以上の新商品が見つかりました。画像をダウンロードします。

15 個の画像をダウンロード中...
  ✓ ダウンロード完了: 01_ファミチキ（新味）.jpg
  ✓ ダウンロード完了: 02_チーズドッグ.jpg
  ...

完了！画像は 'famima_images' ディレクトリに保存されました。
```

## 出力

- ダウンロードされた画像は `famima_images/` ディレクトリに保存されます
- ファイル名は `番号_商品名.jpg` の形式になります
- 新商品が5個未満の場合、ダウンロードは実行されません

## トラブルシューティング

### 403 Forbiddenエラーが発生する場合

`famima_scraper.py`（シンプル版）で403エラーが発生する場合は、`famima_scraper_selenium.py`（Selenium版）を使用してください。

### Chromeが見つからないエラー

Selenium版で「Chrome binary not found」エラーが出る場合：

1. Google ChromeまたはChromiumがインストールされているか確認
2. パスが通っているか確認
3. 環境変数にChromeのパスを設定：

```python
# famima_scraper_selenium.py の chrome_options に追加
chrome_options.binary_location = "/path/to/your/chrome"  # Chromeのパスを指定
```

### スクリプトが動かない場合

1. Pythonのバージョンを確認（Python 3.8以上推奨）:
   ```bash
   python --version
   ```

2. パッケージを再インストール:
   ```bash
   pip install --upgrade -r requirements.txt
   ```

3. ページ構造が変更されている可能性があります。その場合は、スクリプトのCSSセレクタを更新する必要があります。

## カスタマイズ

### ダウンロード条件を変更

5個以上という条件を変更したい場合、スクリプト内の以下の行を編集してください：

```python
if len(products) >= 5:  # ここの数字を変更
```

### ダウンロード先フォルダを変更

```python
self.download_dir = "famima_images"  # 好きなフォルダ名に変更
```

### 対象URLを変更

今週の新商品をダウンロードしたい場合：

```python
self.url = "https://www.family.co.jp/goods/newgoods.html"  # 今週の新商品
# または
self.url = "https://www.family.co.jp/goods/newgoods/lastweek.html"  # 先週の新商品
```

## 注意事項

- このツールは個人的な利用を目的としています
- サイトに過度な負荷をかけないよう、適切な間隔で実行してください
- ファミリーマートの利用規約を遵守してください
- スクレイピングが規約違反となる場合は使用を控えてください

## ライセンス

MIT License
