import * as vscode from 'vscode';

import { MainViewProvider } from './views/MainViewProvider';

export function activate(context: vscode.ExtensionContext) {
    const mainViewProvider = new MainViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            MainViewProvider.viewType,
            mainViewProvider,
            {webviewOptions: { retainContextWhenHidden: true }}
        ),
    );
}

export function deactivate() {}
