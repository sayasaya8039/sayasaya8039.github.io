// ファミリーマート新商品画像ダウンローダー - コンテンツスクリプト

/**
 * ページから商品画像を抽出
 */
function extractProductImages() {
  const products = [];
  console.log('=== 画像検出開始 ===');

  // より具体的なセレクタパターン（商品リスト内の画像のみ）
  const selectors = [
    'ul.ly-mod-list4 > li > a > img',
    'ul.ly-mod-list4 > li img',
    'ul.ly-mod-list4 li img',
    'div.ly-mod-list4 li img',
    'ul.product-list > li > a > img',
    'ul.product-list > li img',
    'div.product-item > img',
    'div.product-item img',
    'ul.goodsList li img',
    'div.goodsList img',
    'section.newgoods li img',
    'section.newgoods img'
  ];

  let images = [];
  let usedSelector = null;

  // 各セレクタを試す
  for (const selector of selectors) {
    try {
      const found = document.querySelectorAll(selector);
      console.log(`セレクタ '${selector}': ${found.length} 個の画像`);

      // 適切な数（1～50個）の画像が見つかった場合のみ使用
      if (found.length > 0 && found.length <= 50 && images.length === 0) {
        images = found;
        usedSelector = selector;
      }
    } catch (e) {
      console.error(`セレクタエラー '${selector}':`, e);
    }
  }

  if (images.length === 0) {
    console.log('適切なセレクタが見つからなかったため、全画像から厳密にフィルタリングします');
    images = document.querySelectorAll('img');
    console.log(`ページ内の全画像数: ${images.length}`);
  } else {
    console.log(`使用セレクタ: '${usedSelector}' で ${images.length} 個の画像を発見`);
  }

  // 画像を処理
  let debugCount = 0;
  images.forEach((img, index) => {
    // 様々な属性から画像URLを取得
    const imgUrl = img.src ||
                   img.dataset.src ||
                   img.dataset.original ||
                   img.dataset.lazySrc ||
                   img.getAttribute('data-original') ||
                   img.getAttribute('data-lazy');

    // === 厳格なフィルタリング ===

    // URLが存在しない
    if (!imgUrl) {
      return;
    }

    // Chrome拡張機能の画像を除外（重要！）
    if (imgUrl.startsWith('chrome-extension://')) {
      return;
    }

    // データURL
    if (imgUrl.startsWith('data:image')) {
      return;
    }

    // デバッグ: family.co.jp ドメインの最初の20個の画像情報を詳細に出力
    const isFamilyDomain = imgUrl.includes('family.co.jp');
    if (isFamilyDomain && debugCount < 20) {
      console.log(`[family.co.jp] 画像 #${debugCount + 1}:`);
      console.log(`  src: ${imgUrl}`);
      console.log(`  alt: "${img.alt}"`);
      console.log(`  サイズ: ${img.width} x ${img.height}`);
      console.log(`  className: "${img.className}"`);
      console.log(`  親要素: ${img.parentElement?.tagName} (class: "${img.parentElement?.className}")`);
      console.log(`  祖父要素: ${img.parentElement?.parentElement?.tagName} (class: "${img.parentElement?.parentElement?.className}")`);
      console.log('---');
      debugCount++;
    }

    // URLに除外キーワードが含まれる
    const lowerUrl = imgUrl.toLowerCase();
    const excludeKeywords = [
      'icon', 'logo', 'banner', 'btn', 'button',
      'arrow', 'nav', 'header', 'footer', 'bg',
      'background', 'sprite', 'common', 'ui',
      'symbol', 'mark', 'badge', 'stamp'
    ];

    if (excludeKeywords.some(keyword => lowerUrl.includes(keyword))) {
      return;
    }

    // alt属性に除外キーワードが含まれる
    const lowerAlt = (img.alt || '').toLowerCase();
    const excludeAltKeywords = [
      'ファミリーマート', 'familymart', 'family mart',
      'ロゴ', 'logo', 'バナー', 'banner',
      'アイコン', 'icon', 'ボタン', 'button'
    ];

    if (excludeAltKeywords.some(keyword => lowerAlt.includes(keyword))) {
      return;
    }

    // サイズチェック（小さすぎる、または大きすぎる画像を除外）
    if (img.width > 0 && img.height > 0) {
      // 商品画像は通常 100x100 以上、800x800 以下
      if (img.width < 100 || img.height < 100) {
        return;
      }
      if (img.width > 800 || img.height > 800) {
        return;
      }
    }

    // 商品画像のURLパターンをチェック（family.co.jp のドメインで goods や product が含まれる）
    const isProductImageUrl = lowerUrl.includes('family.co.jp') &&
                              (lowerUrl.includes('goods') ||
                               lowerUrl.includes('product') ||
                               lowerUrl.includes('item') ||
                               lowerUrl.includes('/img/'));

    // 商品画像のURLパターンに合わない場合はスキップ
    if (!isProductImageUrl) {
      return;
    }

    // alt属性が空、または意味のない場合はスキップ
    const alt = img.alt || img.title || '';
    if (!alt || alt.trim() === '' || alt === ' ') {
      return;
    }

    // 商品名を取得
    const productName = alt;

    products.push({
      name: productName,
      imageUrl: imgUrl,
      index: products.length + 1
    });
  });

  console.log(`合計 ${products.length} 個の商品画像を検出`);

  // 検出された商品の詳細を表示
  console.log('=== 検出された商品一覧 ===');
  products.forEach((product, idx) => {
    if (idx < 10) {  // 最初の10個のみ
      console.log(`${idx + 1}. ${product.name}`);
      console.log(`   URL: ${product.imageUrl}`);
    }
  });
  if (products.length > 10) {
    console.log(`... 他 ${products.length - 10} 個`);
  }

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
