export default {
    input: {
        stopGeneration: "生成を停止",
        addContext: "コンテキストを追加",
        textarea: "ここに入力内容を入力してください...",
        selectModel: "モデルを選択",
        addModel: "モデルを追加",
        loadConfig: "コンフィグを読み込む"
    },
    popup: {
        addModel: "モデルを追加",
        deleteModel: "モデルを削除",
        openaiNote: "提供するモデルは、{a}OpenAIライブラリ{_a}のAPI と互換性がある必要があります。",
        ollamaNote: "すでにローカルに {a}Ollama{_a} をインストールし、対応するモデルを設定していることを確認してください。",
        deleteNote: "このモデルを削除してもよろしいですか。",
        yes: "はい",
        no: "いいえ",
        submit: "送信",
        cancel: "キャンセル"
    },
    dialog: {
        pluginName: "ライトアット",
        reasoning: "推論内容",
        copy: "コピー",
        delete: "削除する",
        welcomeMessage: "{think}\n一部のモデル（例：DeepSeek）は、質問に答える前に推論プロセス内容を生成します。生成された推論内容は、右上隅の「推論内容」オプションをクリックして表示または非表示にできます。\n{_think}\n\nLight At（ライトアット）へようこそ。これは VS Code 専用に設計されたオープンソースの軽量 AI アシスタントプラグインです。個人開発の IDE スマートアシスタントとして、Light At はあなたにシンプルでパーソナライズされた開発支援体験を提供することを目指しています。 \n\n- モデルの自由な設定\n- チャット履歴管理\n- 数式レンダリング\n\n---\n\n詳細情報はユーザーマニュアルまたはGitHubページをご覧ください。\n"
    }
}