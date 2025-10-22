// ファミリーマート新商品画像ダウンローダー - コンテンツスクリプト

/**
 * ページから商品画像を抽出
 */
function extractProductImages() {
  const products = [];
  console.log('=== 画像検出開始 ===');

  // より幅広いセレクタパターンを試す
  const selectors = [
    'ul.ly-mod-list4 li img',
    'ul.product-list li img',
    'div.product-item img',
    'li.item img',
    '.newgoods img',
    'article img',
    'div.goods img',
    '.item-list img',
    '.product img',
    'main img',
    '#main img',
    '.content img'
  ];

  let images = [];
  let usedSelector = null;

  // 各セレクタを試す
  for (const selector of selectors) {
    try {
      const found = document.querySelectorAll(selector);
      console.log(`セレクタ '${selector}': ${found.length} 個の画像`);

      if (found.length > 0 && images.length === 0) {
        images = found;
        usedSelector = selector;
      }
    } catch (e) {
      console.error(`セレクタエラー '${selector}':`, e);
    }
  }

  // セレクタで見つからない場合、すべてのimg要素を取得してフィルタリング
  if (images.length === 0) {
    console.log('セレクタで見つからなかったため、全画像を検索します');
    images = document.querySelectorAll('img');
    console.log(`ページ内の全画像数: ${images.length}`);
  } else {
    console.log(`使用セレクタ: '${usedSelector}' で ${images.length} 個の画像を発見`);
  }

  // 画像を処理
  images.forEach((img, index) => {
    // 様々な属性から画像URLを取得
    const imgUrl = img.src ||
                   img.dataset.src ||
                   img.dataset.original ||
                   img.dataset.lazySrc ||
                   img.getAttribute('data-original') ||
                   img.getAttribute('data-lazy');

    // デバッグ: 最初の数個の画像情報を出力
    if (index < 5) {
      console.log(`画像 #${index + 1}:`, {
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
        className: img.className,
        parent: img.parentElement?.tagName
      });
    }

    // フィルタリング条件
    if (!imgUrl) {
      return;
    }

    // データURL、小さなアイコン、ロゴなどをスキップ
    if (imgUrl.startsWith('data:image')) {
      return;
    }

    const lowerUrl = imgUrl.toLowerCase();
    if (lowerUrl.includes('icon') ||
        lowerUrl.includes('logo') ||
        lowerUrl.includes('banner') ||
        lowerUrl.includes('btn') ||
        lowerUrl.includes('arrow')) {
      return;
    }

    // サイズチェック（小さすぎる画像を除外）
    if (img.width > 0 && img.height > 0) {
      if (img.width < 80 || img.height < 80) {
        return;
      }
    }

    // 商品名を取得
    const productName = img.alt || img.title || `product_${products.length + 1}`;

    products.push({
      name: productName,
      imageUrl: imgUrl,
      index: products.length + 1
    });
  });

  console.log(`合計 ${products.length} 個の商品画像を検出`);
  console.log('検出された商品:', products);
  console.log('=== 画像検出終了 ===');

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
  console.log('ページ読み込み完了。画像検出を開始します...');

  // ページの動的コンテンツの読み込みを待つため、少し遅延
  setTimeout(() => {
    const products = extractProductImages();

    // バッジに商品数を表示
    chrome.runtime.sendMessage({
      action: 'updateBadge',
      count: products.length
    });
  }, 1000); // 1秒待機
});

// DOMContentLoadedでも試す（より早いタイミング）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: ページの初期読み込み完了');
  });
} else {
  console.log('ページは既に読み込まれています');
}
