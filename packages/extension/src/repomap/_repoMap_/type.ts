import Parser from "web-tree-sitter";
import { LanguageName } from "../utils/treeSitter";
import * as fs from 'fs';
import { getFileLineCount } from "./utils";
import { _RepoMap_ } from "./_RepoMap_";

export type AfterUpdate = (_repoMap_: _RepoMap_) => void;

export type MatchesHandler = (_repoMap_: _RepoMap_, matches: Parser.QueryMatch[], filepath: string) => void;

export type GetAstNodeName = (astNode: Parser.SyntaxNode) => string | undefined;

export type AstNodeHandler = Map<string, GetAstNodeName>;

export enum EdgeType {
    ENCAPSULATE = "encapsulate",
    IMPORT = "import",
    EXTEND = "extend",
    IMPLEMENT = "implement",
    OWN = "own",
    DEFINE = "define",
    INVOKE = "invoke",
    USE = "use",
    TYPEOF = "typeof",
}

export enum NodeType {
    FILE = "file",
    INTERFACE = "interface",
    CLASS = "class",
    METHOD = "method",
    FIELD = "field",
    CHUNK = "chunk"
}

export class NodeSummary {
    public constructor(
        readonly name: string,
        readonly type: NodeType,
        readonly lineBegin: number,
        readonly lineEnd: number,
    ) { }
}

// 不要给 MapNode 以及其所有子类添加成员方法，因为在 repoMap 的持续化存储和重载时会转为 any，丢失原型链和成员方法等信息
// 同理，谨慎使用 instanceof 来判断节点类型
export class MapNode {
    name!: string;
    path!: string;
    upperNodes!: NodeSummary[]; // 父节点
    type?: NodeType;
    description?: string;
    public constructor(name: string, path: string) {
        this.name = name;
        this.path = path;
        this.upperNodes = [];
    }
    public static getKey(mapNode: MapNode): string {
        return mapNode.name + "@" + mapNode.path;
    }
    public static equals(a: MapNode, b: MapNode): boolean {
        return this.getKey(a) === this.getKey(b);
    }
    public static getWholeLineBegin(wholeNode: MapNode): number {
        return StructNode.isStructNode(wholeNode) ? 1 : (wholeNode as CodeNode).lineBegin;
    }
    public static getWholwLineEnd(wholeNode: MapNode): number {
        return StructNode.isStructNode(wholeNode) ? getFileLineCount(wholeNode.path) : (wholeNode as CodeNode).lineEnd;
    }
    protected static WRONG_TYPE_ERROR = new Error("Wrong type");
}

export class StructNode extends MapNode {
    public constructor(name: string, path: string, type: NodeType, description?: string) {
        if (!StructNode.StructNodeTypes.includes(type)) { throw MapNode.WRONG_TYPE_ERROR; }
        super(name, path);
        this.type = type;
        this.description = description;
    }
    private static StructNodeTypes: NodeType[] = [NodeType.FILE];
    public static isStructNode(node: MapNode): boolean {
        return node.type !== undefined && this.StructNodeTypes.includes(node.type);
    }
}

export class CodeNode extends MapNode {
    lang!: LanguageName;
    lineBegin!: number;
    lineEnd!: number;
    public constructor(name: string, path: string, type: NodeType, lang: LanguageName, lineBegin: number, lineEnd: number, description?: string) {
        if (!CodeNode.CodeNodeTypes.includes(type)) { throw MapNode.WRONG_TYPE_ERROR; }
        super(name, path);
        this.type = type;
        this.description = description;
        this.lang = lang;
        this.lineBegin = lineBegin;
        this.lineEnd = lineEnd;
    }
    private static CodeNodeTypes: NodeType[] = [NodeType.INTERFACE, NodeType.CLASS, NodeType.METHOD, NodeType.FIELD];
    public static isCodeNode(node: MapNode): boolean {
        return node.type !== undefined && this.CodeNodeTypes.includes(node.type);
    }
    public static async getContent(codeNode: CodeNode): Promise<string> {
        const fileContent = await fs.readFileSync(codeNode.path, 'utf-8');
        const lines = fileContent.split('\n');
        return lines.slice(codeNode.lineBegin - 1, codeNode.lineEnd + 1).join('\n').trim();
    }
}

export class MapEdge {
    public constructor(
        readonly from: MapNode,
        readonly to: MapNode,
        readonly type: EdgeType,
    ) { }
    public equals(other: MapEdge): boolean { return MapNode.equals(this.from, other.from) && MapNode.equals(this.to, other.to) && this.type === other.type; }
}