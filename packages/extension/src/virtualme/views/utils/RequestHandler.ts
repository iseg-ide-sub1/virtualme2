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
        }
    }

    private static prepareInit(){
        MessageSender.languageSet();
    }
}