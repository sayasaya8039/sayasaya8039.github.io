// ファミリーマート新商品ページから商品画像を検出するスクリプト

// 画像URLを取得するヘルパー関数
function getImageUrl(img) {
  return img.src ||
         img.getAttribute('data-src') ||
         img.getAttribute('data-original') ||
         img.getAttribute('data-lazy-src') ||
         img.getAttribute('data-echo') ||
         img.dataset.src ||
         img.dataset.original;
}

// 商品画像を検出する関数
function detectProducts() {
  console.log('=== 商品検出開始 ===');
  const products = [];

  // 複数のセレクタパターンを試す（優先度順）
  const selectors = [
    // ファミリーマート特有のパターン
    'ul.ly-mod-list4 li',
    '.ly-mod-list4 li',
    'ul.ly-mod-list li',

    // 一般的な商品リストパターン
    'ul.product-list li',
    '.product-list li',
    'ul.goods-list li',
    '.goods-list li',
    'ul.item-list li',
    '.item-list li',
    'div.product-item',
    '.product-item',
    'li.item',
    'li.product',
    'li.goods',

    // より広範なパターン
    'article',
    '.card',
    'li[class*="item"]',
    'li[class*="product"]',
    'div[class*="item"]',
    'div[class*="product"]'
  ];

  let productItems = [];
  let usedSelector = null;

  // 各セレクタを試して、最初に見つかったものを使用
  for (const selector of selectors) {
    productItems = document.querySelectorAll(selector);
    if (productItems.length > 0) {
      console.log(`✓ セレクタ '${selector}' で ${productItems.length} 個の要素を発見`);
      usedSelector = selector;
      break;
    } else {
      console.log(`  セレクタ '${selector}' - 見つかりません`);
    }
  }

  // 要素が見つからない場合は、全てのimg要素を検索
  if (productItems.length === 0) {
    console.log('⚠ リスト項目が見つからないため、全てのimg要素を直接検索');
    const allImages = document.querySelectorAll('img');
    console.log(`  ページ内の全画像数: ${allImages.length}`);

    allImages.forEach((img, index) => {
      const src = getImageUrl(img);
      const alt = img.alt || `product_${index + 1}`;

      console.log(`  画像 ${index + 1}: ${alt} - ${src}`);

      // 画像URLが有効で、商品画像らしいものをフィルタリング
      if (src &&
          src.startsWith('http') &&  // 有効なURLか確認
          !src.includes('logo') &&
          !src.includes('banner') &&
          !src.includes('icon') &&
          !src.includes('btn') &&
          !src.includes('bg_') &&
          !src.includes('background') &&
          // 商品画像の特徴を持つURLを検出
          (src.includes('goods') ||
           src.includes('product') ||
           src.includes('item') ||
           src.includes('img') ||
           alt.length > 3)) {  // alt属性が意味のあるテキストを持つ
        products.push({
          name: alt,
          imageUrl: src,
          index: products.length + 1
        });
        console.log(`    ✓ 商品として追加: ${alt}`);
      }
    });
  } else {
    // リスト項目内の画像を検索
    console.log(`リスト項目から画像を検索中...`);

    productItems.forEach((item, index) => {
      // 複数の方法で画像を探す
      const img = item.querySelector('img') ||
                  item.querySelector('[src]') ||
                  item.querySelector('[data-src]');

      if (img) {
        // 様々な属性から画像URLを取得
        const imageUrl = getImageUrl(img);

        if (imageUrl && imageUrl.startsWith('http')) {
          // 商品名を取得（alt属性、またはテキストコンテンツから）
          let productName = img.alt;

          if (!productName || productName.trim() === '') {
            // alt属性がない場合、周辺のテキストを探す
            const textElements = [
              item.querySelector('p'),
              item.querySelector('span'),
              item.querySelector('div'),
              item.querySelector('h3'),
              item.querySelector('h4'),
              item.querySelector('h5'),
              item.querySelector('.name'),
              item.querySelector('.title'),
              item.querySelector('.product-name'),
              item
            ].filter(el => el);

            for (const el of textElements) {
              const text = el.textContent.trim();
              if (text && text.length > 0 && text.length < 100) {
                productName = text;
                break;
              }
            }

            if (!productName) {
              productName = `product_${index + 1}`;
            }
          }

          products.push({
            name: productName,
            imageUrl: imageUrl,
            index: index + 1
          });

          console.log(`  ✓ 商品 ${index + 1}: ${productName}`);
          console.log(`    画像: ${imageUrl}`);
        } else {
          console.log(`  ✗ 商品 ${index + 1}: 画像URLが無効 - ${imageUrl}`);
        }
      } else {
        console.log(`  ✗ 項目 ${index + 1}: 画像要素が見つかりません`);
      }
    });
  }

  console.log(`=== 検出完了: 合計 ${products.length} 個の商品 ===`);

  // デバッグ情報を出力
  if (products.length === 0) {
    console.warn('⚠ 商品が検出されませんでした。以下を確認してください:');
    console.warn('  1. ページが完全に読み込まれているか');
    console.warn('  2. ページのURL: ' + window.location.href);
    console.warn('  3. ページ内のul要素数: ' + document.querySelectorAll('ul').length);
    console.warn('  4. ページ内のli要素数: ' + document.querySelectorAll('li').length);
    console.warn('  5. ページ内のimg要素数: ' + document.querySelectorAll('img').length);
  }

  return products;
}

// ポップアップからのメッセージを受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProducts') {
    const products = detectProducts();
    sendResponse({ products: products });
  }
  return true; // 非同期レスポンスを有効にする
});

// ページ読み込み時に自動検出（デバッグ用）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('ファミリーマート商品検出拡張機能が読み込まれました');
    detectProducts();
  });
} else {
  console.log('ファミリーマート商品検出拡張機能が読み込まれました');
  detectProducts();
}
