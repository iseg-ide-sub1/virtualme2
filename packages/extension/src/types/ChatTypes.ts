export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface SessionItem {
    role: 'system' | 'user' | 'assistant';
    id: string;
    content: string;
    time: string;
    name?: string;
    type?: 'ollama' | 'openai';
    reasoning?: string;
}