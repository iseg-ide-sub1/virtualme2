import { Artifact, Edge } from "../virtualme/base/types/artifact";
import * as vscode from 'vscode';
import { RepoMapIndex } from "./indexing/RepoMapIndex";
import { Core } from "./core";
import { IDE } from ".";
import { DiffManager } from "./diff/horizontal";
import { VsCodeIde } from "./VsCodeIde";
import { VsCodeWebviewProtocol } from "./webviewProtocol";
import * as repoMapConfig from "./repoMapConfig";
import { _RepoMap_, REPOMAP_INIT_ERROR } from "./_repoMap_/_RepoMap_";
import { getRepoMapPath, setRepoMapDir } from "./utils/paths";
import * as path from "path";
import { SqliteDb } from "./indexing/refreshIndex";
import fs from "fs/promises";

/**
 * 代码地图，注意一个 RepoMap 对象只能被初始化一次
 */
export class RepoMap {
    private ide!: IDE;
    private repoMapIndex?: RepoMapIndex;
    private _repoMap_?: _RepoMap_;
    private _isInitialized = false;

    /**
     * RepoMap 构造器，注意一个 RepoMap 对象只能被初始化一次
     * @param context 请将 extension.ts 中 activate 函数的 context 参数传入
     */
    public constructor(
        private readonly context: vscode.ExtensionContext
    ) {
        let resolveWebviewProtocol: any = undefined;
        const webviewProtocolPromise = new Promise<VsCodeWebviewProtocol>(
            (resolve) => {
                resolveWebviewProtocol = resolve;
            },
        );

        const diffManager = new DiffManager(context);
        this.ide = new VsCodeIde(
            diffManager,
            webviewProtocolPromise,
            context,
        );
    }

    /**
     * 动态初始化，为当前仓库创建一个定时更新的代码地图，相关信息保存在 "仓库根目录/.repomap/"
     * @returns 0 表示成功
     */
    public async dynamicInit(): Promise<number> {
        if (this.isInitialized()) {
            throw new Error("RepoMap has been initialized");
        }

        // init .repomap dir
        await setRepoMapDir(path.join((await this.ide.getWorkspaceDirs())[0], ".repomap"));

        const core = new Core(this.ide, false);
        this._repoMap_ = await RepoMapIndex.init(this.ide, this.context.extensionPath);
        this.repoMapIndex = await RepoMapIndex.getInstance();
        await core.ReIndex(false);
        setInterval(async () => {
            await core.ReIndex(false);
        }, repoMapConfig.updateInterval);
        this._isInitialized = true;
        return 0;
    }

    /**
     * 静态初始化，加载指定路径下的代码地图文件，与当前仓库无关，不实时更新
     * @param JSONPath JSON 文件路径
     * @returns 0 表示成功
     */
    public async staticInit(JSONPath: string): Promise<number> {
        if (this.isInitialized()) {
            throw new Error("RepoMap has been initialized");
        }

        this._repoMap_ = await _RepoMap_.create(JSONPath)
        return 0;
    }

    /**
     * 获取代码地图初始化状态
     * @returns 代码地图是否初始化
     */
    public isInitialized(): boolean {
        return this._isInitialized
    }

    /**
     * 将当前代码地图导出为 JSON 文件
     * @param filePath JSON文件路径
     * @returns 0 表示成功
     */
    public async exportRepoMap(filePath: string): Promise<number> {
        if (!this._repoMap_) { throw REPOMAP_INIT_ERROR; }
        await this._repoMap_.printMap(filePath);
        return 0;
    }

    /**
     * 在代码地图中检索指定工件的相关工件，按层数从小到大排序
     * @param artifact 指定工件
     * @param depth 最大检索深度
     * @returns 相关工件
     */
    public async getRefs(artifact: Artifact, depth: number): Promise<Artifact[]> {
        if (!this._repoMap_) { throw REPOMAP_INIT_ERROR; }
        return this._repoMap_.getRefs(artifact, depth);
    }

    /**
     * 在代码地图中检索指定工件之间的关系，结果以子图（边的数组）形式返回
     * @param a 工件 a
     * @param b 工件 b
     * @param depth 最大检索深度
     * @returns 子图
     */
    public async getLinkInfo(a: Artifact, b: Artifact, depth: number): Promise<Edge[]> {
        if (!this._repoMap_) { throw REPOMAP_INIT_ERROR; }
        return this._repoMap_.getLinkInfo(a, b, depth);
    }

    /**
     * @deprecated 用于调试，清除当前仓库下动态生成的代码地图
     * @returns 0 表示成功
     */
    public async clear(): Promise<number> {
        // init .repomap dir
        const repoMapPath = path.join((await this.ide.getWorkspaceDirs())[0], ".repomap");
        try {
            await SqliteDb.close();
            await fs.rm(repoMapPath, { recursive: true, force: true });
            await fs.mkdir(repoMapPath, { recursive: true });
        } catch (error) {
            console.error(`Error deleting ${repoMapPath}: ${error}`);
            vscode.window.showErrorMessage(`Error deleting ${repoMapPath}: ${error}`);
        }
        return 0;
    }

    /**
     * 查询代码地图中记录的外部依赖包
     * @returns 已去重的外部依赖包
     */
    public async getExternalPackages(): Promise<string[]> {
        if (!this._repoMap_) { throw REPOMAP_INIT_ERROR; }
        return this._repoMap_.getExternalPackages();
    }
}