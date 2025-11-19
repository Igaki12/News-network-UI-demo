# AGENTS_for_React

このドキュメントは `News-network-UI-demo` リポジトリで `commonsense-latest.html` の UI/挙動を **React + Vite + TypeScript + Chakra UI** + `vis-network` で 1:1 再現し、GitHub Pages で公開するためのガイドです。ルート直下に参照用として `reference/commonsense-latest.html` を配置し、実装との比較に利用します。既存の `AGENTS.md` ポリシー（JSONL は利用者アップロードのみ／バックアップ命名など）は本リポジトリでも必ず守ってください。

---

## 1. 開発スタックとビルドルール
- 本リポジトリ（`News-network-UI-demo`）は `npm create vite@latest . -- --template react-ts` で初期化済み。`reference/commonsense-latest.html` を常に残し、UI 差分確認に用います。
- GitHub Pages 公開向けに `vite.config.ts` の `base` を `'/News-network-UI-demo/'` に設定済み。  
- Chakra UI（`@chakra-ui/react` + Emotion + Framer Motion）を導入し、グローバルテーマで以下を再現：  
  - ルート変数：`--bg`, `--text`, `--muted`, `--edge`, `--glass-bg`, `--glass-border`, `--glass-shadow`, `--accent-glow`.  
  - ガラスモーフィズムカード（`hud-card`）と `cardReveal` / `contentFade` / `pulse-ring` アニメーション。  
  - 画面背景を `#network` で全面固定、HUD を `position: fixed` でオーバーレイ。
- `vis-network` は npm パッケージを使い、`import { DataSet, Network } from 'vis-network/standalone';` と `useEffect` + `useRef` で DOM 制御。
- `npm run build` → `dist/*` を `docs/` にコピーするビルドスクリプト（`"build": "tsc -b && vite build && rm -rf docs && mkdir -p docs && cp -R dist/* docs/"`）。GitHub Pages 上で `https://igaki12.github.io/News-network-UI-demo/` を確認。

---

## 2. レイアウト要件（HTML を 1:1 再現）

| 位置 | 要素 | React コンポーネント案 | 備考 |
|---|---|---|---|
| フルスクリーン背面 | 共起ネットワーク | `NetworkCanvas` | `div#network` を `absolute/fixed` で敷き、`vis-network` を初期化。 |
| 左上 HUD | タイトル / アップロード / 日付操作 / ランダム出題ボタン | `TopLeftPanel` | ファイル未読込時はアップロード領域のみ表示。読込後に日付ナビ＋`ランダムで問題を出題する` ボタンをフェードイン。 |
| 左下 HUD | ノード詳細 | `NodeDetailsCard` | クリック情報がない間は「気になるノードをクリックしたり…」の placeholder を表示。 |
| モーダル 1 | 記事詳細 + 理解度テスト | `ArticleModal` | Article View / Quiz View / Result View を Chakra `Tabs` ではなく、HTML 同様 `hidden` 切り替えで再現。 |
| モーダル 2 | ランダム確認問題 | `RandomQuizModal` | `random-question-btn` から起動。選択肢グリッドやフィードバック文言 (`正解です！`) を原文通りに。 |
| フッター固定 | 著作権 | `FooterBadge` | 「2025 © Happyman All rights reserved.」をそのまま配置。 |

### スタイル再現ポイント
- 背景色 `rgb(241 245 249)`、本文色 `rgb(15 23 42)`、サンセリフフォント列を Chakra の `global` スタイルで上書き。
- `hud-card`：`backdrop-filter`, `border: 1px solid var(--glass-border)`, `box-shadow: var(--glass-shadow)`。ホバー時の浮遊演出も同値。
- ファイルラベル、日付ボタン、プライマリボタン（`btn-primary`）の角丸、影、ホバー色 (`var(--accent-glow)`) を CSS カスタムで再注入。
- メディアクエリ (`max-width: 720px`) の padding 調整、モーダル `dialog` padding、`pulse-ring` キーフレームを Chakra の `keyframes` + `animation` で移植。

---

## 3. データ処理フロー（JSONL → Graph）

1. **アップロード**  
   - `<label class="file-label">` 内にネイティブの `<input type="file" accept=".jsonl">` を隠して配置し、クリックで `File.text()` → 行ごとに分割 → `JSON.parse` します。  
   - バリデーション：`date_id`, `named_entities`, `content` が揃っているレコードのみ採用。`articlesByDate`（`Record<string, Article[]>`）、`availableDates`（昇順）を構築。  
   - 「用意されているファイルを使用する」ボタンは `public/news_full_mcq3_type9_entities_novectors.jsonl` を `import.meta.env.BASE_URL` 経由で `fetch` し、ユーザー操作でのみ読み込む。  
   - 有効データが 1 件以上あれば：アップロード UI を `display: none`、日付ナビとランダム出題ボタンを表示。`NodeDetailsCard` も `display: block` に。

