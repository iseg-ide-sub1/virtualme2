import Parser from "web-tree-sitter"
import { MapNode, MatchesHandler, StructNode } from "../type";
import { _RepoMap_ } from "../_RepoMap_";

export const pythonVirtualMeMatchesHandler: MatchesHandler = (_repoMap_: _RepoMap_, matches: Parser.QueryMatch[], filepath: string): void => {
    const currentFileNode: StructNode = _repoMap_.getWholeNode(new MapNode(filepath, filepath)) as StructNode;
    const externalPackages: Set<string> = new Set<string>();

    for (const match of matches) {
        const pattern = match.pattern;

        const getTopModule = (moduleName: string): string => {
            return moduleName.split(/[\. ]/)[0];
        }

        // import_from_statement
        if (pattern === 0) {
            const moduleName = match.captures.find(c => c.name === "module_name")?.node.text;
            if (!moduleName) {
                continue;
            }
            externalPackages.add(getTopModule(moduleName));
        }

        // import_statement
        if (pattern === 1) {
            const moduleName = match.captures.find(c => c.name === "name")?.node.text;
            if (!moduleName) {
                continue;
            }
            externalPackages.add(getTopModule(moduleName));
        }
    }

    _repoMap_.addExternalPackages(externalPackages);
}
