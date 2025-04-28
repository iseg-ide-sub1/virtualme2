import * as vscode from 'vscode';

export class MessageSender{
    public static view: vscode.WebviewView | undefined;

    public static languageSet(){
        MessageSender.view?.webview.postMessage({
            command: 'language.set',
            lang: vscode.env.language
        });
    }
}