2. **状態管理**  
   ```ts
   type Article = {
     date_id: string;
     named_entities: string[];
     content: string;
     headline?: string;
     subject_codes?: { subject_matter?: string }[];
     questions?: Array<{ question: string; choices: string[] }>;
     news_item_id?: string;
   };
   ```
   - `allArticles: Article[]`
   - `articlesByDate: Record<string, Article[]>`
   - `availableDates: string[]`
   - `currentDateIndex: number`
   - `graphData: GraphPayload | null`
   - `nodeMeta: Record<string, NodeMeta>`
   - `details: string[]`
   - `articleModalData: { nodeId: string; article: Article; related: Article[] } | null`
   - `completedNodes: Set<string>`（GOOD 判定時に登録）
   - `randomState: { article: Article; question: QuizQuestion } | null`
   - `isRandomModalOpen: boolean`
   - `isLoadingData: boolean`
   - `maxNodes: number`（`window.innerWidth <= 720` なら 20、それ以外は 40）  
   クイズ進行中の state は `ArticleModal` 内部で完結させる。これらは上位コンポーネントで保持し、`useEffect` で依存データ（グラフなど）を再計算する。

3. **グラフ生成**  
   - `useEffect` 内で `buildGraphPayload(articles, maxNodes)` を呼び出し、記事配列から `GraphPayload` と `nodeMeta` を得る。  
   - `maxNodes` は画面幅に応じて 40（デスクトップ）/20（720px 以下）を切り替える。  
   - `entityCount`: 出現頻度マップ。`named_entities` の重複は `Set` で排除。`entitySubjectCounts` で `subject_codes[].subject_matter` のヒートマップを保持する。  
   - トップ `maxNodes` エンティティでノードを生成し、`palette` + `hash()` で主題ごとの背景色を決定。  
   - ノードサイズは `scaleValue(count, totalCount, topMaxCount)`（最小 12 / 最大 48、頻度比率と対数値の平均）で算出し、`value` に入れる。  
   - `edgeCounts`: 同一記事内での共起を `keyPair(a,b)`（昇順連結）で計数し、2 回以上のみ描画。  
   - `vis-network` `options`:
     ```ts
     const options = {
       interaction: { hover: true },
       physics: { stabilization: { iterations: 150 }, barnesHut: { gravitationalConstant: -4000 } },
       nodes: {
         shape: 'dot',
         font: { multi: 'html', size: 18, strokeWidth: 3, strokeColor: 'white' },
         scaling: { min: 12, max: 40 },
         borderWidth: 2,
       },
       edges: { color: { color: '#cccccc', highlight: '#b0b0b0' }, smooth: { enabled: true, type: 'continuous', roundness: 0.5 } },
     };
     ```
   - 初回だけ `new Network(container, data, options)`、以降は `network.setData(data)` で更新。  
   - `completedNodes` には正解済みノード ID を入れ、`requestAnimationFrame` で `shadow: { color: '#FFD700', size: 30 + 15 * sin(t) }` を継続適用。`useEffect` cleanup で `cancelAnimationFrame` する。

4. **ノードクリック → 詳細 & モーダル**  
   - クリック時に `params.nodes[0]` を取得し、`nodeMeta` を参照して `details` に ``${nodeId}: 出現回数 ${count}`` を表示（未選択時は空）。  
   - `relatedArticles`: 該当エンティティを含み `content.length > 50` の記事すべてを収集し、`ArticleModal` へ `related` として渡す。表示記事は `pickFeaturedArticle` で本文長上位 5 件からランダムに選ぶ（候補が無い場合はプール先頭）。  
   - 該当記事がなければ HUD に「詳細な関連記事が見つかりませんでした。」を追記し、モーダルは閉じる。

---

## 4. モーダル & クイズ挙動

### Article Modal
1. **Article View** （初期表示）  
   - `modalTitle = "関連ニュース: ${nodeId}"`  
   - 見出し／本文／「他の記事を読む」「理解度テストを始める」ボタン。  
   - `readAnotherBtn`: 現在記事以外で同条件を再検索し直す。候補が無い場合は `alert('他の記事が見つかりませんでした。')`。

