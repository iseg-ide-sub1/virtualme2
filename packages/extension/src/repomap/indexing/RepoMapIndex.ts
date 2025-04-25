import { IDE, IndexTag, IndexingProgressUpdate } from "..";
import { javaMatchesHandler } from "../_repoMap_/handlers/JavaHandler";
import { getFullLanguageName, getParserForFile, getQueryForFile, LanguageName } from "../utils/treeSitter";
import { CodebaseIndex, IndexResultType, MarkCompleteCallback, RefreshIndexResults } from "./types";
import { AfterUpdate, MatchesHandler } from "../_repoMap_/type";
import { _RepoMap_, REPOMAP_INIT_ERROR } from "../_repoMap_/_RepoMap_";
import { pythonMatchesHandler } from "../_repoMap_/handlers/PythonHandler";
import { getBasename } from "../utils/index";
import { pythonVirtualMeMatchesHandler } from "../_repoMap_/virtualMeHandlers/PythonHandler";
import { typeScriptAfterUpdate, typeScriptMatchesHandler } from "../_repoMap_/handlers/TypeScriptHandler";
import { typeScriptVirtualMeMatchesHandler } from "../_repoMap_/virtualMeHandlers/TypeScriptHandler";
import { javaScriptAfterUpdate, javaScriptMatchesHandler } from "../_repoMap_/handlers/JavaScriptHandler";
import { javaScriptVirtualMeMatchesHandler } from "../_repoMap_/virtualMeHandlers/JavaScriptHandler";

const matchesHandlers = new Map<LanguageName, MatchesHandler>([
    [LanguageName.JAVA, javaMatchesHandler],
    [LanguageName.PYTHON, pythonMatchesHandler],
    [LanguageName.TYPESCRIPT, typeScriptMatchesHandler],
    [LanguageName.JAVASCRIPT, javaScriptMatchesHandler],
]);

const afterUpdates = new Map<LanguageName, AfterUpdate>([
    [LanguageName.TYPESCRIPT, typeScriptAfterUpdate],
    [LanguageName.JAVASCRIPT, javaScriptAfterUpdate],
])

const virtualMeMatchesHandlers = new Map<LanguageName, MatchesHandler>([
    [LanguageName.PYTHON, pythonVirtualMeMatchesHandler],
    [LanguageName.TYPESCRIPT, typeScriptVirtualMeMatchesHandler],
    [LanguageName.JAVASCRIPT, javaScriptVirtualMeMatchesHandler],
]);

export class RepoMapIndex implements CodebaseIndex {
    artifactId: string = "repoMap";
    relativeExpectedTime: number = 1;

    /**
     * 可覆盖单例
     */
    private static instance: RepoMapIndex | undefined = undefined;
    private static extensionPath: string = __dirname;

    public static async init(ide: IDE, extensionPath: string, mapPath?: string): Promise<_RepoMap_> {
        if (!RepoMapIndex.instance) {
            RepoMapIndex.instance = new RepoMapIndex(ide);
            RepoMapIndex.instance._repoMap_ = await _RepoMap_.create(mapPath);
        }
        RepoMapIndex.extensionPath = extensionPath;
        return RepoMapIndex.instance._repoMap_!;
    }

    public static async getInstance(): Promise<RepoMapIndex> {
        if (!RepoMapIndex.instance) { throw REPOMAP_INIT_ERROR; }
        return RepoMapIndex.instance;
    }

    private _repoMap_: _RepoMap_ | undefined = undefined;

    private constructor(private readonly ide: IDE) {
    }

    async * update(tag: IndexTag, results: RefreshIndexResults, markComplete: MarkCompleteCallback, repoName: string | undefined): AsyncGenerator<IndexingProgressUpdate> {
        if (!this._repoMap_) { throw REPOMAP_INIT_ERROR; }

        // 这两个 tag 暂时用处不明
        markComplete(results.addTag, IndexResultType.AddTag);
        markComplete(results.removeTag, IndexResultType.RemoveTag);

        const lostEdges = this._repoMap_.updateStruct(results);
        await markComplete(results.del, IndexResultType.Delete);

        for (let i = 0; i < results.compute.length; i++) {
            const item = results.compute[i];
            const filepath = item.path;
            const contents = await this.ide.readFile(item.path);

            const language = getFullLanguageName(filepath);
            const matchesHandler: MatchesHandler | undefined = matchesHandlers.get(language);
            const parser = await getParserForFile(RepoMapIndex.extensionPath, filepath);
            if (!matchesHandler || !parser) {
                await markComplete([item], IndexResultType.Compute);
                continue;
            }
            const ast = parser.parse(contents);
            const query = await getQueryForFile(
                RepoMapIndex.extensionPath,
                filepath,
                `code-snippet-queries/${language}.scm`,
            );
            const matches = query?.matches(ast.rootNode);
            if (matches && matchesHandler) {
                matchesHandler(this._repoMap_, matches, filepath);
                this._repoMap_.addUpperNodes(filepath);
            }

            // add for VirtualMe
            const virtualMeQuery = await getQueryForFile(
                RepoMapIndex.extensionPath,
                filepath,
                `virtual-me-queries/${language}.scm`,
            );
            const virtualMematches = virtualMeQuery?.matches(ast.rootNode);
            const virtualMeMatchesHandler = virtualMeMatchesHandlers.get(language);
            if (virtualMematches && virtualMeMatchesHandler) {
                virtualMeMatchesHandler(this._repoMap_, virtualMematches, filepath);
            }
            // end

            await markComplete([item], IndexResultType.Compute);
            yield {
                desc: `adding ${getBasename(item.path)} to repoMap`,
                progress: i / results.compute.length,
                status: "indexing",
            };
        }
        afterUpdates.forEach(afterUpdate => afterUpdate(this._repoMap_!));
        // 恢复遗失的边
        lostEdges.forEach(edge => this._repoMap_!.addEdge(edge.from, edge.to, edge.type));
        this._repoMap_.deleteIllusion();
        this._repoMap_.printMap();
    }
}