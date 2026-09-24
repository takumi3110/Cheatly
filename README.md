# Cheatly

CLIコマンドのチートシートを、メニューバーから一瞬で引けるMacアプリ。

Linux / Vim / Git / cmd / Docker / PowerShell / Python / JavaScript / VS Code などのコマンドを「パック」単位で管理し、トレイアイコンからいつでも検索・呼び出しできる。

## 差別化ポイント

似たジャンルのツール（tldr pages, cheat.sh, Dash, CheatSheet など）と比べたときの強み。

- **常駐トレイUI**：ターミナルにコマンドを打つ必要がなく、トレイアイコンからクリック一発でコンパクトウインドウが開く
- **オフライン前提のパック管理**：同梱パック（Linux/Vim/Git）はネット接続なしで必ず使える。追加パックはダウンロードしてローカルに保持するので、以降はオフラインでも引ける
- **カタログの堅牢性**：配信先（パックカタログ）が落ちていても、同梱データだけで一覧・検索が成立する（`src/lib/packs.ts` の `fetchCatalog` はネットワーク → キャッシュ → 同梱の順でフォールバック）
- **GUIならではの入力補助**：コマンドの引数・フラグをフォームで組み立てられる `Builder` 機能があり、素のテキストチートシートより実行しやすい

tldr pages / cheat.sh はターミナル前提のCLI/HTTPツールで常駐UIを持たず、Dashはコマンドよりも言語・フレームワークのAPIドキュメント検索が主軸、CheatSheet/KeyCueはCLIコマンドではなくMacアプリのショートカットキー表示が専門。Cheatlyは「CLIコマンドを常駐GUIでオフライン検索する」という立ち位置で差別化している。

## 開発

Tauri + React + TypeScript（Vite）で構築。

```bash
npm run dev      # 開発サーバー
npm run build    # 型チェック + ビルド
npm run tauri    # Tauri CLI
```

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
