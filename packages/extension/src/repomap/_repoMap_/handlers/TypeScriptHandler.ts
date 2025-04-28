import Parser from "web-tree-sitter"
import { MapNode, AstNodeHandler, MatchesHandler, EdgeType, CodeNode, NodeType, AfterUpdate, GetAstNodeName } from "../type";
import { _RepoMap_, mapNodeTypeConverter } from "../_RepoMap_";
import { LanguageName } from "../../utils/treeSitter";
import path from "path";
import { hasAncestor, hasNamedChild } from "../utils";
import fs from "fs";
import { Interface } from "readline";

// 用于标识默认导入
const DEFAULT: string = "$default";

// 记录默认导出的 文件-被导出的名称
let defaultRecord: Record<string, string> = {};

enum TypeScriptAstNodeType {
    INTERFACE_DECLARATION = "interface_declaration",
    CLASS_DECLARATION = "class_declaration",
    METHOD_DEFINITION = "method_definition",
    FUNCTION_DECLARATION = "function_declaration",
}

export const typeScriptAstNodeHandler: AstNodeHandler = new Map([
    [TypeScriptAstNodeType.INTERFACE_DECLARATION, (astNode: Parser.SyntaxNode): string | undefined => hasNamedChild("type_identifier", astNode)?.text],
    [TypeScriptAstNodeType.CLASS_DECLARATION, (astNode: Parser.SyntaxNode): string | undefined => hasNamedChild("type_identifier", astNode)?.text],
    [TypeScriptAstNodeType.METHOD_DEFINITION, (astNode: Parser.SyntaxNode): string | undefined => hasNamedChild("property_identifier", astNode)?.text],
    [TypeScriptAstNodeType.FUNCTION_DECLARATION, (astNode: Parser.SyntaxNode): string | undefined => hasNamedChild("identifier", astNode)?.text],
])

