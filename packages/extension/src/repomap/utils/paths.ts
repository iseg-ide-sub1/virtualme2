import * as fs from "fs";
import * as os from "os";
import { pathToFileURL } from "url";
import * as path from "path";
import * as JSONC from "comment-json";
import dotenv from "dotenv";
import * as fsPromises from "fs/promises";

import { IdeType, SerializedContinueConfig } from "..";
import { defaultConfig, defaultConfigJetBrains } from "../config/default";

dotenv.config();

const CONTINUE_GLOBAL_DIR = path.join(os.homedir(), ".repo-explorer");

let REPOMAP_DIR: string | undefined;

export function getRepoMapPath(): string {
  if (!REPOMAP_DIR) {
    console.trace();
    throw new Error("RepoMapDir not set");
  }
  return REPOMAP_DIR;
}

export async function setRepoMapDir(dir: string): Promise<void> {
  REPOMAP_DIR = dir;
  await fsPromises.mkdir(REPOMAP_DIR, { recursive: true });
}

export const DEFAULT_CONFIG_TS_CONTENTS = `export function modifyConfig(config: Config): Config {
  return config;
}`;

export function getChromiumPath(): string {
  return path.join(getContinueUtilsPath(), ".chromium-browser-snapshots");
}

export function getContinueUtilsPath(): string {
  const utilsPath = path.join(getContinueGlobalPath(), ".utils");
  if (!fs.existsSync(utilsPath)) {
    fs.mkdirSync(utilsPath);
  }
  return utilsPath;
}

export function getGlobalContinueIgnorePath(): string {
  const continueIgnorePath = path.join(
    getContinueGlobalPath(),
    ".continueignore",
  );
  if (!fs.existsSync(continueIgnorePath)) {
    fs.writeFileSync(continueIgnorePath, "");
  }
  return continueIgnorePath;
}

/*
  Deprecated, replace with getContinueGlobalUri where possible
*/
export function getContinueGlobalPath(): string {
  // This is ~/.continue on mac/linux
  const continuePath = CONTINUE_GLOBAL_DIR;
  if (!fs.existsSync(continuePath)) {
    fs.mkdirSync(continuePath);
  }
  return continuePath;
}

export function getContinueGlobalUri(): string {
  return pathToFileURL(CONTINUE_GLOBAL_DIR).href;
}

export function getSessionsFolderPath(): string {
  const sessionsPath = path.join(getContinueGlobalPath(), "sessions");
  if (!fs.existsSync(sessionsPath)) {
    fs.mkdirSync(sessionsPath);
  }
  return sessionsPath;
}

export function getIndexFolderPath(): string {
  const indexPath = path.join(getRepoMapPath(), "index");
  if (!fs.existsSync(indexPath)) {
    fs.mkdirSync(indexPath);
  }
  return indexPath;
}

export function getGlobalContextFilePath(): string {
  return path.join(getIndexFolderPath(), "globalContext.json");
}

export function getSessionFilePath(sessionId: string): string {
  return path.join(getSessionsFolderPath(), `${sessionId}.json`);
}

export function getSessionsListPath(): string {
  const filepath = path.join(getSessionsFolderPath(), "sessions.json");
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify([]));
  }
  return filepath;
}

export function getConfigJsonPath(ideType: IdeType = "vscode"): string {
  const p = path.join(getContinueGlobalPath(), "config.json");
  if (!fs.existsSync(p)) {
    if (ideType === "jetbrains") {
      fs.writeFileSync(p, JSON.stringify(defaultConfigJetBrains, null, 2));
    } else {
      fs.writeFileSync(p, JSON.stringify(defaultConfig, null, 2));
    }
  }
  return p;
}

export function getConfigJsonUri(): string {
  return getContinueGlobalUri() + "/config.json";
}

export function getConfigJsPath(): string {
  // Do not create automatically
  return path.join(getContinueGlobalPath(), "out", "config.js");
}

export function getTsConfigPath(): string {
  const tsConfigPath = path.join(getContinueGlobalPath(), "tsconfig.json");
  if (!fs.existsSync(tsConfigPath)) {
    fs.writeFileSync(
      tsConfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            target: "ESNext",
            useDefineForClassFields: true,
            lib: ["DOM", "DOM.Iterable", "ESNext"],
            allowJs: true,
            skipLibCheck: true,
            esModuleInterop: false,
            allowSyntheticDefaultImports: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            module: "System",
            moduleResolution: "Node",
            noEmit: false,
            noEmitOnError: false,
            outFile: "./out/config.js",
            typeRoots: ["./node_modules/@types", "./types"],
          },
          include: ["./config.ts"],
        },
        null,
        2,
      ),
    );
  }
  return tsConfigPath;
}

export function getContinueRcPath(): string {
  // Disable indexing of the config folder to prevent infinite loops
  const continuercPath = path.join(getContinueGlobalPath(), ".continuerc.json");
  if (!fs.existsSync(continuercPath)) {
    fs.writeFileSync(
      continuercPath,
      JSON.stringify(
        {
          disableIndexing: true,
        },
        null,
        2,
      ),
    );
  }
  return continuercPath;
}

export function devDataPath(): string {
  const sPath = path.join(getContinueGlobalPath(), "dev_data");
  if (!fs.existsSync(sPath)) {
    fs.mkdirSync(sPath);
  }
  return sPath;
}

