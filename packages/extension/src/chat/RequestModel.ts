import * as vscode from 'vscode';
import * as fs from 'fs';
import ollama from 'ollama';
import OpenAI from 'openai';
import { Model } from '../types/ConfigTypes';
import { ChatMessage, SessionItem } from '../types/ChatTypes';
import { Configuration } from '../utils/Configuration';
import { MessageSender } from '../utils/MessageSender';
import { ConfigModels } from '../storage/ConfigModels';

let nanoid: () => string;
(async () => {
    const nanoidModule = await import('nanoid');
    nanoid = nanoidModule.nanoid;
})();

export class RequestModel {
    chatMessages: ChatMessage[] = [];
    chatSession: SessionItem[] = [];
    model: Model | undefined;
    name: string = '';
    messageID: string = '';
    isRequesting: boolean = false;
    stopSign: boolean = false;
    constructor(
        public chatSessionDir: vscode.Uri,
        public configModels: ConfigModels
    ){
        if(!fs.existsSync(this.chatSessionDir.fsPath)){
            fs.mkdirSync(this.chatSessionDir.fsPath, {recursive: true});
        }
    }

    public pushSystemMessage(content: string){
        this.chatMessages.push({
            role: 'system',
            content: content
        });
        this.chatSession.push({
            role: 'system',
            id: '',
            content: content,
            time: new Date().toLocaleString()
        });
    }

    public pushUserMessage(content: string){
        this.chatMessages.push({
            role: 'user',
            content: content
        });
        this.chatSession.push({
            role: 'user',
            id: this.messageID,
            content: content,
            time: new Date().toLocaleString()
        });
    }

    public pushModelMessage(content: string, reasoning: string){
        this.chatMessages.push({ 'role': 'assistant', 'content': content});
        this.chatSession.push({
            role: 'assistant',
            id: this.messageID,
            content: content,
            time: new Date().toLocaleString(),
            name: this.name,
            type: this.model?.type,
            reasoning: reasoning
        });
    }

    public handleStop(){
        if(!this.isRequesting) { return; }
        this.stopSign = true;
    }

    public async handleRequest(request: string){
        console.log('handleRequest');
        if(this.isRequesting) { 
            vscode.window.showErrorMessage('Requesting... Try later.');
            this.stopSign = false;
            return;
        }
        this.model = this.configModels.getModel();
        if(!this.model){
            vscode.window.showErrorMessage('Model Not Found');
            return;
        }
        this.name = this.model.title ? this.model.title : this.model.model;
        this.messageID = nanoid();
        MessageSender.requestLoad(this.messageID, request);
        if(this.chatMessages.length === 0 && this.model.system){
            this.pushSystemMessage(this.model.system);
        }
        this.pushUserMessage(request);
        this.isRequesting = true;
        if(this.model.type === 'ollama'){
            this.requestOllama();
        }
        else if(this.model.type === 'openai'){
            this.requestOpenAI();
        }
    }
    
    public async requestOllama(){
        let responseContent = '';
        let reasoning = '';
        const continuousChat = Configuration.get<boolean>('continuousChat');
        const messages = continuousChat ? this.chatMessages : [this.chatMessages[this.chatMessages.length - 1]];
        MessageSender.responseNew(this.messageID, 'ollma', this.name);
        try{
            const response = await ollama.chat({
                model: this.model?.model || '',
                messages: messages,
                stream: true
            });
            for await (const part of response) {
                responseContent += part.message.content;
                MessageSender.responseStream(part.message.content, this.messageID);
                if(this.stopSign){
                    if(responseContent.startsWith('<think>') && responseContent.indexOf('</think>') >= 0){
                        const pos = responseContent.indexOf('</think>');
                        reasoning = responseContent.substring(0, pos + 8);
                        responseContent = responseContent.substring(pos + 8);
                    }
                    MessageSender.responseEnd(this.messageID);
                    this.pushModelMessage(responseContent, reasoning);
                    this.stopSign = false;
                    this.isRequesting = false;
                    return;
                }
            }
        } catch(error) {
            vscode.window.showErrorMessage('Request Error');
            // console.log(error);
            MessageSender.responseStream(` **${error}** `, this.messageID);
            MessageSender.responseEnd(this.messageID);
            this.pushModelMessage(`${error}`, reasoning);
            this.stopSign = false;
            this.isRequesting = false;
            return;
        }
        MessageSender.responseEnd(this.messageID);
        if(responseContent.startsWith('<think>') && responseContent.indexOf('</think>') >= 0){
            const pos = responseContent.indexOf('</think>');
            reasoning = responseContent.substring(0, pos + 8);
            responseContent = responseContent.substring(pos + 8);
        }
        this.pushModelMessage(responseContent, reasoning);
        this.stopSign = false;
        this.isRequesting = false;
    }

