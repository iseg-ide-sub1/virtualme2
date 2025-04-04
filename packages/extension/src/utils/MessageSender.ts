import { request } from 'http';
import * as vscode from 'vscode';

export class MessageSender{
    public static view: vscode.WebviewView | undefined;

    public static languageSet(){
        MessageSender.view?.webview.postMessage({
            command:'language.set',
            lang: vscode.env.language
        });
    }
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

    public static requestLoad(requestID: string, content: string){
        MessageSender.view?.webview.postMessage({
            command:'request.load',
            requestID: requestID,
            content: content
        });
    }

    public static responseNew(requestID: string, type: string, name: string){
        MessageSender.view?.webview.postMessage({
            command:'response.new',
            requestID: requestID,
            type: type,
            name: name
        });
    }

    public static responseStream(content: string, requestID: string){
        MessageSender.view?.webview.postMessage({
            command:'response.stream',
            data: content,
            requestID: requestID
        });
    }

    public static responseEnd(requestID: string){
        MessageSender.view?.webview.postMessage({
            command:'response.end',
            requestID: requestID
        });
    }

    public static responseLoad(requestID: string, type: string, name: string, content: string){
        MessageSender.view?.webview.postMessage({
            command:'response.load',
            requestID: requestID,
            type: type,
            name: name,
            content: content
        });
    }

    public static chatNew(){
        MessageSender.view?.webview.postMessage({
            command:'chat.new'
        });
    }

    public static welcomeLoad(){
        MessageSender.view?.webview.postMessage({
            command:'welcome.load'
        });
    }
}