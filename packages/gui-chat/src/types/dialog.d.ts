export interface UserDialogItem {
    id: string;
    content: string;
}

export interface ModelDialogItem {
    id: string;
    content: string;
    type: 'ollama' | 'openai' | undefined;
    name: string;
}

export type DialogItem = UserDialogItem | ModelDialogItem;