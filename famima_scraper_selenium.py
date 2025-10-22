#!/usr/bin/env python3
"""
ファミリーマート来週の新商品画像ダウンローダー (Selenium版)
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import requests
import os
import re
import time


class FamilyMartScraperSelenium:
    def __init__(self):
        self.url = "https://www.family.co.jp/goods/newgoods/nextweek.html"
        self.download_dir = "famima_images"
        self.driver = None

    def setup_driver(self):
        """Chromeドライバーをセットアップ"""
        print("ブラウザを起動中...")
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # ヘッドレスモード
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)

    def fetch_page(self):
        """ページを取得"""
        print(f"ページを取得中: {self.url}")
        self.driver.get(self.url)

        # ページが完全に読み込まれるまで待機
        time.sleep(3)

        # JavaScriptの実行完了を待つ
        WebDriverWait(self.driver, 10).until(
            lambda d: d.execute_script('return document.readyState') == 'complete'
        )

    def parse_products(self):
        """ページから新商品情報を解析"""
        products = []

        # 様々なセレクタを試す
        selectors = [
            'ul.ly-mod-list4 li img',
            'ul.product-list li img',
            'div.product-item img',
            'li.item img',
            '.newgoods img',
            'article img',
            'div.goods img'
        ]

        images = []
        for selector in selectors:
            try:
                images = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if images:
                    print(f"セレクタ '{selector}' で {len(images)} 個の画像を発見")
                    break
            except Exception as e:
                continue

        if not images:
            # フォールバック: すべてのimg要素を取得
            images = self.driver.find_elements(By.TAG_NAME, 'img')
            print(f"フォールバックモード: {len(images)} 個の画像を発見")

        for idx, img in enumerate(images, 1):
            try:
                # srcまたはdata-src属性から画像URLを取得
                img_url = img.get_attribute('src') or \
                         img.get_attribute('data-src') or \
                         img.get_attribute('data-original') or \
                         img.get_attribute('data-lazy-src')

                if not img_url:
                    continue

                # データURLや小さなアイコンをスキップ
                if img_url.startswith('data:') or 'icon' in img_url.lower() or 'logo' in img_url.lower():
                    continue

                # 商品名を取得
                product_name = img.get_attribute('alt') or f'product_{idx}'

                # 画像のサイズをチェック（小さすぎる画像は除外）
                try:
                    width = img.get_attribute('width')
                    height = img.get_attribute('height')
                    if width and height:
                        if int(width) < 50 or int(height) < 50:
                            continue
                except:
                    pass

                products.append({
                    'name': product_name,
                    'image_url': img_url,
                    'index': len(products) + 1
                })
                print(f"  {len(products)}. {product_name}")

            except Exception as e:
                continue

        return products

    def download_images(self, products):
        """画像をダウンロード"""
        os.makedirs(self.download_dir, exist_ok=True)

        print(f"\n{len(products)} 個の画像をダウンロード中...")

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': self.url
        }

        for product in products:
            try:
                # 画像を取得
                img_response = requests.get(product['image_url'], headers=headers, timeout=30)
                img_response.raise_for_status()

                # ファイル名を生成
                safe_name = re.sub(r'[\\/*?:"<>|]', '_', product['name'])
                safe_name = safe_name[:100]  # ファイル名が長すぎる場合は切り詰める

                # 拡張子を取得
                ext = os.path.splitext(product['image_url'].split('?')[0])[1]
                if not ext:
                    ext = '.jpg'

                filename = f"{product['index']:02d}_{safe_name}{ext}"
                filepath = os.path.join(self.download_dir, filename)

                # 画像を保存
                with open(filepath, 'wb') as f:
                    f.write(img_response.content)

                print(f"  ✓ ダウンロード完了: {filename}")

            except Exception as e:
                print(f"  ✗ エラー ({product['name']}): {e}")

    def run(self):
        """メイン処理"""
        try:
            # ドライバーをセットアップ
            self.setup_driver()

            # ページを取得
            self.fetch_page()

            # 商品を解析
            products = self.parse_products()

            # 商品数を確認
            print(f"\n新商品数: {len(products)}")

            if len(products) >= 5:
                print("5個以上の新商品が見つかりました。画像をダウンロードします。")
                self.download_images(products)
                print(f"\n完了！画像は '{self.download_dir}' ディレクトリに保存されました。")
                return True
            else:
                print(f"新商品が5個未満のため、ダウンロードをスキップします。")
                return False

        except Exception as e:
            print(f"エラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
            return False

        finally:
            if self.driver:
                print("\nブラウザを終了中...")
                self.driver.quit()


if __name__ == "__main__":
    scraper = FamilyMartScraperSelenium()
    scraper.run()
