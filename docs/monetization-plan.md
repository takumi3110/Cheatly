# Cheatly マネタイズ計画（Mac App Store）

> ステータス: **検討・調査済み、実装は未着手（一時中断中）**
> 再開する時は、この文書の「次にやること」から着手する。

## 決定事項

- 配布先：**Mac App Store のみ**（Windows/Microsoft Store は今回スコープ外。将来やるなら別途検討）
- 課金モデル：**全パック一括の「Pro解除」買い切り**（非消費型 IAP を1商品だけ登録）
  - パック単位の個別課金・サブスクは不採用（実装・審査・UXの複雑さを避けるため）
- 現在の実装（`InstalledPacks` / `packs/*.json` / `PackManager.tsx` のダウンロード導線）は
  そのまま活かし、「同梱パック（Linux/Vim/Git）」と「非バンドルパック」の区別を
  「無料」と「Pro限定」に読み替える形で拡張する想定。

## 調査で分かったこと（2026年8月時点）

- **Tauri v2 は Mac App Store 配布を公式サポート**している。App Sandbox・署名entitlements・
  アップロード手順まで公式ドキュメントに手順あり。
  → https://v2.tauri.app/distribute/app-store/
- **StoreKit 用の Tauri プラグインが既に存在する**：`tauri-plugin-iap`（Choochmeque作）。
  macOS(StoreKit 2)・iOS・Android(Google Play Billing)・Windows(Microsoft Store) に対応。
  CI・サンプルアプリ付きで実運用されている。**自前でSwiftのネイティブブリッジを書く必要がない**。
  - GitHub: https://github.com/Choochmeque/tauri-plugin-iap
  - crates.io: https://crates.io/crates/tauri-plugin-iap/0.3.2
  - npm: `@choochmeque/tauri-plugin-iap-api`
  - 提供API: `getProducts`, `purchase`, `restorePurchases`, `acknowledgePurchase`,
    `consumePurchase`, `getProductStatus`, `onPurchaseUpdated`, `PurchaseState`
  - 注意: macOSビルド時は `MACOSX_DEPLOYMENT_TARGET` を13.0以上にする必要がある
    （Tauriのデフォルトはdebugビルドで11.0のため要調整）。

## ロードマップ

### Phase 0（ユーザー側の作業。コードでは代行できない）

- [ ] Apple Developer Program 登録（$99/年）
- [ ] Bundle ID を決定し、App Store Connect にアプリを新規登録
- [ ] IAP商品を1つ登録：**非消費型（Non-Consumable）**、Product ID例 `com.xxx.cheatly.pro`

### Phase 1（コード実装）

- [ ] `tauri-plugin-iap` を依存追加（Rust: `tauri-plugin-iap`、JS: `@choochmeque/tauri-plugin-iap-api`）
- [ ] `src-tauri/src/lib.rs` に `.plugin(tauri_plugin_iap::init())` を登録
- [ ] `src/lib/purchase.ts`（新規）：`getProducts` / `purchase` / `restorePurchases` /
      `getProductStatus` をラップし、`isPro()` のような単純なAPIをフロントに提供
- [ ] `src/components/PackManager.tsx`：非バンドルパックを「Pro限定」として扱う
      - 未購入時：🔒「Proで解除」ボタン（クリックで購入フロー起動）
      - 購入済み：従来通り「⤓ 取得」ボタン
- [ ] `src/App.tsx`：Pro購入状態をstateで保持し、起動時に `getProductStatus` / entitlements を確認
- [ ] Proへの導線（アップグレード訴求バナーなど）をどこかに追加

> Phase 1 は、App Store Connect の実商品IDが無くてもプレースホルダーIDで先行実装できる。
> Xcodeのローカル StoreKit Configuration File を使えば、審査前でも購入フローをサンドボックステストできる。

### Phase 2（Mac App Store 配布設定）

- [ ] App Sandbox entitlements 設定
- [ ] Team ID / App ID をコード署名entitlementsに設定
- [ ] `tauri.conf.json` の macOS バンドル設定をMac App Store向けに調整
      （公式ガイド通り。https://v2.tauri.app/distribute/app-store/ ）
- [ ] `.pkg` をビルドし、Transporter/Xcode で App Store Connect にアップロード

### Phase 3（審査提出）

- [ ] App Store Connect でレビュー提出（ユーザー側の作業）

## 次にやること

再開時にまず決めること：

1. Phase 0（Apple Developer登録）から始めるか、Phase 1（コード実装をプレースホルダーIDで先行）
   から並行して始めるか
2. Proの価格（買い切りでいくらにするか）
3. 「Pro」という呼び方や、アップグレード導線のUI/コピー