export const typeScriptMatchesHandler: MatchesHandler = (_repoMap_: _RepoMap_, matches: Parser.QueryMatch[], filepath: string): void => {
    const language: LanguageName = LanguageName.TYPESCRIPT;
    const currentFileNode: MapNode = new MapNode(filepath, filepath);
    const userDefinedContexts: Map<string, MapNode> = new Map();

    function getRelationNode(name: string): MapNode {
        const node: MapNode = userDefinedContexts.get(name) || new MapNode(name, filepath);
        _repoMap_.addNode(node);
        return node;
    }

    for (const match of matches) {
        const pattern = match.pattern;

        // class_declaration
        if (pattern === 0 || pattern === 9) {
            const definition = match.captures.find(c => c.name === "definition")?.node;
            const name = match.captures.find(c => c.name === "name")?.node.text;
            if (!name || !definition) {
                continue;
            }
            const node = new CodeNode(name, filepath, NodeType.CLASS, language, definition.startPosition.row, definition.endPosition.row);
            _repoMap_.updateNode(node);
            _repoMap_.addEdge(currentFileNode, node, EdgeType.ENCAPSULATE);
            const value = match.captures.find(c => c.name === "value")?.node.text;
            if (value) {
                _repoMap_.addEdge(node, getRelationNode(value), EdgeType.EXTEND);
            }
            const type = match.captures.find(c => c.name === "type")?.node.text;
            if (type) {
                _repoMap_.addEdge(node, getRelationNode(type), EdgeType.IMPLEMENT);
            }
        }

        // function_declaration && method_definition
        if (pattern === 1 || pattern === 2) {
            const name = match.captures.find(c => c.name === "name")?.node.text;
            const astNode = match.captures.find(c => c.name === "definition")?.node;
            if (!name || !astNode) {
                continue;
            }
            const node = new CodeNode(name, filepath, NodeType.METHOD, language, astNode.startPosition.row, astNode.endPosition.row);
            _repoMap_.updateNode(node);
            const ancestorAstNode = hasAncestor([TypeScriptAstNodeType.INTERFACE_DECLARATION, TypeScriptAstNodeType.CLASS_DECLARATION], astNode);

            if (ancestorAstNode) {
                const getAstNodeName = typeScriptAstNodeHandler.get(ancestorAstNode.type);
                if (ancestorAstNode && getAstNodeName) {
                    const ancestorName = getAstNodeName(ancestorAstNode);
                    if (ancestorName) {
                        _repoMap_.addEdge(getRelationNode(ancestorName), node, EdgeType.OWN);
                    }
                }
            } else {
                _repoMap_.addEdge(currentFileNode, node, EdgeType.OWN);
            }

            const type = match.captures.find(c => c.name === "type")?.node.text;
            if (type) {
                type.split(/\W+/).forEach((type) => {
                    _repoMap_.addEdge(node, getRelationNode(type), EdgeType.TYPEOF);
                })
            }
        }

        // interface_declaration
        if (pattern === 3) {
            const name = match.captures.find(c => c.name === "name")?.node.text;
            const astNode = match.captures.find(c => c.name === "definition")?.node;
            if (!name || !astNode) {
                continue;
            }
            const node = new CodeNode(name, filepath, NodeType.INTERFACE, language, astNode.startPosition.row, astNode.endPosition.row);
            _repoMap_.updateNode(node);
            _repoMap_.addEdge(currentFileNode, node, EdgeType.ENCAPSULATE);
            const type = match.captures.find(c => c.name === "type")?.node.text;
            if (type) {
                _repoMap_.addEdge(node, getRelationNode(type), EdgeType.EXTEND);
            }
        }

        // import_statement
        if (pattern === 4) {
            const source = match.captures.find(c => c.name === "source")?.node.text.slice(1, -1);
            if (!source || !source.startsWith('.')) {
                continue;
            }
            let name: string | undefined;
            let asName: string | undefined;
            const identifier = match.captures.find(c => c.name === "identifier")?.node.text;
            const importSpecifier = match.captures.find(c => c.name === "import_specifier")?.node.text;
            const namespaceImport = match.captures.find(c => c.name === "namespace_import")?.node.text;
            if (identifier) {
                name = DEFAULT;
                asName = identifier;
            } else if (importSpecifier) {
                const matches = /(.*) +as +(.*)/.exec(importSpecifier);
                name = matches?.[1] || importSpecifier;
                asName = matches?.[2] || importSpecifier;
            } else if (namespaceImport) {
                const matches = /(.*) +as +(.*)/.exec(namespaceImport);
                name = matches?.[1];
                asName = matches?.[2];
            }
            if (!name || !asName) {
                continue;
            }
            const suffixs: string[] = [".ts", ".d.ts", ".js", ".mjs"];
            let sourcePrefix: string = path.join(filepath, "..", source).split(".")[0];
            if (fs.existsSync(sourcePrefix) && fs.statSync(sourcePrefix).isDirectory()) {
                sourcePrefix = path.join(sourcePrefix, "index");
            }
            let sourcePath: string;
            for (const suffix of suffixs) {
                sourcePath = sourcePrefix + suffix;
                if (fs.existsSync(sourcePath)) {
                    const sourceNode = new MapNode(name, sourcePath);
                    _repoMap_.addNode(sourceNode);
                    _repoMap_.addEdge(currentFileNode, sourceNode, EdgeType.IMPORT);
                    userDefinedContexts.set(asName, sourceNode);
                }
            }
        }

        // export_statement
        if (pattern === 5) {
            const defaultExport = match.captures.find(c => c.name === "default_export")?.node;
            if (!defaultExport) {
                continue;
            }
            const getAstNodeName = typeScriptAstNodeHandler.get(defaultExport.type);
            let name: string | undefined;
            if (getAstNodeName) {
                name = getAstNodeName(defaultExport);
            } else if (defaultExport.type === "identifier") {
                name = defaultExport.text;
            }
            if (name) {
                defaultRecord[filepath] = name;
            }
        }

        // call_expression
        if (pattern === 6) {
            const name = match.captures.find(c => c.name === "name")?.node.text;
            const astNode = match.captures.find(c => c.name === "call_expression")?.node;
            if (!name || !astNode) {
                continue;
            }
            const ancestorAstNode = hasAncestor([TypeScriptAstNodeType.METHOD_DEFINITION, TypeScriptAstNodeType.FUNCTION_DECLARATION, TypeScriptAstNodeType.CLASS_DECLARATION], astNode);
            if (!ancestorAstNode) {
                continue;
            }
            const getAstNodeName = typeScriptAstNodeHandler.get(ancestorAstNode.type);
            if (!getAstNodeName) {
                continue;
            }
            const ancestorName = getAstNodeName(ancestorAstNode);
            if (!ancestorName) {
                continue;
            }
            _repoMap_.addEdge(getRelationNode(ancestorName), getRelationNode(name), EdgeType.INVOKE);
        }

        // public_field_definition
        if (pattern === 7) {
            const name = match.captures.find(c => c.name === "name")?.node.text;
            const astNode = match.captures.find(c => c.name === "definition")?.node;
            if (!name || !astNode) {
                continue;
            }
            const node = new CodeNode(name, filepath, NodeType.FIELD, language, astNode.startPosition.row, astNode.endPosition.row);
            _repoMap_.updateNode(node);
            const ancestorAstNode = hasAncestor([TypeScriptAstNodeType.CLASS_DECLARATION, TypeScriptAstNodeType.INTERFACE_DECLARATION], astNode);
            if (!ancestorAstNode) {
                continue;
            }
            const getAstNodeName = typeScriptAstNodeHandler.get(ancestorAstNode.type);
            if (!getAstNodeName) {
                continue;
            }
            const ancestorName = getAstNodeName(ancestorAstNode);
            if (!ancestorName) {
                continue;
            }
            _repoMap_.addEdge(getRelationNode(ancestorName), node, EdgeType.DEFINE);
        }

        // variable_declaration
        if (pattern === 8) {
            const astNode = match.captures.find(c => c.name === "declaration")?.node;
            const name = match.captures.find(c => c.name === "name")?.node.text;
            if (!astNode || !name) {
                continue;
            }
            const node = new CodeNode(name, filepath, NodeType.FIELD, language, astNode.startPosition.row, astNode.endPosition.row);
            _repoMap_.updateNode(node);
            _repoMap_.addEdge(currentFileNode, node, EdgeType.DEFINE);
        }
    }
}

export const typeScriptAfterUpdate: AfterUpdate = (_repoMap_: _RepoMap_): void => {
    for (const [filepath, name] of Object.entries(defaultRecord)) {
        const from = new MapNode(DEFAULT, filepath);
        if (!_repoMap_.hasNode(from)) {
            continue;
        }
        _repoMap_.copyEdges(from, new MapNode(name, filepath));
    }
    defaultRecord = {};
}
