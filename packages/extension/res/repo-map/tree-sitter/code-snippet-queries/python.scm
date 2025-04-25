(class_definition
  name: (_) @name
  superclasses: (_)? @superclasses
) @definition

(function_definition
  name: (_) @name
  parameters: (_) @parameters
  return_type: (_)? @return_type
) @definition

(import_from_statement
  module_name: (relative_import) @module_name
  name: (_) @name
)

(call
  function: (_) @function
) @call

(module
  (expression_statement
    (assignment
      left: [
        (identifier) @name
        (pattern_list
          (identifier) @name
        )
      ]
    ) @assignment
  )
)