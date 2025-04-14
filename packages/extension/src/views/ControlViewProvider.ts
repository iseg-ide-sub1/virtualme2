import * as vscode from 'vscode';

export class ControlViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'virtualme2.control';
    private _view?: vscode.WebviewView;
    constructor(
        private readonly _extensionUri: vscode.Uri
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VirtualMe2</title>
        </head>
        <body>
            等待集成.....
        </body>
        </html>`;
    }
}