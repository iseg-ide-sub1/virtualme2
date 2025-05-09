import * as childProcess from "node:child_process";
import { exec } from "node:child_process";
import * as path from "node:path";

import { Range } from ".";
import { EXTENSION_NAME } from "./config/default";
import { walkDir } from "./indexing/walkDir";
import {
  getContinueGlobalPath,
} from "./utils/paths";
import * as vscode from "vscode";

import { DiffManager } from "./diff/horizontal";
import { Repository } from "./utils/git";
import { VsCodeIdeUtils } from "./utils/ideutils";
import {
  getExtensionUri,
  openEditorAndRevealRange,
  uriFromFilePath,
} from "./utils/vscode";
import { VsCodeWebviewProtocol } from "./webviewProtocol";

import type {
  ContinueRcJson,
  FileType,
  IDE,
  IdeInfo,
  IdeSettings,
  IndexTag,
  Location,
  Problem,
  RangeInFile,
  Thread,
} from ".";

class VsCodeIde implements IDE {
  ideUtils: VsCodeIdeUtils;

  constructor(
    private readonly diffManager: DiffManager,
    private readonly vscodeWebviewProtocolPromise: Promise<VsCodeWebviewProtocol>,
    private readonly context: vscode.ExtensionContext,
  ) {
    this.ideUtils = new VsCodeIdeUtils();
  }

  pathSep(): Promise<string> {
    return Promise.resolve(this.ideUtils.path.sep);
  }
  async fileExists(filepath: string): Promise<boolean> {
    const absPath = await this.ideUtils.resolveAbsFilepathInWorkspace(filepath);
    return vscode.workspace.fs.stat(uriFromFilePath(absPath)).then(
      () => true,
      () => false,
    );
  }

