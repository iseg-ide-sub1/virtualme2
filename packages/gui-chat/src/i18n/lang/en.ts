export default {
    input: {
        selected: "[Selected Content]",
        searchConext: "Search Context",
        noContextInfo: "No context available. Please open the required text file in the editor and try again.",
        stopGeneration: "Stop Generation",
        addContext: "Add Context",
        textarea: "Enter content here...",
        selectModel: "Select Model",
        addModel: "Add Model",
        loadConfig: "Load Config"
    },
    popup: {
        addModel: "Add Model",
        deleteModel: "Delete Model",
        openaiNote: "The model you provided needs to be compatible with the {a}OpenAI API{_a}.",
        ollamaNote: "Please confirm that you have installed {a}Ollama{_a} locally and configured the corresponding model.",
        deleteNote: "Are you sure you want to delete this model?",
        yes: "Yes",
        no: "No",
        submit: "Submit",
        cancel: "Cancel"
    },
    dialog: {
        pluginName: "Virtualme Chat",
        reasoning: "reasoning content",
        copy: "copy",
        delete: "delete",
        prompt_tokens: "Number of Tokens consumed by the input",
        completion_tokens: "Number of Tokens consumed by the output",
        welcomeMessage: "{think}\n\nSome models (like DeepSeek) may generate reasoning content before answering a question. The generated reasoning content can be viewed or hidden by clicking the 'Reasoning Content' option in the upper right corner.\n\n{_think}\n\nWelcome to Virtualme Chat, an intelligent chat assistant for VS Code. Based on collected data, Virtualme Chat will provide you with a concise and personalized chat and development assistance experience.\n\n- Personalized chat based on developer behavior\n- Free model configuration\n- Chat history management\n- Mathematical formula rendering\n- Chat context selection\n\n---\n\nFor more information, please refer to the [User Manual]({manual}) or visit the [GitHub page]({github}).\n"
    }
}