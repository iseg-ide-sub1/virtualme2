export default {
    input: {
        selected: "『选中的内容』",
        searchConext: "搜索上下文",
        noContextInfo: "暂无上下文，在编辑器中打开需要的文本文件后再试",
        stopGeneration: "停止生成",
        addContext: "添加上下文",
        textarea: "在此处输入内容...",
        selectModel: "选择模型",
        addModel: "添加模型",
        loadConfig: "加载配置"
    },
    popup: {
        addModel: "添加模型",
        deleteModel: "删除模型",
        openaiNote: "您提供的模型需要兼容{a}OpenAI库{_a}的API。",
        ollamaNote: "请确保您已经在本地安装了{a}Ollama{_a}，且配置了相应的模型。",
        deleteNote: "你确定要删除该模型吗？",
        yes: "是",
        no: "否",
        submit: "提交",
        cancel: "取消"
    },
    dialog: {
        pluginName: "Virtualme Chat",
        reasoning: "推理内容",
        copy: "复制",
        delete: "删除",
        prompt_tokens: "输入消耗的 Tokens 数量",
        completion_tokens: "输出消耗的 Tokens 数量",
        welcomeMessage: "{think}\n\n部分模型（比如 DeepSeek）可能会在回答问题之前生成推理过程内容。生成的推理内容可以点击右上角的“推理内容”选项查看或隐藏。\n\n{_think}\n\n欢迎使用 Virtualme Chat，一个面向 VS Code 的智能聊天助手。基于收集的数据，Virtualme Chat 将为您提供简洁、个性化的聊天和开发辅助体验。\n\n- 基于开发者行为的个性化聊天\n- 自由的配置模型\n- 聊天记录管理\n- 数学公式渲染\n- 聊天上下文选择\n\n---\n\n更多信息请参考[用户手册]({manual})或访问[GitHub页面]({github})。\n"
    }
}