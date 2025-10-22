// ファミリーマート新商品画像ダウンローダー - バックグラウンドスクリプト

/**
 * コンテンツスクリプトからのメッセージをリスン
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    const count = request.count;

    // バッジのテキストを設定
    chrome.action.setBadgeText({
      text: count > 0 ? String(count) : '',
      tabId: sender.tab.id
    });

    // バッジの背景色を設定（5個以上の場合は緑、それ以外はグレー）
    chrome.action.setBadgeBackgroundColor({
      color: count >= 5 ? '#00a040' : '#999',
      tabId: sender.tab.id
    });

    // バッジのツールチップを設定
    chrome.action.setTitle({
      title: count >= 5
        ? `${count}個の新商品が見つかりました (ダウンロード可能)`
        : count > 0
        ? `${count}個の新商品が見つかりました (5個未満)`
        : 'ファミマ新商品画像ダウンローダー',
      tabId: sender.tab.id
    });
  }
});

/**
 * タブが更新されたときにバッジをクリア
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && !tab.url?.includes('family.co.jp/goods/newgoods/nextweek.html')) {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
    chrome.action.setTitle({ title: 'ファミマ新商品画像ダウンローダー', tabId: tabId });
  }
});
