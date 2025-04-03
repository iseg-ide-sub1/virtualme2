import * as vscode from 'vscode';

export class Configuration {
    private constructor() {}

    public static readonly sectionID = 'lightAt';

    public static get<T>(key: string): T | undefined {
        const configuration = vscode.workspace.getConfiguration(Configuration.sectionID);
        return configuration.get<T>(key);
    }

    public static changeHandler(event: vscode.ConfigurationChangeEvent) {
        if(event.affectsConfiguration('lightAt.loadLastChatSession')){
            
        }
        else if(event.affectsConfiguration('lightAt.continuousChat')){

        }
        else if(event.affectsConfiguration('lightAt.displayInfoMessage')){

        }
        else if(event.affectsConfiguration('lightAt.maxChatHistory')){

        }
        else if(event.affectsConfiguration('lightAt.sendRequestShortcut')){

        }
        else if(event.affectsConfiguration('lightAt.codeHighlightTheme')){

        }
    }
}