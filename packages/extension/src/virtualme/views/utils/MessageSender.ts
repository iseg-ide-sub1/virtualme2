import * as vscode from 'vscode';

export class MessageSender{
    public static view: vscode.WebviewView | undefined;

    public static languageSet(){
        MessageSender.view?.webview.postMessage({
            command: 'language.set',
            lang: vscode.env.language
        });
    }

    public static statusCurrent(status: boolean){
        MessageSender.view?.webview.postMessage({
            command: 'status.current',
            status: status
        });
    }

    public static logsNumber(num: number){ 
        MessageSender.view?.webview.postMessage({
            command: 'logs.number',
            num: num
        });
    }

    public static logsPrev(prev: string){ 
        MessageSender.view?.webview.postMessage({
            command: 'logs.prev',
            prev: prev
        });
    }
}