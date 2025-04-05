import * as vscode from 'vscode';
import { MessageSender } from '../utils/MessageSender';

export class Configuration {
    private constructor() {}

    public static readonly sectionID = 'lightAt';

    public static get<T>(key: string): T | undefined {
        const configuration = vscode.workspace.getConfiguration(Configuration.sectionID);
        return configuration.get<T>(key);
    }

    public static sendSettings() {
        const settings = {
            welcomeInfo: Configuration.get<boolean>('displayInfoMessage'),
            sendShortcut: Configuration.get<string>('sendRequestShortcut') || 'Ctrl+Enter'
        };
        MessageSender.settingsUpdate(JSON.stringify(settings));
    }

    public static changeHandler(event: vscode.ConfigurationChangeEvent) {
        if(
            event.affectsConfiguration('lightAt.displayInfoMessage') ||
            event.affectsConfiguration('lightAt.sendRequestShortcut')
        ) {
            Configuration.sendSettings();
        }
    }
}