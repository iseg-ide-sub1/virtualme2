import * as vscode from 'vscode';
import { l10n } from 'vscode';
import * as os from 'os';

import { Configuration } from './utils/Configuration';
import { RequestHandler } from './utils/RequestHandler';
import { ConfigModels } from './storage/ConfigModels';
import { SessionManifest } from './storage/SessionManifest';
import { RequestModel } from './chat/RequestModel';
import { ChatViewProvider } from './views/ChatViewProvider';

let configModels: ConfigModels;
let requestModel: RequestModel;
let sessionManifest: SessionManifest;

export function activate(context: vscode.ExtensionContext) {
    const storageDir = vscode.Uri.joinPath(vscode.Uri.file(os.homedir()),'/.light-at');
    const configUri = vscode.Uri.joinPath(storageDir, 'config.json');
    const sesseionDir = vscode.Uri.joinPath(storageDir, 'chat');
    const manifestUri = vscode.Uri.joinPath(sesseionDir, 'manifest.json');

    configModels = new ConfigModels(configUri, context);
    requestModel = new RequestModel(configModels);
    sessionManifest = new SessionManifest(sesseionDir, manifestUri, requestModel);

    RequestHandler.configModels = configModels;
    RequestHandler.requestModel = requestModel;
    RequestHandler.sessionManifest = sessionManifest;

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
        const quickPick = vscode.window.createQuickPick();
        let sessionItems = [];
        for (let i = sessionManifest.manifest.length - 1; i >= 0; i--){
            const session = sessionManifest.manifest[i];
            sessionItems.push({
                label: session.overview,
                description: `$(clock) ${session.update}  $(folder) ${session.workspace}`,
                detail: session.name,
                buttons: [{iconPath: new vscode.ThemeIcon('trash'), tooltip: l10n.t('ts.deleteSession')}]
            });
        }
        quickPick.items = sessionItems;
        quickPick.onDidChangeSelection(selection => {
            if(selection[0]){
                sessionManifest.loadChatSession(selection[0].detail || '');
                quickPick.dispose();
            }
        });
        quickPick.onDidTriggerItemButton((event) => {
            if (event.button.tooltip === l10n.t('ts.deleteSession')) {
                sessionManifest.deleteChatSession(event.item.detail || '');
                sessionItems = [];
                for (let i = sessionManifest.manifest.length - 1; i >= 0; i--){
                    const session = sessionManifest.manifest[i];
                    sessionItems.push({
                        label: session.overview,
                        description: `$(clock) ${session.update}  $(folder) ${session.workspace}`,
                        detail: session.name,
                        buttons: [{iconPath: new vscode.ThemeIcon('trash'), tooltip: l10n.t('ts.deleteSession')}]
                    });
                }
                quickPick.items = sessionItems;
            }
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    });
    context.subscriptions.push(sessionsLoad);

    const chatNew = vscode.commands.registerCommand('light-at.chat.new', () => {
        sessionManifest.newChatSession();
    });
    context.subscriptions.push(chatNew);
}

export function deactivate() {
    sessionManifest.saveChatSession();
    sessionManifest.syncManifestWithFiles();
    sessionManifest.saveManifest();
}
