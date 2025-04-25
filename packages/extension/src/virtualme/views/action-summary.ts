import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {exec} from 'child_process';
import ollama from 'ollama'
let prompt =
`
以下是收集的开发者在 IDE 内的动作数据日志，动作包括：
1. 对文件的操作（打开、关闭、新建、删除等）
2. 对具体文本内容的操作（新增、删除、选择、鼠标悬停等）

对日志进行总结，无需输出代码。
总结：开发者最近对项目进行了哪些修改，主要集中在哪些文件，修改的内容是什么。
`

import {codeDiffContextProvider} from "../api/action-summary/code-diff-context-provider";
import {terminalContextProvider} from "../api/action-summary/terminal-context-provider";
import {getEventSummary} from "../api/action-summary/event-summary";
import {WorkspaceFolder} from "vscode";
import {visualizeSummary} from "../api/action-summary/visualize-artifact";

export class ActionSummaryViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'virtualme.ActionSummaryView';
    private _view?: vscode.WebviewView;
    private readonly _eventPath: string
    private readonly _workspaceFolders: readonly WorkspaceFolder[]
    private readonly _summaryPath: string
    private readonly _selectedEventsPath: string
    private readonly _snapshotPath: string

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _logFolder: string
    ) {
        // 初始化相关路径
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder opened')
        }
        this._workspaceFolders = workspaceFolders
        this._eventPath = path.join(this._workspaceFolders[0].uri.fsPath, this._logFolder, 'event');
        this._summaryPath = path.join(this._workspaceFolders[0].uri.fsPath, this._logFolder, 'summary');
        if (!fs.existsSync(this._summaryPath)) {
            fs.mkdirSync(this._summaryPath, {recursive: true});
        }
        this._selectedEventsPath = path.join(this._summaryPath, 'selectedEvents.json')
        this._snapshotPath = path.join(this._workspaceFolders[0].uri.fsPath, this._logFolder, 'snapshot');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true, // 允许脚本
            localResourceRoots: [ // 允许装载资源的本地路径
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command === 'snapshots.abstract') { // 获取代码快照摘要
                webviewView.webview.postMessage({type: 'clearSummary'})
                codeDiffContextProvider().then(r => {
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: r})
                    }).catch(e => {
                    console.error(e)
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: e.message? e.message : e})
                })
            } else if (message.command === 'terminal.abstract') { // 获取终端摘要;
                webviewView.webview.postMessage({type: 'clearSummary'})
                terminalContextProvider().then(r => {
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: r})
                }).catch(e => {
                    console.error(e)
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: e.message? e.message : e})
                })
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {

        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/action-summary.js'));
        const plotlyUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/lib/plotly-3.0.0.min.js'));
        const markdownUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/lib/markdown-it.min.js'));

        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/action-summary.css'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <script src="${plotlyUri}"></script>
                <script src="${markdownUri}"></script>
                <title>Action Summary</title>
            </head>
            <body>
                <div class="sum-div">
<!--                    <button class="btn-sum" id="btn-sub1">可视化总结</button>-->
<!--                    <button class="btn-sum" id="btn-sub2">事件总结</button>-->
                    <button class="btn-sum" id="btn-terminal-sub">终端总结</button>
                    <button class="btn-sum" id="btn-snapshot-sub">代码变更总结</button>
                </div>
                <div id="result-llm"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}