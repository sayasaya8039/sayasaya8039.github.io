#!/usr/bin/env python3
"""
Chrome拡張機能用のアイコンを生成するスクリプト
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """指定サイズのアイコンを作成"""
    # ファミリーマートのイメージカラー（緑）
    bg_color = (0, 160, 64)  # ファミマグリーン
    text_color = (255, 255, 255)  # 白

    # 画像を作成
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # 中央に「F」の文字を描画（ファミマのF）
    try:
        # フォントサイズを調整
        font_size = int(size * 0.6)
        try:
            # システムフォントを使用
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            # フォントが見つからない場合はデフォルトフォント
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    text = "F"

    # テキストの境界ボックスを取得
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # テキストを中央に配置
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]

    draw.text((x, y), text, fill=text_color, font=font)

    # 保存
    img.save(output_path)
    print(f"アイコン作成完了: {output_path} ({size}x{size})")

def main():
    # アイコンのサイズ
    sizes = [16, 48, 128]

    # スクリプトのディレクトリを取得
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for size in sizes:
        output_path = os.path.join(script_dir, f"icon{size}.png")
        create_icon(size, output_path)

    print("\nすべてのアイコンの作成が完了しました！")

if __name__ == "__main__":
    main()
