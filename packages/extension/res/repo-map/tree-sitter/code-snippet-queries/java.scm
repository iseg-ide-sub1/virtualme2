(class_declaration
  name: (_) @name.definition.class
  interfaces: (super_interfaces
    (type_list
      (_type) @interface_name
    )
  )? @interfaces
  superclass: (superclass
    (_type) @superclassName
  )? @superclass
) @definition.class

(method_declaration
  type: (_) @return_type
  name: (_) @name.definition.method
  parameters: (_) @parameters
) @definition.method

(interface_declaration
  name: (_) @name.definition.interface
  (extends_interfaces
    (type_list
      (_type) @interface_name
    )
  )? @extends_interfaces
) @definition.interface

(import_declaration
  (scoped_identifier) @import.body  ;; 捕获包名
) @import_declaration  ;; 捕获整个 import 语句

(method_invocation
  name: (_) @name.invocation.method
) @method_invocation

(package_declaration
  (scoped_identifier) @package.body  ;; 捕获包名
) @package_declaration  ;; 捕获整个 package 语句

(field_declaration
  (modifiers
    "static"
  ) @field.modifiers
  (variable_declarator
    name: (identifier) @field.name
  )
) @static.field

(field_access
  field: (identifier) @field_name
) @field_access