export function getDevDataSqlitePath(): string {
  return path.join(devDataPath(), "devdata.sqlite");
}

export function getDevDataFilePath(fileName: string): string {
  return path.join(devDataPath(), `${fileName}.jsonl`);
}

export function editConfigJson(
  callback: (config: SerializedContinueConfig) => SerializedContinueConfig,
): void {
  const config = fs.readFileSync(getConfigJsonPath(), "utf8");
  let configJson = JSONC.parse(config);
  // Check if it's an object
  if (typeof configJson === "object" && configJson !== null) {
    configJson = callback(configJson as any) as any;
    fs.writeFileSync(getConfigJsonPath(), JSONC.stringify(configJson, null, 2));
  } else {
    console.warn("config.json is not a valid object");
  }
}

function getMigrationsFolderPath(): string {
  const migrationsPath = path.join(getContinueGlobalPath(), ".migrations");
  if (!fs.existsSync(migrationsPath)) {
    fs.mkdirSync(migrationsPath);
  }
  return migrationsPath;
}

export async function migrate(
  id: string,
  callback: () => void | Promise<void>,
  onAlreadyComplete?: () => void,
) {
  if (process.env.NODE_ENV === "test") {
    return await Promise.resolve(callback());
  }

  const migrationsPath = getMigrationsFolderPath();
  const migrationPath = path.join(migrationsPath, id);

  if (!fs.existsSync(migrationPath)) {
    try {
      console.log(`Running migration: ${id}`);

      fs.writeFileSync(migrationPath, "");
      await Promise.resolve(callback());
    } catch (e) {
      console.warn(`Migration ${id} failed`, e);
    }
  } else if (onAlreadyComplete) {
    onAlreadyComplete();
  }
}

export function getIndexSqlitePath(): string {
  return path.join(getIndexFolderPath(), "index.sqlite");
}

export function getLanceDbPath(): string {
  return path.join(getIndexFolderPath(), "lancedb");
}

export function getTabAutocompleteCacheSqlitePath(): string {
  return path.join(getIndexFolderPath(), "autocompleteCache.sqlite");
}

export function getDocsSqlitePath(): string {
  return path.join(getIndexFolderPath(), "docs.sqlite");
}

export function getRemoteConfigsFolderPath(): string {
  const dir = path.join(getContinueGlobalPath(), ".configs");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
}

export function getPathToRemoteConfig(remoteConfigServerUrl: string): string {
  let url: URL | undefined = undefined;
  try {
    url =
      typeof remoteConfigServerUrl !== "string" || remoteConfigServerUrl === ""
        ? undefined
        : new URL(remoteConfigServerUrl);
  } catch (e) { }
  const dir = path.join(getRemoteConfigsFolderPath(), url?.hostname ?? "None");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
}

export function internalBetaPathExists(): boolean {
  const sPath = path.join(getContinueGlobalPath(), ".internal_beta");
  return fs.existsSync(sPath);
}

export function getConfigJsonPathForRemote(
  remoteConfigServerUrl: string,
): string {
  return path.join(getPathToRemoteConfig(remoteConfigServerUrl), "config.json");
}

export function getConfigJsPathForRemote(
  remoteConfigServerUrl: string,
): string {
  return path.join(getPathToRemoteConfig(remoteConfigServerUrl), "config.js");
}

export function getContinueDotEnv(): { [key: string]: string } {
  const filepath = path.join(getContinueGlobalPath(), ".env");
  if (fs.existsSync(filepath)) {
    return dotenv.parse(fs.readFileSync(filepath));
  }
  return {};
}

export function getLogsDirPath(): string {
  const logsPath = path.join(getContinueGlobalPath(), "logs");
  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath);
  }
  return logsPath;
}

export function getCoreLogsPath(): string {
  return path.join(getLogsDirPath(), "core.log");
}

export function getPromptLogsPath(): string {
  return path.join(getLogsDirPath(), "prompt.log");
}

export function getGlobalPromptsPath(): string {
  return path.join(getContinueGlobalPath(), "prompts");
}

export function readAllGlobalPromptFiles(
  folderPath: string = getGlobalPromptsPath(),
): { path: string; content: string }[] {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  const files = fs.readdirSync(folderPath);
  const promptFiles: { path: string; content: string }[] = [];
  files.forEach((file) => {
    const filepath = path.join(folderPath, file);
    const stats = fs.statSync(filepath);

    if (stats.isDirectory()) {
      const nestedPromptFiles = readAllGlobalPromptFiles(filepath);
      promptFiles.push(...nestedPromptFiles);
    } else {
      const content = fs.readFileSync(filepath, "utf8");
      promptFiles.push({ path: filepath, content });
    }
  });

  return promptFiles;
}

export function getRepoMapFilePath(): string {
  return path.join(getRepoMapPath(), "repomap.json");
}

export function getEsbuildBinaryPath(): string {
  return path.join(getContinueUtilsPath(), "esbuild");
}

export function setupInitialDotContinueDirectory() {
  const devDataTypes = [
    "chat",
    "autocomplete",
    "quickEdit",
    "tokens_generated",
  ];
  devDataTypes.forEach((p) => {
    const devDataPath = getDevDataFilePath(p);
    if (!fs.existsSync(devDataPath)) {
      fs.writeFileSync(devDataPath, "");
    }
  });
}