2. **Quiz View**  
   - `startQuizBtn` 押下で `currentQuiz.article.questions` → `normalizeMultipleChoiceQuestion()` を実行。  
   - `normalizeMultipleChoiceQuestion` 仕様：  
     - `question` が文字列  
     - `choices` は文字列配列／空文字は除外  
     - 先頭要素のみ `isCorrect: true`  
   - 有効な設問が 0 件なら `finishQuiz(true)` を即時呼び出し、記事閲覧だけでクリア扱いにする。  
   - `shuffleArray` で選択肢を毎回シャッフル。  
   - `renderChoiceButtons`：Chakra `Button` を `grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))` で配置。  
   - 回答後は `handleChoiceSelection` ロジックを忠実に再現：  
     - ボタンを無効化  
     - 正解：選択肢に `.correct` クラスを付与、`currentQuiz.good++`  
     - 不正解：`.incorrect` + 正解のボタンを `.correct` に、`currentQuiz.bad++`  
     - `quizFeedback` に `正解です！` / `正解は「xxx」です。` を表示し 5 秒後に次の設問へ（終端なら `finishQuiz()`）。

3. **Result View**  
   - `finishQuiz(forceSuccess = false)`：正答数 >= 誤答数なら成功。  
   - 成功：`completedNodes.add(nodeId)` → 🎉 メッセージ → 2 秒後自動クローズ。  
   - 失敗：別記事を再提示（なければ `alert` 後モーダル閉じ）。  
   - `toggleArticleBtn`：クイズ中のみ表示し、記事本文の表示/非表示を切り替える。

### Random Quiz Modal
- `random-question-btn` → `handleRandomQuestion()`：  
  1. 現在日付が選択済みか確認。  
  2. `questions` を持つ記事だけ抽出。  
  3. 記事／問題をランダム選択 → `normalizeMultipleChoiceQuestion` で整形。  
  4. モーダル内に問題文＋選択肢グリッドを表示。  
  5. 結果は `randomFeedback` (`正解です！` or `正解は「xxx」です。`).  
  6. `random-open-article-btn` で記事モーダルを開く（エンティティ未指定の場合は `headline` などを暫定 ID に）。

---

## 5. 日付ナビ & HUD ロジック
- `availableDates` を昇順に並べ、初期値は最新日付。  
- `currentDateDisplay` には `YYYY-MM-DD` フォーマット（`20250115` → `2025-01-15`）。  
- `prev-date-btn` / `next-date-btn` は端で `disabled`。  
- 日付変更ごとに `buildGraphPayload` を再計算し、HUD 文言も更新。  
- JSONL 未読み込み時：  
  - `upload-container` 以外は `hidden` or `display: none`。  
  - `hudBottomLeft` は `display: none`。  
- 読み込み後：  
  - `upload-container` を `hidden`  
  - `date-container` を `hidden=false`  
  - `random-question-btn` を `display: block`  
  - `hudBottomLeft` を `display: block`

---

## 6. 仕上げと検証

1. **実装完了後チェック**  
   - JSONL ファイル（例：`public/news_full_mcq3_type9_entities_novectors.jsonl`）をアップロードし、HTML 版とのノード/エッジ件数・ランダム出題の挙動が一致するか手動比較。  
   - ノードクリック時に Article Modal→Quiz→Result が途切れないか、`read another` が働くかを確認。  
   - 完了ノードが金色に脈動し続けること（リロード後はリセットで OK）。  
   - スマホ幅（<=720px）で HUD padding, モーダル内余白が HTML と近似しているかを確認。

2. **GitHub Pages デプロイ確認**  
   - `npm run build` 後、生成された `docs/` をコミットして本リポジトリ（`main` ブランチ / `docs` フォルダ公開）へ push。  
   - `https://igaki12.github.io/News-network-UI-demo/` で動作＆ネットワークリソース（`vis-network` を含む）が 200 を返すかを DevTools で確認。

3. **注意事項**  
   - JSONL は利用者アップロードのみ（リポジトリ同梱データも、ユーザーが「用意されているファイルを使用する」を押したときだけ fetch する）。  
   - UI/コピーは `commonsense-latest.html` の表現をそのまま踏襲（文言・ボタン名・アラート文含む）。  
   - 将来の API 連携時にも差し替えやすいよう、データ読み込み・グラフ変換・クイズロジックをモジュール化しておく。

以上を満たす `Agents_for_React` ガイドに沿って Docs 上の React UI を完成させてから、VPS 連携へ進めてください。
