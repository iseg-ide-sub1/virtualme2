(import_statement
  source: (_) @source
)

(call_expression
  function: (identifier) @name 
  (#eq? @name "require")
  arguments: (arguments
    (_) @source
  )
)