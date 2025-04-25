import * as vscode from 'vscode';
import * as virtualmeChat from './virtualme-chat/virtualme-chat';
import * as virtualme from './virtualme/virtualme'

export async function activate(context: vscode.ExtensionContext) {
    virtualmeChat.activate(context);
    virtualme.activate(context).then(() => {
        console.log('VirtualMe activated');
    });
}

export function deactivate() {
    virtualmeChat.deactivate();
    virtualme.deactivate();
}