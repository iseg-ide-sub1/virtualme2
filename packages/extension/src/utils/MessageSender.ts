import * as vscode from 'vscode';

export class MessageSender{
    public static view: vscode.WebviewView | undefined;

    public static modelsUpdate(models: string, modelID: string){
        MessageSender.view?.webview.postMessage({
            command:'models.update',
            models: models,
            modelID: modelID
        });
    }

    public static modelIDUpdated(modelID: string){
        MessageSender.view?.webview.postMessage({
            command:'modelID.updated',
            modelID: modelID
        });
    }
}