    public async requestOpenAI() {
        let responseContent = '';
        let reasoning = '';
        let isReasoning = false;
        const continuousChat = Configuration.get<boolean>('continuousChat');
        const messages = continuousChat ? this.chatMessages : [this.chatMessages[this.chatMessages.length - 1]];
        MessageSender.responseNew(this.messageID, 'openai', this.name);
        try {
            const openai = new OpenAI({
                apiKey: this.model?.apiKey || '',
                baseURL: this.model?.baseURL || ''
            });
            const completion = await openai.chat.completions.create({
                model: this.model?.model || '',
                messages: messages,
                stream: true
            });
            for await (const chunk of completion) {
                let content = '';
                const delta = chunk['choices'][0]['delta'];
                if('reasoning_content' in delta && delta['reasoning_content']){
                    if(!isReasoning){
                        content = '<think>\n';
                        isReasoning = true;
                    }
                    content += delta['reasoning_content'];
                    reasoning += content;
                }
                if(delta['content']){
                    if(isReasoning){
                        content += '\n</think>\n\n';
                        reasoning += '\n</think>\n\n';
                        isReasoning = false;
                    }
                    content += delta['content'];
                }
                responseContent += delta['content'];
                MessageSender.responseStream(content, this.messageID);
                // console.log(chunk['choices'][0]['delta'], content);
                if(this.stopSign){
                    MessageSender.responseEnd(this.messageID);
                    this.pushModelMessage(responseContent, reasoning);
                    this.stopSign = false;
                    this.isRequesting = false;
                    return;
                }
            }
        } catch(error) {
            vscode.window.showErrorMessage('Request Error');
            MessageSender.responseStream(` **${error}** `, this.messageID);
            MessageSender.responseEnd(this.messageID);
            this.pushModelMessage(`${error}`, reasoning);
            this.stopSign = false;
            this.isRequesting = false;
            return;
        }
        MessageSender.responseEnd(this.messageID);
        this.pushModelMessage(responseContent, reasoning);
        this.stopSign = false;
        this.isRequesting = false;
    }

    public clearChatSession(){
        this.chatMessages = [];
        this.chatSession = [];
        MessageSender.chatNew();
    }
    
    // public deleteMessageID(messageID: string, view?: vscode.WebviewView) {
    //     for(let i = 0; i < this.chatSession.length; i++){
    //         if(this.chatSession[i]['iso_time'] === messageID && this.chatSession[i]['role'] === 'user') {
    //             view?.webview.postMessage({command: 'request.delete', id: messageID});
    //             this.chatSession.splice(i, 1);
    //             this.chatMessages.splice(i, 1);
    //         }
    //         if(this.chatSession[i]['iso_time'] === messageID && this.chatSession[i]['role'] === 'assistant') {
    //             view?.webview.postMessage({command: 'response.delete', id: messageID});
    //             this.chatSession.splice(i, 1);
    //             this.chatMessages.splice(i, 1);
    //             break;
    //         }
    //     }
    //     if(this.chatSession.length === 1 && this.chatSession[0]['role'] === 'system'){
    //         this.chatSession.splice(0, 1);
    //         this.chatMessages.splice(0, 1);
    //     }
    // }
}
