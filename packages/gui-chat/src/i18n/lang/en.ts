export default {
    input: {
        stopGeneration: "stop generation",
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
        pluginName: "Light At",
        reasoning: "reasoning content",
        copy: "copy",
        delete: "delete",
        welcomeMessage: "{think}\n\nSome models (e.g., DeepSeek) will generate reasoning content before answering questions. The generated reasoning content can be viewed or hidden by clicking the \"reasoning content\" option in the upper right corner.\n\n{_think}\n\nWelcome to Light At, an open-source lightweight intelligent assistant plugin designed specifically for VS Code. As an IDE intelligent assistant developed by one person, Light Assistant aims to provide you with a simple and personalized development assistance experience.\n\n- Flexible Model Configuration\n- Chat History Management\n- Mathematical Formula Rendering\n\n---\n\nFor more information, please refer to User Manual or visit the GitHub page.\n"
    }
}