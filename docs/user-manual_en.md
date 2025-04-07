# Light At User Manual

For plugin version v0.1.0

- [简体中文版](user-manual_zh-cn.md)
- [日本語版](user-manual_ja.md)

![](img/01.png)

## 📝 Configuring Models

### Configuring Models via Configuration File

Click the `Open Config` option in the upper right corner of the plugin interface to navigate to the plugin configuration file, where you can quickly configure chat models.

The configuration format is as follows:

```json
{
  "models": [
    {
      "id": "p_Xb-FcE7SeVgSG6SfdWB",
      "type": "ollama/openai",
      "model": "model name",
      "title": "display name",
      "baseURL": "https://model_base_url",
      "apiKey": "sk-********************************"
    }
  ]
}
```
- `id`: Required. A unique identifier for the model. Customize it to ensure it is different from other `id`s.
- `type`: Required. The type of the model, with possible values being `ollama` or `openai`. The former uses a locally configured model from [Ollama](https://github.com/ollama/ollama), while the latter uses the OpenAI library in node.js to call cloud-based models.
- `model`: Required. The name of the model, e.g., `llama3.3-70b-instruct`.
- `title`: Optional. The display name of the model. If not set, it defaults to the value of `model`.
- `baseURL`: Required if `type` is `openai`. The base URL for API requests, which depends on your model provider.
- `apiKey`: Required if `type` is `openai`. The API key, obtained from your model provider.

Here are some `baseURL`s for various providers:
- OpenAI: https://api.openai.com/v1
- DeepSeek: https://api.deepseek.com
- Alibaba Cloud: https://dashscope.aliyuncs.com/compatible-mode/v1

Here is a specific example:

```json
{
  "models": [
    {
      "id": "qwen2.5-no.001",
      "type": "ollama",
      "model": "qwen2.5",
      "title": "qwen2.5-7b"
    },
    {
      "id": "deepseek-r1-no.002",
      "type": "ollama",
      "model": "deepseek-r1"
    },
    {
      "id": "WyCSP4M3CZluzoNgNCm2k",
      "type": "openai",
      "model": "qwen-max",
      "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "apiKey": "sk-********************************"
    },
    {
      "id": "uXPF7fCW2paRZcVyfjURO",
      "model": "gpt-4o",
      "type": "openai",
      "baseURL": "https://api.openai.com/v1",
      "apiKey": "sk-proj-<omitted>"
    }
  ]
}
```

After creating the configuration file, hover over the `Select Model` option and click the `Load Config` option that appears to load the configured models.

### Configuring Models via Plugin

In the lower left corner of the plugin, hover over the `Select Model` option and click the `Add Model` option that appears. This will bring up an add model dialog. Fill in the relevant information and submit to add a model.

## 💬 Chatting

### Chat Options

Once the models are configured, you can start chatting. Enter content in the input box and press `Ctrl+Enter / Enter` or click the send option to send the chat content.

Click the `Add Context` option above the input box to add the content of files within the IDE as context. **Only files opened in the code editor are supported.**

Click on a file already added to the context to deselect it.

### Chat Management

Click the `Chat History` option in the upper right corner of the plugin interface to view the chat history files.

Click the `New Chat` option in the upper right corner of the plugin interface to start a new conversation.

### Chat Content

While the large model is generating content, you can click the `Stop Generation` option in the upper left corner of the input box to stop receiving the current response.

## ⚙️ Settings

Click the `Open Settings` option in the upper right corner of the plugin interface to access the plugin settings page.