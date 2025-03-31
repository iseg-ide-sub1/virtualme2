export interface UserDialogItem {
    id: string;
    content: string;
}

export interface ModelDialogItem {
    id: string;
    content: string;
    model: string;
    title: string;
}

export type DialogItem = UserDialogItem | ModelDialogItem;