import * as vscode from 'vscode';
import * as virtualmeChat from './virtualme-chat/virtualme-chat';

export async function activate(context: vscode.ExtensionContext) {
    virtualmeChat.activate(context);
}

export function deactivate() {
    virtualmeChat.deactivate();
}