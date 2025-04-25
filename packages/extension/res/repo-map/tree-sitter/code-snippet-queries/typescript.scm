(
  (comment)? @comment
  (class_declaration
    name: (_) @name
    (class_heritage
      (extends_clause
        value: (_) @value
      )?
      (implements_clause
        (_) @type
      )?
    )?
  ) @definition
)

(
  (comment)? @comment
  (function_declaration
    name: (_) @name
    parameters: (_) @parameters
    return_type: (
      (_) @type
    )?
  ) @definition
)

(
  (comment)? @comment
  (method_definition
    name: (_) @name
    parameters: (_) @parameters
    return_type: (
      (_) @type
    )?
  ) @definition
)

(
  (comment)? @comment
  (interface_declaration
    name: (_) @name
    (extends_type_clause
      type: (_) @type
    )?
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

(public_field_definition ;; 实际上不只是 public 字段
  "static"
  name: (_) @name
) @definition

(program
  (lexical_declaration
    (variable_declarator
      name: (identifier) @name
    )
  ) @declaration
)

(
  (comment)? @comment
  (abstract_class_declaration
    name: (_) @name
    (class_heritage
      (extends_clause
        value: (_) @value
      )?
      (implements_clause
        (_) @type
      )?
    )?
  ) @definition
)