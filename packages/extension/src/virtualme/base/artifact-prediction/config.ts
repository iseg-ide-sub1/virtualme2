// 训练每批序列数量,低于这个数量就不生成训练数据
import {EdgeType} from "../../../repomap/_repoMap_/type";
import {EventType} from "../types/event-types";
import {ArtifactType} from "../types/artifact";

export const maxSeqLen = 5
// 删除超过多少字符就触发负反馈
export const deleteFeedbackThreshold = 10
// 过去historyWindowSize个artifact作为historyArtifacts
export const historyWindowSize = 5
// 邻居工件获取的最大深度，超过这个深度就不再获取邻居工件，这是给repomap传参的，可以尽量大，保证充满邻居窗口
export const neighborDepth = 3
// 邻居工件获取的窗口大小，超过这个窗口大小就不再获取邻居工件
export const neighborWindowSize = 5
// 候选工件的最大数量，用于方案1
export const candidateMaxNum = historyWindowSize + neighborWindowSize
// 谱嵌入的k值，用于方案1
export const spectralK = 2
// 工件嵌入的长度，用于方案1
export const artifactEmbedSpeLength = spectralK * Object.values(EdgeType).length
// 工件嵌入的长度，用于方案2
export const artifactEmbedSimpLength = 2 * Object.values(EdgeType).length

export const predArtifactTypes = [
    ArtifactType.Class,
    ArtifactType.Function,
    ArtifactType.Method,
    ArtifactType.Interface,
]

export const predEventTypes = [
    EventType.AddTextDocument,
    EventType.DeleteTextDocument,
    EventType.RedoTextDocument,
    EventType.EditTextDocument,
    EventType.UndoTextDocument,
    EventType.SelectText,
    EventType.MouseHover,

    EventType.OpenTerminal,
    EventType.CloseTerminal,
    EventType.ChangeActiveTerminal,
    EventType.ExecuteTerminalCommand,

    EventType.OpenTextDocument,
    EventType.CloseTextDocument,
    EventType.ChangeTextDocument,
    EventType.CreateFile,
    EventType.DeleteFile,
    EventType.SaveFile,
    EventType.RenameFile,
    EventType.MoveFile,
    EventType.filesExplorer_copy,
    EventType.filesExplorer_cut,
    EventType.filesExplorer_paste,

    EventType.tab,
    EventType.undo,
    EventType.redo,
    EventType.acceptSelectedSuggestion,
    EventType.editor_action_formatDocument,
    EventType.selectNextSuggestion,
    EventType.selectPrevSuggestion,
    EventType.editor_action_clipboardCopyAction,
    EventType.editor_action_clipboardCutAction,
    EventType.editor_action_clipboardPasteAction,
    EventType.editor_action_selectAll,
]