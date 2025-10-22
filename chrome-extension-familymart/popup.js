// ポップアップUIの制御スクリプト

let detectedProducts = [];

// DOM要素
const detectBtn = document.getElementById('detectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const productCount = document.getElementById('productCount');
const messageDiv = document.getElementById('message');
const productListDiv = document.getElementById('productList');

// メッセージを表示
function showMessage(text, type = 'info') {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';

  // 5秒後に自動で消す（エラーメッセージ以外）
  if (type !== 'error') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

// 商品リストを表示
function displayProducts(products) {
  if (products.length === 0) {
    productListDiv.style.display = 'none';
    return;
  }

  productListDiv.style.display = 'block';
  productListDiv.innerHTML = '';

  products.forEach((product) => {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23ddd%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E'">
      <span class="product-name" title="${product.name}">${product.index}. ${product.name}</span>
    `;
    productListDiv.appendChild(item);
  });
}

// 商品を検出（リトライ機能付き）
async function detectProducts(retryCount = 0) {
  try {
    detectBtn.disabled = true;
    detectBtn.textContent = '🔍 検出中...';
    messageDiv.style.display = 'none';

    // 現在のタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // ファミリーマートのページかチェック
    if (!tab.url.includes('family.co.jp')) {
      showMessage('ファミリーマートのページで実行してください', 'error');
      detectBtn.disabled = false;
      detectBtn.textContent = '🔍 商品を検出';
      return;
    }

    // コンテンツスクリプトが読み込まれるまで少し待つ
    if (retryCount === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // コンテンツスクリプトにメッセージを送信
    chrome.tabs.sendMessage(tab.id, { action: 'getProducts' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error('エラー:', chrome.runtime.lastError);

        // コンテンツスクリプトが読み込まれていない場合、コンテンツスクリプトを注入
        if (retryCount === 0) {
          try {
            showMessage('コンテンツスクリプトを読み込み中...', 'info');
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });

            // 再度検出を試みる
            setTimeout(() => detectProducts(retryCount + 1), 1000);
            return;
          } catch (injectError) {
            console.error('スクリプト注入エラー:', injectError);
            showMessage('商品の検出に失敗しました。ページを再読み込みしてください。', 'error');
            detectBtn.disabled = false;
            detectBtn.textContent = '🔍 商品を検出';
            return;
          }
        } else {
          showMessage('商品の検出に失敗しました。ページを再読み込みしてください。', 'error');
          detectBtn.disabled = false;
          detectBtn.textContent = '🔍 商品を検出';
          return;
        }
      }

      if (response && response.products) {
        detectedProducts = response.products;
        productCount.textContent = detectedProducts.length;

        if (detectedProducts.length > 0) {
          showMessage(`${detectedProducts.length}個の商品を検出しました！`, 'success');
          downloadBtn.disabled = false;
          displayProducts(detectedProducts);
        } else {
          showMessage('商品が見つかりませんでした。F12キーを押してConsoleを確認してください。', 'error');
          downloadBtn.disabled = true;
          productListDiv.style.display = 'none';
        }
      }

      detectBtn.disabled = false;
      detectBtn.textContent = '🔍 商品を検出';
    });
  } catch (error) {
    console.error('エラー:', error);
    showMessage('エラーが発生しました: ' + error.message, 'error');
    detectBtn.disabled = false;
    detectBtn.textContent = '🔍 商品を検出';
  }
}

// 画像をダウンロード
async function downloadImages() {
  if (detectedProducts.length === 0) {
    showMessage('ダウンロードする商品がありません', 'error');
    return;
  }

  try {
    downloadBtn.disabled = true;
    downloadBtn.textContent = '⬇️ ダウンロード中...';

    let successCount = 0;
    let errorCount = 0;

    for (const product of detectedProducts) {
      try {
        // ファイル名を生成（商品名から安全なファイル名を作成）
        const safeName = product.name.replace(/[\\/*?:"<>|]/g, '_');
        const ext = product.imageUrl.split('.').pop().split('?')[0] || 'jpg';
        const filename = `famima_${String(product.index).padStart(2, '0')}_${safeName}.${ext}`;

        // 画像をダウンロード
        await chrome.downloads.download({
          url: product.imageUrl,
          filename: `famima_images/${filename}`,
          saveAs: false
        });

        successCount++;
        showMessage(`ダウンロード中... ${successCount}/${detectedProducts.length}`, 'info');
      } catch (error) {
        console.error(`ダウンロードエラー (${product.name}):`, error);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      showMessage(`✅ ${successCount}個の画像をダウンロードしました！`, 'success');
    } else {
      showMessage(`⚠️ ${successCount}個成功、${errorCount}個失敗`, 'error');
    }

    downloadBtn.disabled = false;
    downloadBtn.textContent = '⬇️ 画像をダウンロード';
  } catch (error) {
    console.error('ダウンロードエラー:', error);
    showMessage('ダウンロード中にエラーが発生しました: ' + error.message, 'error');
    downloadBtn.disabled = false;
    downloadBtn.textContent = '⬇️ 画像をダウンロード';
  }
}

// イベントリスナー
detectBtn.addEventListener('click', detectProducts);
downloadBtn.addEventListener('click', downloadImages);

// ポップアップが開かれたときに自動的に商品を検出
document.addEventListener('DOMContentLoaded', async () => {
  // 現在のタブを取得
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // ファミリーマートのページなら自動検出
  if (tab.url && tab.url.includes('family.co.jp/goods/newgoods')) {
    detectProducts();
  }
});
