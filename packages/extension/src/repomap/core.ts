import * as vscode from "vscode";
import { CodebaseIndexer, PauseToken } from "./indexing/CodebaseIndexer";

import type { IDE, IndexingProgressUpdate } from ".";
import { GlobalContext } from "./utils/GlobalContext";


export class Core {
  codebaseIndexerPromise: Promise<CodebaseIndexer>;
  codebaseIndexingState: IndexingProgressUpdate;
  globalContext = new GlobalContext();
  private codebaseIndexer: CodebaseIndexer;
  private indexingCancellationController: AbortController | undefined;
  private readonly indexingPauseToken = new PauseToken(
    this.globalContext.get("indexingPaused") === true,
  );

  constructor(
    private readonly ide: IDE,
    private readonly ifInitIndex: Boolean, //是否需要初始化索引
  ) {
    this.codebaseIndexingState = {
      status: "loading",
      desc: "loading",
      progress: 0,
    };

    // Codebase Indexer and ContinueServerClient depend on IdeSettings
    let codebaseIndexerResolve: (_: any) => void | undefined;
    this.codebaseIndexerPromise = new Promise(
      (resolve) => (codebaseIndexerResolve = resolve),
    );

    this.codebaseIndexer = new CodebaseIndexer(
      this.ide,
      this.indexingPauseToken,
    );
    console.log("CodebaseIndexer initialized");

    if (ifInitIndex) {
      // Index on initialization
      void this.ide.getWorkspaceDirs().then(async (dirs) => {
        console.log(`start refreshCodebaseIndex, dirs:${dirs}`);
        await this.refreshCodebaseIndex(dirs);
      });
    }
  }

  public async ReIndex(clearIndexes: Boolean) {
    try {
      if (clearIndexes) {
        console.log("Clear codebase indexing");
        try {
          await this.codebaseIndexer.clearIndexes();
          console.log("Cleared indexes successfully");
        } catch (error) {
          console.error("Error clearing indexes:", error);
          throw error;
        }
      }
      console.log("start reindexing codebase");
      const dirs = await this.ide.getWorkspaceDirs();
      await this.refreshCodebaseIndex(dirs);
      console.log("reindexing codebase succ");
    } catch (error) {
      console.error("ReIndex failed:", error);
      throw error;
    }
  }

  public async clearCodebaseIndex() {
    await this.codebaseIndexer.clearIndexes();
    console.log("Cleared indexes successfully");
  }

  private async refreshCodebaseIndex(paths: string[]) {
    if (this.indexingCancellationController) {
      this.indexingCancellationController.abort();
    }
    this.indexingCancellationController = new AbortController();
    for await (const update of this.codebaseIndexer.refreshDirs(
      paths,
      this.indexingCancellationController.signal,
    )) {
      let updateToSend = { ...update };
      if (update.status === "failed") {
        updateToSend.status = "done";
        updateToSend.desc = "Indexing complete";
        updateToSend.progress = 1.0;
      }

      this.codebaseIndexingState = updateToSend;
      // console.log(`update codebase index:${updateToSend.progress}, desc:${updateToSend.desc}`);

      if (update.status === "failed") {
        console.debug("Codebase indexing update failed\n");
      }
    }

    this.indexingCancellationController = undefined;
    console.log("end refreshCodebaseIndex");
  }


  // index/forceReIndexFiles
  // private async refreshCodebaseIndexFiles(files: string[]) {
  //   // Can be cancelled by codebase index but not vice versa
  //   if (
  //     this.indexingCancellationController &&
  //     !this.indexingCancellationController.signal.aborted
  //   ) {
  //     return console.debug(
  //       "Codebase indexing already in progress, skipping indexing of files\n" +
  //         files.join("\n"),
  //     );
  //   }
  //   this.indexingCancellationController = new AbortController();
  //   for await (const update of this.codebaseIndexer.refreshFiles(
  //     files,
  //   )) {
  //     let updateToSend = { ...update };
  //     if (update.status === "failed") {
  //       updateToSend.status = "done";
  //       updateToSend.desc = "Indexing complete";
  //       updateToSend.progress = 1.0;
  //     }

  //     this.codebaseIndexingState = updateToSend;

  //     if (update.status === "failed") {
  //        console.debug("Codebase indexing update failed\n");
  //     }
  //   }
  // }
}