  onDidChangeActiveTextEditor(callback: (filepath: string) => void): void {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        callback(editor.document.uri.fsPath);
      }
    });
  }

  private authToken: string | undefined;
  private askedForAuth = false;

  showToast: IDE["showToast"] = async (...params) => {
    const [type, message, ...otherParams] = params;
    const { showErrorMessage, showWarningMessage, showInformationMessage } =
      vscode.window;

    switch (type) {
      case "error":
        return showErrorMessage(message, "Show logs").then((selection) => {
          if (selection === "Show logs") {
            vscode.commands.executeCommand("workbench.action.toggleDevTools");
          }
        });
      case "info":
        return showInformationMessage(message, ...otherParams);
      case "warning":
        return showWarningMessage(message, ...otherParams);
    }
  };

  async getRepoName(dir: string): Promise<string | undefined> {
    const repo = await this.getRepo(vscode.Uri.file(dir));
    const remotes = repo?.state.remotes;
    if (!remotes) {
      return undefined;
    }
    const remote =
      remotes?.find((r: any) => r.name === "origin") ?? remotes?.[0];
    if (!remote) {
      return undefined;
    }
    const ownerAndRepo = remote.fetchUrl
      ?.replace(".git", "")
      .split("/")
      .slice(-2);
    return ownerAndRepo?.join("/");
  }

  async getTags(artifactId: string): Promise<IndexTag[]> {
    const workspaceDirs = await this.getWorkspaceDirs();

    const branches = await Promise.all(
      workspaceDirs.map((dir) => this.getBranch(dir)),
    );

    const tags: IndexTag[] = workspaceDirs.map((directory, i) => ({
      directory,
      branch: branches[i],
      artifactId,
    }));

    return tags;
  }

  getIdeInfo(): Promise<IdeInfo> {
    return Promise.resolve({
      ideType: "vscode",
      name: vscode.env.appName,
      version: vscode.version,
      remoteName: vscode.env.remoteName || "local",
      extensionVersion:
        vscode.extensions.getExtension("crt.repo-explorer")?.packageJSON
          .version,
    });
  }

  readRangeInFile(filepath: string, range: Range): Promise<string> {
    return this.ideUtils.readRangeInFile(
      filepath,
      new vscode.Range(
        new vscode.Position(range.start.line, range.start.character),
        new vscode.Position(range.end.line, range.end.character),
      ),
    );
  }

  async getLastModified(files: string[]): Promise<{ [path: string]: number }> {
    const pathToLastModified: { [path: string]: number } = {};
    await Promise.all(
      files.map(async (file) => {
        const stat = await vscode.workspace.fs.stat(uriFromFilePath(file));
        pathToLastModified[file] = stat.mtime;
      }),
    );

    return pathToLastModified;
  }

  async getRepo(dir: vscode.Uri): Promise<Repository | undefined> {
    return this.ideUtils.getRepo(dir);
  }

  async isTelemetryEnabled(): Promise<boolean> {
    const globalEnabled = vscode.env.isTelemetryEnabled;
    const continueEnabled: boolean =
      (await vscode.workspace
        .getConfiguration(EXTENSION_NAME)
        .get("telemetryEnabled")) ?? true;
    return globalEnabled && continueEnabled;
  }

  getUniqueId(): Promise<string> {
    return Promise.resolve(vscode.env.machineId);
  }

  async getDiff(includeUnstaged: boolean): Promise<string[]> {
    return await this.ideUtils.getDiff(includeUnstaged);
  }

  async getClipboardContent() {
    return this.context.workspaceState.get("continue.copyBuffer", {
      text: "",
      copiedAt: new Date("1900-01-01").toISOString(),
    });
  }

  async getTerminalContents(): Promise<string> {
    return await this.ideUtils.getTerminalContents(1);
  }

  async getDebugLocals(threadIndex: number): Promise<string> {
    return await this.ideUtils.getDebugLocals(threadIndex);
  }

  async getTopLevelCallStackSources(
    threadIndex: number,
    stackDepth: number,
  ): Promise<string[]> {
    return await this.ideUtils.getTopLevelCallStackSources(
      threadIndex,
      stackDepth,
    );
  }
  async getAvailableThreads(): Promise<Thread[]> {
    return await this.ideUtils.getAvailableThreads();
  }

  async getWorkspaceConfigs() {
    const workspaceDirs =
      vscode.workspace.workspaceFolders?.map((folder) => folder.uri) || [];
    const configs: ContinueRcJson[] = [];
    for (const workspaceDir of workspaceDirs) {
      const files = await vscode.workspace.fs.readDirectory(workspaceDir);
      for (const [filename, type] of files) {
        if (
          (type === vscode.FileType.File ||
            type === vscode.FileType.SymbolicLink) &&
          filename === ".continuerc.json"
        ) {
          const contents = await this.readFile(
            vscode.Uri.joinPath(workspaceDir, filename).fsPath,
          );
          configs.push(JSON.parse(contents));
        }
      }
    }
    return configs;
  }

  async listFolders(): Promise<string[]> {
    const allDirs: string[] = [];

    const workspaceDirs = await this.getWorkspaceDirs();
    for (const directory of workspaceDirs) {
      const dirs = await walkDir(directory, this, { onlyDirs: true });
      allDirs.push(...dirs);
    }

    return allDirs;
  }

  async getWorkspaceDirs(): Promise<string[]> {
    return this.ideUtils.getWorkspaceDirectories();
  }

  async getContinueDir(): Promise<string> {
    return getContinueGlobalPath();
  }

  async writeFile(path: string, contents: string): Promise<void> {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(path),
      Buffer.from(contents),
    );
  }

  async openFile(path: string): Promise<void> {
    await this.ideUtils.openFile(path);
  }

  async showLines(
    filepath: string,
    startLine: number,
    endLine: number,
  ): Promise<void> {
    const range = new vscode.Range(
      new vscode.Position(startLine, 0),
      new vscode.Position(endLine, 0),
    );
    openEditorAndRevealRange(filepath, range).then((editor) => {
      // Select the lines
      editor.selection = new vscode.Selection(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, 0),
      );
    });
  }

  async runCommand(command: string): Promise<void> {
    if (vscode.window.terminals.length) {
      const terminal =
        vscode.window.activeTerminal ?? vscode.window.terminals[0];
      terminal.show();
      terminal.sendText(command, false);
    } else {
      const terminal = vscode.window.createTerminal();
      terminal.show();
      terminal.sendText(command, false);
    }
  }

  async saveFile(filepath: string): Promise<void> {
    await this.ideUtils.saveFile(filepath);
  }

  private static MAX_BYTES = 100000;

  async readFile(filepath: string): Promise<string> {
    try {
      filepath = this.ideUtils.getAbsolutePath(filepath);
      const uri = uriFromFilePath(filepath);

      // First, check whether it's a notebook document
      // Need to iterate over the cells to get full contents
      const notebook =
        vscode.workspace.notebookDocuments.find(
          (doc) => doc.uri.toString() === uri.toString(),
        ) ??
        (uri.fsPath.endsWith("ipynb")
          ? await vscode.workspace.openNotebookDocument(uri)
          : undefined);
      if (notebook) {
        return notebook
          .getCells()
          .map((cell) => cell.document.getText())
          .join("\n\n");
      }

      // Check whether it's an open document
      const openTextDocument = vscode.workspace.textDocuments.find(
        (doc) => doc.uri.fsPath === uri.fsPath,
      );
      if (openTextDocument !== undefined) {
        return openTextDocument.getText();
      }

      const fileStats = await vscode.workspace.fs.stat(
        uriFromFilePath(filepath),
      );
      if (fileStats.size > 10 * VsCodeIde.MAX_BYTES) {
        return "";
      }

      const bytes = await vscode.workspace.fs.readFile(uri);

      // Truncate the buffer to the first MAX_BYTES
      const truncatedBytes = bytes.slice(0, VsCodeIde.MAX_BYTES);
      const contents = new TextDecoder().decode(truncatedBytes);
      return contents;
    } catch (e) {
      console.warn("Error reading file", e);
      return "";
    }
  }

  async openUrl(url: string): Promise<void> {
    await vscode.env.openExternal(vscode.Uri.parse(url));
  }

  async showDiff(
    filepath: string,
    newContents: string,
    stepIndex: number,
  ): Promise<void> {
    await this.diffManager.writeDiff(filepath, newContents, stepIndex);
  }

  async getOpenFiles(): Promise<string[]> {
    return await this.ideUtils.getOpenFiles();
  }

  async getCurrentFile() {
    if (!vscode.window.activeTextEditor) {
      return undefined;
    }
    return {
      isUntitled: vscode.window.activeTextEditor.document.isUntitled,
      path: vscode.window.activeTextEditor.document.uri.fsPath,
      contents: vscode.window.activeTextEditor.document.getText(),
    };
  }

  async getPinnedFiles(): Promise<string[]> {
    const tabArray = vscode.window.tabGroups.all[0].tabs;

    return tabArray
      .filter((t) => t.isPinned)
      .map((t) => (t.input as vscode.TabInputText).uri.fsPath);
  }

  private async _searchDir(query: string, dir: string): Promise<string> {
    const p = childProcess.spawn(
      path.join(
        getExtensionUri().fsPath,
        "node_modules",
        "@vscode",
        "ripgrep",
        "bin",
        "rg",
      ),
      //["-i", "-C", "2", "--", `${query}`, "."], //no regex
      ["-i", "-C", "2", "-e", `${query}`, "."], //use regex
      { cwd: dir },
    );
    let output = "";

    p.stdout.on("data", (data) => {
      output += data.toString();
    });

    return new Promise<string>((resolve, reject) => {
      p.on("error", reject);
      p.on("close", (code) => {
        if (code === 0 || code === 1) {
          resolve(output);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }

  async getSearchResults(query: string): Promise<string> {
    const results: string[] = new Array<string>();
    for (const dir of await this.getWorkspaceDirs()) {
      results.push(await this._searchDir(query, dir));
    }

    return results.join("\n\n");
  }

  async getProblems(filepath?: string | undefined): Promise<Problem[]> {
    const uri = filepath
      ? vscode.Uri.file(filepath)
      : vscode.window.activeTextEditor?.document.uri;
    if (!uri) {
      return [];
    }
    return vscode.languages.getDiagnostics(uri).map((d) => {
      return {
        filepath: uri.fsPath,
        range: {
          start: {
            line: d.range.start.line,
            character: d.range.start.character,
          },
          end: { line: d.range.end.line, character: d.range.end.character },
        },
        message: d.message,
      };
    });
  }

  async subprocess(command: string, cwd?: string): Promise<[string, string]> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
          reject(stderr);
        }
        resolve([stdout, stderr]);
      });
    });
  }

  async getBranch(dir: string): Promise<string> {
    return this.ideUtils.getBranch(vscode.Uri.file(dir));
  }

  getGitRootPath(dir: string): Promise<string | undefined> {
    return this.ideUtils.getGitRoot(dir);
  }

  async listDir(dir: string): Promise<[string, FileType][]> {
    return vscode.workspace.fs.readDirectory(uriFromFilePath(dir)) as any;
  }

  getIdeSettingsSync(): IdeSettings {
    const settings = vscode.workspace.getConfiguration(EXTENSION_NAME);
    const remoteConfigServerUrl = settings.get<string | undefined>(
      "remoteConfigServerUrl",
      undefined,
    );
    const ideSettings: IdeSettings = {
      remoteConfigServerUrl,
      remoteConfigSyncPeriod: settings.get<number>(
        "remoteConfigSyncPeriod",
        60,
      ),
      userToken: settings.get<string>("userToken", ""),
      enableControlServerBeta: settings.get<boolean>(
        "enableContinueForTeams",
        false,
      ),
      pauseCodebaseIndexOnStart: settings.get<boolean>(
        "pauseCodebaseIndexOnStart",
        false,
      ),
      enableDebugLogs: settings.get<boolean>("enableDebugLogs", false),
      // settings.get<boolean>(
      //   "enableControlServerBeta",
      //   false,
      // ),
    };
    return ideSettings;
  }

  async getIdeSettings(): Promise<IdeSettings> {
    return this.getIdeSettingsSync();
  }
}

export { VsCodeIde };
