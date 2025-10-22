// ファミリーマート新商品画像ダウンローダー - ポップアップスクリプト

let products = [];

/**
 * メッセージを表示
 */
function showMessage(text, type = 'success') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
}

/**
 * プログレスバーを更新
 */
function updateProgress(current, total) {
  const progressEl = document.getElementById('progress');
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');

  progressEl.style.display = 'block';
  progressText.textContent = `ダウンロード中: ${current} / ${total}`;
  progressFill.style.width = `${(current / total) * 100}%`;
}

/**
 * プログレスバーを非表示
 */
function hideProgress() {
  const progressEl = document.getElementById('progress');
  progressEl.style.display = 'none';
}

/**
 * ファイル名を安全な形式に変換
 */
function sanitizeFilename(name) {
  return name.replace(/[\\/*?:"<>|]/g, '_');
}

/**
 * 画像をダウンロード
 */
async function downloadImage(product, index, total) {
  return new Promise((resolve) => {
    // 拡張子を取得
    const url = new URL(product.imageUrl);
    const pathname = url.pathname;
    const ext = pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[0] || '.jpg';

    // ファイル名を生成
    const safeName = sanitizeFilename(product.name);
    const filename = `famima_${String(product.index).padStart(2, '0')}_${safeName}${ext}`;

    // ダウンロード実行
    // 最初の画像だけ保存先を選択、残りは自動的に同じフォルダに保存
    chrome.downloads.download({
      url: product.imageUrl,
      filename: `famima_images/${filename}`,
      saveAs: index === 0  // 最初の画像のみ保存先を選択
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error(`ダウンロード失敗 (${index + 1}/${total}) ${product.name}:`, chrome.runtime.lastError);
        updateProgress(index + 1, total);
        // エラーでも次の画像に進む
        setTimeout(() => resolve({ success: false, error: chrome.runtime.lastError }), 500);
      } else {
        console.log(`ダウンロード成功 (${index + 1}/${total}): ${filename}`);
        updateProgress(index + 1, total);
        // ダウンロード間隔を設けて、サーバーに負荷をかけないようにする
        setTimeout(() => resolve({ success: true, downloadId }), 500);
      }
    });
  });
}

/**
 * すべての画像をダウンロード
 */
async function downloadAllImages() {
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'ダウンロード中...';

  hideProgress();

  try {
    // 商品数チェック
    if (products.length < 5) {
      showMessage(`新商品が5個未満(${products.length}個)のため、ダウンロードできません。`, 'warning');
      downloadBtn.disabled = false;
      downloadBtn.textContent = '画像をダウンロード';
      return;
    }

    // ダウンロード開始
    updateProgress(0, products.length);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
      const result = await downloadImage(products[i], i, products.length);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    hideProgress();

    // 結果を表示
    if (failCount === 0) {
      showMessage(`${successCount}個の画像のダウンロードが完了しました！`, 'success');
    } else {
      showMessage(`ダウンロード完了: 成功 ${successCount}個、失敗 ${failCount}個`, 'warning');
    }

    downloadBtn.textContent = '画像をダウンロード';

  } catch (error) {
    hideProgress();
    showMessage(`エラーが発生しました: ${error.message}`, 'error');
    console.error('ダウンロードエラー:', error);
  } finally {
    downloadBtn.disabled = false;
  }
}

/**
 * ページから商品情報を取得
 */
async function loadProducts() {
  try {
    // 現在のタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // URLチェック（今週・来週の新商品ページ）
    const isValidUrl = tab.url.includes('family.co.jp/goods/newgoods.html') ||
                       tab.url.includes('family.co.jp/goods/newgoods/nextweek.html');

    if (!isValidUrl) {
      document.getElementById('mainContent').classList.add('hide');
      document.getElementById('errorPage').classList.add('show');
      return;
    }

    // コンテンツスクリプトから商品情報を取得
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProducts' });

    products = response.products;

    // UI更新
    const productCount = document.getElementById('productCount');
    productCount.textContent = `${products.length}個`;

    const downloadBtn = document.getElementById('downloadBtn');

    if (products.length === 0) {
      downloadBtn.textContent = '商品が見つかりません';
      downloadBtn.disabled = true;
      showMessage('ページに商品画像が見つかりませんでした。', 'error');
    } else if (products.length < 5) {
      downloadBtn.textContent = `画像をダウンロード (条件未達成)`;
      downloadBtn.disabled = false;
      showMessage(`新商品が${products.length}個見つかりましたが、5個未満のため条件を満たしていません。`, 'warning');
    } else {
      downloadBtn.textContent = '画像をダウンロード';
      downloadBtn.disabled = false;
      showMessage(`${products.length}個の新商品が見つかりました！ダウンロードできます。`, 'success');
    }

  } catch (error) {
    console.error('商品情報の取得に失敗:', error);
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.textContent = 'エラー';
    downloadBtn.disabled = true;
    showMessage('商品情報の取得に失敗しました。ページを再読み込みしてください。', 'error');
  }
}

// ページ読み込み時に商品情報を取得
document.addEventListener('DOMContentLoaded', loadProducts);

// ダウンロードボタンのクリックイベント
document.getElementById('downloadBtn').addEventListener('click', downloadAllImages);
