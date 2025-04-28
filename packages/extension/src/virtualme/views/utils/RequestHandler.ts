import * as vscode from 'vscode';
// import { l10n } from 'vscode';
import { MessageSender } from './MessageSender';

export class RequestHandler {
    public static view: vscode.WebviewView | undefined;

    public static handleRequest(message: any) {
        console.log('@gui-control plugin receive:', JSON.stringify(message));
        switch (message.command) {
            case 'init.ready':
                RequestHandler.prepareInit();
                break;
            case 'status.set':
                RequestHandler.setStatus(message.status);
                break;
            case 'logs.save':
                RequestHandler.saveLogs();
                break;
        }
    }

    private static prepareInit() {
        MessageSender.languageSet();
    }

    private static setStatus(status: boolean) {
        if(status){
           vscode.commands.executeCommand('virtualme.start'); 
        }
        else{
            vscode.commands.executeCommand('virtualme.stop');
        }
        MessageSender.statusCurrent(status);
    }

    public static saveLogs() {
        vscode.commands.executeCommand('virtualme.savelog');
    }
}