import * as vscode from 'vscode';
import * as virtualme from './virtualme/virtualme';
import * as virtualmeChat from './virtualme-chat/virtualme-chat';

export async function activate(context: vscode.ExtensionContext) {
    virtualme.activate(context).then(() => {
        console.log('VirtualMe activated');
    });
    virtualmeChat.activate(context);
}

export function deactivate() {
    virtualme.deactivate();
    virtualmeChat.deactivate();
}