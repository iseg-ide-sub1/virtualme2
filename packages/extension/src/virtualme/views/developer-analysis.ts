import * as vscode from 'vscode';
import {developerAnalyzeContextProvider, UserProfileType} from "../api/user-profile/developer-analyze-context-provider";

export class DeveloperAnalysisViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'virtualme.DeveloperAnalysisView';

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) {
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command == "basic-analysis") {
                webviewView.webview.postMessage({type: 'clearSummary'})
                developerAnalyzeContextProvider(UserProfileType.BASIC).then(r => {
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: r})
                }).catch(e => {
                    console.error(e.message? e.message: e)
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: e.message? e.message: e})
                })
            } else if (message.command == "ability-analysis") {
                webviewView.webview.postMessage({type: 'clearSummary'})
                developerAnalyzeContextProvider(UserProfileType.ABILITY).then(r => {
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: r})
                }).catch(e => {
                    console.error(e.message? e.message: e)
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: e.message? e.message: e})
                })
            } else if (message.command == "habit-analysis") {
                webviewView.webview.postMessage({type: 'clearSummary'})
                developerAnalyzeContextProvider(UserProfileType.HABIT).then(r => {
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: r})
                }).catch(e => {
                    console.error(e.message? e.message: e)
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: e.message? e.message: e})
                })
            } else if (message.command == "learn-analysis") {
                webviewView.webview.postMessage({type: 'clearSummary'})
                developerAnalyzeContextProvider(UserProfileType.LEARN).then(r => {
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: r})
                }).catch(e => {
                    console.error(e.message? e.message: e)
                    webviewView.webview.postMessage({type: 'clearSummary'})
                    webviewView.webview.postMessage({type: 'llmSummary', data: e.message? e.message: e})
                })
            }
        })
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/developer-analysis.js'));
        const plotlyUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/lib/plotly-3.0.0.min.js'));
        const markdownUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/lib/markdown-it.min.js'));

        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/res/media/developer-analysis.css'));

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
                <title>Developer Analysis</title>
            </head>
            <body>
            <div class="analysis-container">
                <button class="btn-sum" id="btn-developer-analysis-basic">基础信息</button>
                <button class="btn-sum" id="btn-developer-analysis-ability">能力分析</button>
                <button class="btn-sum" id="btn-developer-analysis-habit">行为习惯</button>
                <button class="btn-sum" id="btn-developer-analysis-learn">学习能力</button>
            </div>
                <div id="result-llm"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}