(
  (comment)? @comment
  (class_declaration
    name: (_) @name
    (class_heritage
      (_) @class_heritage
    )? 
  ) @definition
)

(
  (comment)? @comment
  (function_declaration
    name: (_) @name
    parameters: (_) @parameters
  ) @definition
)

(
  (comment)? @comment
  (method_definition
    name: (_) @name
    parameters: (_) @parameters
  ) @definition
)

(import_statement
  (import_clause
    [
      (identifier) @identifier ;; import path from 'path'
      (named_imports
        (import_specifier) @import_specifier
      ) ;; import {RepoMap} from 'repomap'
      (namespace_import) @namespace_import ;; import * as fs from 'fs'
    ]
  )
  source: (_) @source
)

(export_statement
  "export"
  "default"
  (_) @default_export
)

(call_expression
  function: (identifier) @name ;; 目前只支持 identifier
) @call_expression

(field_definition
  property: (_) @property
) @field_definition

(program
  (lexical_declaration
    (variable_declarator
      name: (identifier) @name
    )
  ) @declaration
)

(_
  (call_expression
    function: (identifier) @name 
    (#eq? @name "require")
  )
) @require_statement