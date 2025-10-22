// ファミリーマート新商品画像ダウンローダー - コンテンツスクリプト

/**
 * ページから商品画像を抽出
 */
function extractProductImages() {
  const products = [];

  // 複数のセレクタパターンを試す
  const selectors = [
    'ul.ly-mod-list4 li img',
    'ul.product-list li img',
    'div.product-item img',
    'li.item img'
  ];

  let images = [];
  for (const selector of selectors) {
    images = document.querySelectorAll(selector);
    if (images.length > 0) {
      console.log(`セレクタ '${selector}' で ${images.length} 個の画像を発見`);
      break;
    }
  }

  images.forEach((img, index) => {
    // 様々な属性から画像URLを取得
    const imgUrl = img.src ||
                   img.dataset.src ||
                   img.dataset.original ||
                   img.dataset.lazySrc;

    if (imgUrl && !imgUrl.includes('data:image')) {
      const productName = img.alt || `product_${index + 1}`;

      products.push({
        name: productName,
        imageUrl: imgUrl,
        index: index + 1
      });
    }
  });

  console.log(`合計 ${products.length} 個の商品画像を検出`);
  return products;
}

/**
 * ポップアップからのメッセージをリスン
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProducts') {
    const products = extractProductImages();
    sendResponse({ products: products });
  }
  return true;
});

// ページ読み込み時に自動的に商品数をチェック
window.addEventListener('load', () => {
  const products = extractProductImages();

  // バッジに商品数を表示
  chrome.runtime.sendMessage({
    action: 'updateBadge',
    count: products.length
  });
});
