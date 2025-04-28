import * as vscode from "vscode";

import { VsCodeIde } from "../VsCodeIde";

const os = require("node:os");

function charIsEscapedAtIndex(index: number, str: string): boolean {
  if (index === 0) {
    return false;
  }
  if (str[index - 1] !== "\\") {
    return false;
  }
  return !charIsEscapedAtIndex(index - 1, str);
}

type Platform = "mac" | "linux" | "windows" | "unknown";

export function getPlatform(): Platform {
  const platform = os.platform();
  if (platform === "darwin") {
    return "mac";
  } else if (platform === "linux") {
    return "linux";
  } else if (platform === "win32") {
    return "windows";
  } else {
    return "unknown";
  }
}

export function getAltOrOption() {
  if (getPlatform() === "mac") {
    return "⌥";
  } else {
    return "Alt";
  }
}

export function getMetaKeyLabel() {
  const platform = getPlatform();
  switch (platform) {
    case "mac":
      return "⌘";
    case "linux":
    case "windows":
      return "^";
    default:
      return "^";
  }
}

export function getMetaKeyName() {
  const platform = getPlatform();
  switch (platform) {
    case "mac":
      return "Cmd";
    case "linux":
    case "windows":
      return "Ctrl";
    default:
      return "Ctrl";
  }
}

export function getExtensionVersion(): string {
  const extension = vscode.extensions.getExtension("crt.repo-explorer");
  return extension?.packageJSON.version || "0.1.0";
}

export function getFullyQualifiedPath(ide: VsCodeIde, filepath: string) {
  if (ide.ideUtils.path.isAbsolute(filepath)) { return filepath; }

  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders && workspaceFolders.length > 0) {
    return ide.ideUtils.path.join(workspaceFolders[0].uri.fsPath, filepath);
  }
}
