import * as vscode from 'vscode';

export class MessageSender{
    public static view: vscode.WebviewView | undefined;
    public static logsNum: number = -1;
    public static prevLogs: string = '';

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
        if(num === MessageSender.logsNum) { return; }
        MessageSender.view?.webview.postMessage({
            command: 'logs.number',
            num: num
        });
        MessageSender.logsNum = num;
    }

    public static logsPrev(prev: string){ 
        if(prev === MessageSender.prevLogs) { return; }
        MessageSender.view?.webview.postMessage({
            command: 'logs.prev',
            prev: prev
        });
        MessageSender.prevLogs = prev;
    }
}