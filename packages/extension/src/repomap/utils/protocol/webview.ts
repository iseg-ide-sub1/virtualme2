import type {
  ContextItemWithId,
  IndexingProgressUpdate,
  IndexingStatus,
  PackageDocsResult,
} from "../../index";

export type ToWebviewFromIdeOrCoreProtocol = {
  configUpdate: [undefined, void];
  getDefaultModelTitle: [undefined, string];
  indexProgress: [IndexingProgressUpdate, void]; // Codebase
  "indexing/statusUpdate": [IndexingStatus, void]; // Docs, etc.
  refreshSubmenuItems: [undefined, void];
  isContinueInputFocused: [undefined, boolean];
  addContextItem: [
    {
      historyIndex: number;
      item: ContextItemWithId;
    },
    void,
  ];
  setTTSActive: [boolean, void];
  getWebviewHistoryLength: [undefined, number];
  signInToControlPlane: [undefined, void];
  openDialogMessage: ["account", void];
  "docs/suggestions": [PackageDocsResult[], void];
};
