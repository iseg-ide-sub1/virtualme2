import fs from "node:fs";
import path from "path";

import { FromWebviewProtocol, ToWebviewProtocol } from "./utils/protocol";
import { WebviewMessengerResult } from "./utils/protocol/util";
import { Message, IMessenger} from "./utils/messenger";
import { v4 as uuidv4 } from "uuid";
import * as vscode from "vscode";

export class VsCodeWebviewProtocol
  implements IMessenger<FromWebviewProtocol, ToWebviewProtocol> {
  listeners = new Map<
    keyof FromWebviewProtocol,
    ((message: Message) => any)[]
  >();

  send(messageType: string, data: any, messageId?: string): string {
    const id = messageId ?? uuidv4();
    this.webview?.postMessage({
      messageType,
      data,
      messageId: id,
    });
    return id;
  }

  on<T extends keyof FromWebviewProtocol>(
    messageType: T,
    handler: (
      message: Message<FromWebviewProtocol[T][0]>,
    ) => Promise<FromWebviewProtocol[T][1]> | FromWebviewProtocol[T][1],
  ): void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    this.listeners.get(messageType)?.push(handler);
  }

  _webview?: vscode.Webview;
  _webviewListener?: vscode.Disposable;

  get webview(): vscode.Webview | undefined {
    return this._webview;
  }

  set webview(webView: vscode.Webview) {
    this._webview = webView;
    this._webviewListener?.dispose();

    this._webviewListener = this._webview.onDidReceiveMessage(async (msg) => {
      if (!msg.messageType || !msg.messageId) {
        throw new Error(`Invalid webview protocol msg: ${JSON.stringify(msg)}`);
      }

      const respond = (message: WebviewMessengerResult<any>) =>
        this.send(msg.messageType, message, msg.messageId);

      const handlers = this.listeners.get(msg.messageType) || [];
      for (const handler of handlers) {
        try {
          const response = await handler(msg);
          if (
            response &&
            typeof response[Symbol.asyncIterator] === "function"
          ) {
            let next = await response.next();
            while (!next.done) {
              respond(next.value);
              next = await response.next();
            }
            respond({
              done: true,
              content: next.value?.content,
              status: "success",
            });
          } else {
            respond({ done: true, content: response || {}, status: "success" });
          }
        } catch (e: any) {
          respond({ done: true, error: e, status: "error" });

          console.error(
            `Error handling webview message: ${JSON.stringify(
              { msg },
              null,
              2,
            )}\n\n${e}`,
          );

          let message = e.message;
          if (e.cause) {
            if (e.cause.name === "ConnectTimeoutError") {
              message = `Connection timed out. If you expect it to take a long time to connect, you can increase the timeout in config.json by setting "requestOptions": { "timeout": 10000 }. You can find the full config reference here: https://docs.continue.dev/reference/config`;
            } else if (e.cause.code === "ECONNREFUSED") {
              message = `Connection was refused. This likely means that there is no server running at the specified URL. If you are running your own server you may need to set the "apiBase" parameter in config.json. For example, you can set up an OpenAI-compatible server like here: https://docs.continue.dev/reference/Model%20Providers/openai#openai-compatible-servers--apis`;
            } else {
              message = `The request failed with "${e.cause.name}": ${e.cause.message}. If you're having trouble setting up Continue, please see the troubleshooting guide for help.`;
            }
          }

          if (message.includes("https://proxy-server")) {
            message = message.split("\n").filter((l: string) => l !== "")[1];
            try {
              message = JSON.parse(message).message;
            } catch { }
            if (message.includes("exceeded")) {
              message +=
                " To keep using Continue, you can set up a local model or use your own API key.";
            }

            vscode.window
              .showInformationMessage(message, "Add API Key", "Use Local Model")
              .then((selection) => {
                if (selection === "Add API Key") {
                  this.request("addApiKey", undefined);
                } else if (selection === "Use Local Model") {
                  this.request("setupLocalConfig", undefined);
                }
              });
          } else {
            vscode.window
              .showErrorMessage(
                message.split("\n\n")[0],
                "Show Logs",
                "Troubleshooting",
              )
              .then((selection) => {
                if (selection === "Show Logs") {
                  vscode.commands.executeCommand(
                    "workbench.action.toggleDevTools",
                  );
                } else if (selection === "Troubleshooting") {
                  vscode.env.openExternal(
                    vscode.Uri.parse(
                      "https://docs.continue.dev/troubleshooting",
                    ),
                  );
                }
              });
          }
        }
      }
    });
  }

  constructor(private readonly reloadConfig: () => void) { }
  invoke<T extends keyof FromWebviewProtocol>(
    messageType: T,
    data: FromWebviewProtocol[T][0],
    messageId?: string,
  ): FromWebviewProtocol[T][1] {
    throw new Error("Method not implemented.");
  }

  onError(handler: (error: Error) => void): void {
    throw new Error("Method not implemented.");
  }

  public request<T extends keyof ToWebviewProtocol>(
    messageType: T,
    data: ToWebviewProtocol[T][0],
    retry: boolean = true,
  ): Promise<ToWebviewProtocol[T][1]> {
    const messageId = uuidv4();
    return new Promise(async (resolve) => {
      if (retry) {
        let i = 0;
        while (!this.webview) {
          if (i >= 10) {
            resolve(undefined);
            return;
          } else {
            await new Promise((res) => setTimeout(res, i >= 5 ? 1000 : 500));
            i++;
          }
        }
      }

      this.send(messageType, data, messageId);

      if (this.webview) {
        const disposable = this.webview.onDidReceiveMessage(
          (msg: Message<ToWebviewProtocol[T][1]>) => {
            if (msg.messageId === messageId) {
              resolve(msg.data);
              disposable?.dispose();
            }
          },
        );
      } else if (!retry) {
        resolve(undefined);
      }
    });
  }
}
