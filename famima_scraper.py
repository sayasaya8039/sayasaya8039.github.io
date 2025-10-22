#!/usr/bin/env python3
"""
ファミリーマート来週の新商品画像ダウンローダー
"""

import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin
import re


class FamilyMartScraper:
    def __init__(self):
        self.url = "https://www.family.co.jp/goods/newgoods/nextweek.html"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        }
        self.download_dir = "famima_images"
        self.session = requests.Session()

    def fetch_page(self):
        """ページのHTMLを取得"""
        print(f"ページを取得中: {self.url}")
        response = self.session.get(self.url, headers=self.headers, timeout=30)
        response.raise_for_status()
        return response.text

    def parse_products(self, html):
        """HTMLから新商品情報を解析"""
        soup = BeautifulSoup(html, 'html.parser')

        # 商品リストを探す（一般的なパターンを試す）
        products = []

        # パターン1: li要素で商品が並んでいる
        product_items = soup.select('ul.ly-mod-list4 li') or \
                       soup.select('ul.product-list li') or \
                       soup.select('div.product-item') or \
                       soup.select('li.item')

        print(f"商品要素を {len(product_items)} 個発見")

        for idx, item in enumerate(product_items, 1):
            # 画像を探す
            img = item.find('img')
            if img:
                # src, data-src, data-original など様々な属性を確認
                img_url = img.get('src') or \
                         img.get('data-src') or \
                         img.get('data-original') or \
                         img.get('data-lazy-src')

                if img_url:
                    # 相対URLを絶対URLに変換
                    img_url = urljoin(self.url, img_url)

                    # 商品名を取得
                    product_name = img.get('alt', f'product_{idx}')

                    products.append({
                        'name': product_name,
                        'image_url': img_url,
                        'index': idx
                    })
                    print(f"  {idx}. {product_name}: {img_url}")

        return products

    def download_images(self, products):
        """画像をダウンロード"""
        # ダウンロードディレクトリを作成
        os.makedirs(self.download_dir, exist_ok=True)

        print(f"\n{len(products)} 個の画像をダウンロード中...")

        for product in products:
            try:
                # 画像を取得
                img_response = self.session.get(product['image_url'], headers=self.headers, timeout=30)
                img_response.raise_for_status()

                # ファイル名を生成（商品名から安全なファイル名を作成）
                safe_name = re.sub(r'[\\/*?:"<>|]', '_', product['name'])
                # 拡張子を取得
                ext = os.path.splitext(product['image_url'])[1].split('?')[0]
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
            # ページを取得
            html = self.fetch_page()

            # 商品を解析
            products = self.parse_products(html)

            # 商品数を確認
            print(f"\n新商品数: {len(products)}")

            if len(products) >= 5:
                print("5個以上の新商品が見つかりました。画像をダウンロードします。")
                self.download_images(products)
                print(f"\n完了！画像は '{self.download_dir}' ディレクトリに保存されました。")
            else:
                print(f"新商品が5個未満のため、ダウンロードをスキップします。")
                return False

            return True

        except Exception as e:
            print(f"エラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    scraper = FamilyMartScraper()
    scraper.run()
