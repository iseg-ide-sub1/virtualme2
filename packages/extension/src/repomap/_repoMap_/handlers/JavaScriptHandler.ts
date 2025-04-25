import Parser from "web-tree-sitter"
import { MapNode, AstNodeHandler, MatchesHandler, EdgeType, CodeNode, NodeType, AfterUpdate, GetAstNodeName } from "../type";
import { _RepoMap_, mapNodeTypeConverter } from "../_RepoMap_";
import { LanguageName } from "../../utils/treeSitter";
import path from "path";
import { hasAncestor, hasNamedChild } from "../utils";
import fs from "fs";

const debug: Set<string> = new Set();

// 用于标识默认导入
const DEFAULT: string = "$default";

// 记录默认导出的 文件-被导出的名称
let defaultRecord: Record<string, string> = {};

enum JavaScriptAstNodeType {
    CLASS_DECLARATION = "class_declaration",
    METHOD_DEFINITION = "method_definition",
    FUNCTION_DECLARATION = "function_declaration",
}

export const javaScriptAstNodeHandler: AstNodeHandler = new Map([
    [JavaScriptAstNodeType.CLASS_DECLARATION, (astNode: Parser.SyntaxNode): string | undefined => hasNamedChild("identifier", astNode)?.text],
    [JavaScriptAstNodeType.METHOD_DEFINITION, (astNode: Parser.SyntaxNode): string | undefined => hasNamedChild("property_identifier", astNode)?.text],
    [JavaScriptAstNodeType.FUNCTION_DECLARATION, (astNode: Parser.SyntaxNode): string | undefined => hasNamedChild("identifier", astNode)?.text],
])

export const javaScriptMatchesHandler: MatchesHandler = (_repoMap_: _RepoMap_, matches: Parser.QueryMatch[], filepath: string): void => {
    const language: LanguageName = LanguageName.JAVASCRIPT;
    const currentFileNode: MapNode = new MapNode(filepath, filepath);
    const userDefinedContexts: Map<string, MapNode> = new Map();

    function getRelationNode(name: string): MapNode {
        const node: MapNode = userDefinedContexts.get(name) || new MapNode(name, filepath);
        _repoMap_.addNode(node);
        return node;
    }

    function importHandler(name: string, asName: string, source: string) {
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
    for (const match of matches) {
        const pattern = match.pattern;

        // class_declaration
        if (pattern === 0) {
            const definition = match.captures.find(c => c.name === "definition")?.node;
            const name = match.captures.find(c => c.name === "name")?.node.text;
            if (!name || !definition) {
                continue;
            }
            const node = new CodeNode(name, filepath, NodeType.CLASS, language, definition.startPosition.row, definition.endPosition.row);
            _repoMap_.updateNode(node);
            _repoMap_.addEdge(currentFileNode, node, EdgeType.ENCAPSULATE);

            const classHeritage = match.captures.find(c => c.name === "class_heritage")?.node.text;
            if (classHeritage) {
                _repoMap_.addEdge(node, getRelationNode(classHeritage), EdgeType.EXTEND);
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
            const ancestorAstNode = hasAncestor([JavaScriptAstNodeType.CLASS_DECLARATION], astNode);

            if (ancestorAstNode) {
                const getAstNodeName = javaScriptAstNodeHandler.get(ancestorAstNode.type);
                if (ancestorAstNode && getAstNodeName) {
                    const ancestorName = getAstNodeName(ancestorAstNode);
                    if (ancestorName) {
                        _repoMap_.addEdge(getRelationNode(ancestorName), node, EdgeType.OWN);
                    }
                }
            } else {
                _repoMap_.addEdge(currentFileNode, node, EdgeType.OWN);
            }
        }

        // import_statement
        if (pattern === 3) {
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
            importHandler(name, asName, source);
        }

        // export_statement
        if (pattern === 4) {
            const defaultExport = match.captures.find(c => c.name === "default_export")?.node;
            if (!defaultExport) {
                continue;
            }
            const getAstNodeName = javaScriptAstNodeHandler.get(defaultExport.type);
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
        if (pattern === 5) {
            const name = match.captures.find(c => c.name === "name")?.node.text;
            const astNode = match.captures.find(c => c.name === "call_expression")?.node;
            if (!name || !astNode) {
                continue;
            }
            const ancestorAstNode = hasAncestor([JavaScriptAstNodeType.METHOD_DEFINITION, JavaScriptAstNodeType.FUNCTION_DECLARATION, JavaScriptAstNodeType.CLASS_DECLARATION], astNode);
            if (!ancestorAstNode) {
                continue;
            }
            const getAstNodeName = javaScriptAstNodeHandler.get(ancestorAstNode.type);
            if (!getAstNodeName) {
                continue;
            }
            const ancestorName = getAstNodeName(ancestorAstNode);
            if (!ancestorName) {
                continue;
            }
            _repoMap_.addEdge(getRelationNode(ancestorName), getRelationNode(name), EdgeType.INVOKE);
        }

        // field_definition
        if (pattern === 6) {
            const astNode = match.captures.find(c => c.name === "field_definition")?.node;
            const property = match.captures.find(c => c.name === "property")?.node.text;
            if (!astNode || !property) {
                continue;
            }
            const node = new CodeNode(property, filepath, NodeType.FIELD, language, astNode.startPosition.row, astNode.endPosition.row);
            _repoMap_.updateNode(node);
            const ancestorAstNode = hasAncestor([JavaScriptAstNodeType.CLASS_DECLARATION], astNode);
            if (!ancestorAstNode) {
                continue;
            }
            const getAstNodeName = javaScriptAstNodeHandler.get(ancestorAstNode.type);
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
        if (pattern === 7) {
            const astNode = match.captures.find(c => c.name === "declaration")?.node;
            const name = match.captures.find(c => c.name === "name")?.node.text;
            if (!astNode || !name) {
                continue;
            }
            const node = new CodeNode(name, filepath, NodeType.FIELD, language, astNode.startPosition.row, astNode.endPosition.row);
            _repoMap_.updateNode(node);
            _repoMap_.addEdge(currentFileNode, node, EdgeType.DEFINE);
        }

        // require_statement
        if (pattern === 8) {
            const requireStatement = match.captures.find(c => c.name === "require_statement")?.node.text;
            if (!requireStatement) {
                continue;
            }
            const matches = /(.*)=.*\((.*)\)/.exec(requireStatement);
            const left = matches?.[1].trim();
            const source = matches?.[2].trim().slice(1, -1);
            if (!left || !source) {
                continue;
            }
            const names = /\{(.*)\}/.exec(left)?.[1].trim().split(/ *, */);
            if (names) {
                for (const identifiers of names) {
                    const [name, asName] = identifiers.split(/ *: */);
                    importHandler(name, asName ? asName : name, source);
                }
            } else {
                importHandler(left, DEFAULT, source);
            }
        }
    }
}

export const javaScriptAfterUpdate: AfterUpdate = (_repoMap_: _RepoMap_): void => {
    for (const [filepath, name] of Object.entries(defaultRecord)) {
        const from = new MapNode(DEFAULT, filepath);
        if (!_repoMap_.hasNode(from)) {
            continue;
        }
        _repoMap_.copyEdges(from, new MapNode(name, filepath));
    }
    defaultRecord = {};
}


