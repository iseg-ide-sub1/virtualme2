export interface ModelConfig {
    id: string;
    type: 'openai' | 'ollama';
    model: string;
    title?: string;
    baseURL?: string;
    apiKey?: string;
    system?: string;
}
