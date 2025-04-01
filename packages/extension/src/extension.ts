import * as vscode from 'vscode';
import {l10n} from 'vscode';
import { MainViewProvider } from './views/MainViewProvider';

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage(l10n.t('hello'));
    vscode.window.showInformationMessage(l10n.t('ciallo {0}', 'hiker'));
    const mainViewProvider = new MainViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            MainViewProvider.viewType,
            mainViewProvider,
            {webviewOptions: { retainContextWhenHidden: true }}
        ),
    );

    const gotoSettings = vscode.commands.registerCommand('light-at.goto.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:himeditator.light-at');
    });
    context.subscriptions.push(gotoSettings);

    const gotoConfig = vscode.commands.registerCommand('light-at.goto.config', () => {
        vscode.window.showErrorMessage('Not implemented yet.');
    });
    context.subscriptions.push(gotoConfig);

    const sessionsLoad = vscode.commands.registerCommand('light-at.load.sessions', () => {
       vscode.window.showErrorMessage('Not implemented yet.');
    });
    context.subscriptions.push(sessionsLoad);

    const chatNew = vscode.commands.registerCommand('light-at.chat.new', () => {
        vscode.window.showErrorMessage('Not implemented yet.');
    });
    context.subscriptions.push(chatNew);
}

export function deactivate() {}
