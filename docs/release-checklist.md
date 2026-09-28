# リリース前チェックリスト

> 2026-09-28 時点の棚卸し。`yarn build`（型チェック＋ビルド）と `cargo test` は通過済み。
> 足りないのは機能ではなく「リリース用の仕上げ」が中心。

## 必須（これが無いとリリースできない）

- [ ] **未コミットの変更を整理して `main` にマージする**
  - `feature/command-list-view` ブランチに未コミットの変更が残っている
  - `.playwright-mcp/` と `packmanager.png` は作業用ファイルなので、コミットせずに削除するか `.gitignore` に追加する
- [ ] **パック配信先のダミー URL を解消する**
  - `src/config.ts` の `REMOTE_PACK_BASE_URL` が `https://example.com/cheatly/packs` のまま
  - Python / JavaScript / VS Code パックの削除により、非同梱パックは現状ゼロなので実害は無い
  - ただし本番起動時にダミー URL へカタログ取得のリクエストが飛ぶ。今後も全パック同梱でいくなら配信の仕組みごと外す、配信するなら GitHub raw などの実 URL を設定する
- [ ] **アプリを終了する手段を用意し、ウインドウを閉じても常駐を維持する**
  - トレイアイコンにメニューが無く、「終了」の導線が無い
  - Tauri のデフォルトではウインドウを閉じるとアプリごと終了し、トレイ常駐が消える
  - 対応: `src-tauri/src/lib.rs` で閉じる操作を `hide` に置き換え、トレイに右クリックメニュー（開く / 終了）を追加する
- [ ] **アイコンを差し替える**
  - `src-tauri/icons/` が Tauri のデフォルトロゴのまま
  - アプリアイコンと、メニューバー用アイコン（macOS はモノクロのテンプレート画像が標準）を作る
  - `yarn tauri icon <元画像>` で各サイズを一括生成できる
- [ ] **アプリ名・メタ情報をテンプレートから直す**
  - `src-tauri/tauri.conf.json`: `productName` と ウインドウ `title` を `Cheatly` に直す
  - `src-tauri/Cargo.toml`: `description = "A Tauri App"`、`authors = ["you"]`
  - `src-tauri/src/lib.rs`: テンプレートの `greet` コマンドを削除する
- [ ] **コード署名と公証（notarization）**
  - 署名が無いと、ダウンロードした Mac で「開発元を確認できません」と起動を止められる
  - Apple Developer Program（$99/年）への登録が前提（ユーザー側の作業）

## 推奨（無くても出せる）

- [ ] **フォントを同梱する**: `index.html` が Google Fonts（JetBrains Mono）を読み込んでおり、オフライン時に取得できない
- [ ] **Dock アイコンを隠す**: メニューバーアプリなので `ActivationPolicy::Accessory` を設定する
- [ ] **フォーカスが外れたらコンパクトウインドウを閉じる**: メニューバーアプリの一般的な挙動
- [ ] **CSP を設定する**: `tauri.conf.json` の `security.csp` が `null`
- [ ] **テンプレートの残骸を消す**: ファビコンが `/vite.svg`、`public/` に `tauri.svg` / `vite.svg` が残っている
- [ ] **自動アップデート**: 直接配布なら `tauri-plugin-updater` が無いと更新版を届けられない

## Mac App Store で出す場合の追加項目

詳細は [monetization-plan.md](./monetization-plan.md) を参照。

- [ ] App Sandbox の entitlements を設定する（パックをダウンロードするなら `com.apple.security.network.client` も必要）
- [ ] プライバシーポリシーの URL を用意する（App Store Connect で必須）
- [ ] Pro 課金（IAP）を入れてから出すか、無料版として先に出すかを決める

## 進め方の提案

最初のリリースは直接配布（署名＋公証付き dmg）で「必須」を片付けるのが最短。
中でも「パック配信先の解消」と「終了メニュー＋閉じたら隠す」は手早く直せて効果が大きい。
