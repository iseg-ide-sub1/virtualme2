import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';


import { Configuration } from './utils/Configuration';
import { RequestHandler } from './utils/RequestHandler';
import { ConfigModels } from './storage/ConfigModels';
import { ChatViewProvider } from './views/ChatViewProvider';

let configModels: ConfigModels;

export function activate(context: vscode.ExtensionContext) {
    
    const localDir = vscode.Uri.joinPath(vscode.Uri.file(os.homedir()),'/.light-at');
    const configUri = vscode.Uri.joinPath(localDir, 'config.json');
    const chatDir = vscode.Uri.joinPath(localDir, 'chat');

    configModels = new ConfigModels(configUri, context);
    
    RequestHandler.configModels = configModels;

    const chatViewProvider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            chatViewProvider,
            {webviewOptions: { retainContextWhenHidden: true }}
        ),
    );

    const configurationChange = vscode.workspace.onDidChangeConfiguration(event => {
        if(event.affectsConfiguration(Configuration.sectionID)){
            Configuration.changeHandler(event);
        }
    });
    context.subscriptions.push(configurationChange);

    const gotoSettings = vscode.commands.registerCommand('light-at.goto.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:himeditator.light-at');
    });
    context.subscriptions.push(gotoSettings);

    const gotoConfig = vscode.commands.registerCommand('light-at.goto.config', () => {
        vscode.commands.executeCommand('vscode.open', configUri);
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
