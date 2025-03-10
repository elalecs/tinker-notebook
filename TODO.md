# Tinker Notebook - TODO List

## Overview
This document outlines the development plan for Tinker Notebook, a compact version of Laravel Tinker Notebook that focuses on executing PHP code from Markdown files.

## Current Status
- **Phase 1 (Proof of Concept)**: ✅ COMPLETED
- **Phase 2 (Differentiated PHP/Tinker Execution)**: ✅ COMPLETED
- **Phase 3 (Code Block State Management)**: ✅ COMPLETED
- **Phase 4 (Enhanced Output Formatting)**: ✅ COMPLETED
- **Phase 5 (Tinker Output Panel)**: 🔄 PLANNED
- **Phase 6 (Session Management)**: 🔄 PLANNED
- **Phase 7 (Snippet Library)**: 🔄 PLANNED

Current version includes:
- PHP/Tinker code execution from Markdown files
- Laravel project detection and temporary project creation
- Block state management with persistent storage
- Block identification system with custom IDs
- Result referencing between blocks via $tinker_outputs.id syntax
- Visual status indicators with emojis
- Smart output formatting for different data types (JSON, arrays, objects)
- Syntax highlighting for code outputs
- Result export functionality in various formats (JSON, CSV, Text)
- Collapsible output sections for better readability

## Phase 1: Proof of Concept (POC)

### Core Features
- [x] Detect PHP/Tinker code blocks in Markdown files
- [x] Add "Run Code" decorators to these blocks
- [x] Execute code using PHP CLI
- [x] Display results in Output panel
- [x] Show errors in Problems panel
- [x] Implement keyboard shortcut (Ctrl+Enter / Cmd+Enter)

### Implementation Tasks
1. **Code Block Detection**
   - [x] Create detector for ```php and ```tinker blocks in Markdown
   - [x] Implement text editor decoration for these blocks
   - [x] Add hover information for code blocks

2. **Code Execution**
   - [x] Create temporary file handling system
   - [x] Implement PHP CLI execution
   - [x] Capture standard output and errors
   - [x] Parse execution results

3. **Result Visualization**
   - [x] Configure Output channel for results
   - [x] Format and display execution results
   - [x] Configure Problems panel for errors
   - [x] Link errors back to source code

4. **Commands and Shortcuts**
   - [x] Register command for executing current code block
   - [x] Add keyboard shortcut binding
   - [x] Implement status bar information

### Testing for Phase 1
1. **Unit Testing**
   - [x] Unit tests for CodeBlockDetector class
   - [x] Unit tests for CodeExecutor class
   - [x] Unit tests for CodeBlockDecorator class
   - [x] Unit tests for fileUtils functions

2. **Integration Testing**
   - [x] Test extension activation with Markdown files
   - [x] Test code block detection in various Markdown formats
   - [x] Test code execution with simple PHP code
   - [x] Test error handling with invalid PHP code

3. **End-to-End Testing**
   - [x] Launch VS Code with the extension and validate code block decoration
   - [x] Test keyboard shortcuts for code execution
   - [x] Validate output display in Output panel
   - [x] Validate error display in Problems panel

## Phase 2: Differentiated PHP/Tinker Execution

### Core Features
- [x] Differentiate execution between ```php and ```tinker blocks
- [x] Execute ```php blocks with system PHP binary
- [x] Execute ```tinker blocks with php artisan tinker
- [x] Detect if Markdown file is in a Laravel project
- [x] Create temporary Laravel project if necessary

### Implementation Tasks
1. **Laravel Project Detection**
   - [x] Implement Laravel project detector in workspace
   - [x] Verify existence of artisan and composer.json
   - [x] Determine Laravel project path for execution

2. **Tinker Block Execution**
   - [x] Implement execution using php artisan tinker
   - [x] Create temporary file with appropriate format for Tinker
   - [x] Capture and process Tinker output

3. **Temporary Laravel Project Creation**
   - [x] Verify Laravel/Composer availability in system
   - [x] Create .tinker-notebook directory in workspace
   - [x] Initialize Laravel project for tinker block execution
   - [x] Implement project cache for reuse

4. **Error Handling**
   - [x] Display specific messages in Problems panel
   - [x] Provide suggestions for installing Laravel/Composer
   - [x] Implement fallback to PHP execution if Tinker is not available

### Testing for Phase 2
1. **Unit Testing**
   - [x] Unit tests for Laravel project detector
   - [x] Unit tests for differentiated execution
   - [x] Unit tests for temporary project creation
   - [x] Unit tests for specific error handling

2. **Integration Testing**
   - [x] Test Laravel project detection in different scenarios
   - [x] Test tinker block execution in existing Laravel projects
   - [x] Test creation and use of temporary Laravel projects
   - [x] Test error handling when Laravel/Composer is not available

3. **End-to-End Testing**
   - [x] Launch VS Code in a Laravel project and validate tinker execution
   - [x] Launch VS Code in a non-Laravel project and validate temporary creation
   - [x] Validate error messages when tinker execution is not possible
   - [x] Test behavior with different system configurations

## Phase 3: Code Block State Management

### Core Features
- [x] Implement automatic and custom block identifiers (```php:id, ```tinker:id)
- [x] Track execution state of each code block
- [x] Enable referencing previous block results (e.g., $tinker_outputs.id)
- [x] Add visual indicators for block execution status
- [x] Persist block state between editor sessions

### Implementation Tasks
1. **Block Identification System**
   - [x] Parse custom identifiers from code block syntax
   - [x] Generate automatic identifiers for blocks without custom IDs
   - [x] Create unique ID registry to prevent duplicates
   - [x] Implement ID validation and error handling

2. **Execution State Tracking**
   - [x] Define state enum (not executed, executing, success, error)
   - [x] Create state manager to track each block's current state
   - [x] Implement state persistence between editor sessions
   - [x] Add event system for state changes

3. **Visual Status Indicators**
   - [x] Add status decorators with appropriate emojis:
     - [x] ▶️ Not executed
     - [x] ⏹️ Executing/stop execution
     - [x] 🟢 Successfully executed
     - [x] ❌ Error in execution
   - [x] Update decorators in real-time based on state changes
   - [x] Add hover information showing execution details

4. **Result Referencing System**
   - [x] Store execution results with block IDs
   - [x] Implement $tinker_outputs.id syntax parser
   - [x] Replace references in subsequent blocks before execution
   - [x] Handle circular references and dependency tracking

### Testing for Phase 3
1. **Unit Testing**
   - [x] Unit tests for block ID generation and parsing
   - [x] Unit tests for state management
   - [x] Unit tests for result storage and reference resolution
   - [x] Unit tests for decorator management

2. **Integration Testing**
   - [x] Test ID generation across multiple files
   - [x] Test state persistence between editor sessions
   - [x] Test reference resolution in complex scenarios
   - [x] Test visual indicator updates during execution

3. **End-to-End Testing**
   - [x] Launch VS Code and validate block identification
   - [x] Test execution state visualization
   - [x] Validate result referencing between blocks
   - [x] Test state persistence after IDE restart

## Phase 4: Enhanced Output Formatting

- [x] Implement smart output detection (JSON, arrays, etc.)
- [x] Add formatting options for different output types
- [x] Create collapsible result sections
- [x] Add export capabilities for results

### Implementation Tasks
1. **Smart Output Detection**
   - [x] Create OutputDetector class for type detection
   - [x] Implement detection for JSON, arrays, objects, and primitive types
   - [x] Add support for PHP-specific output formats (arrays, objects, etc.)
   - [x] Create mechanism to find appropriate formatter for output type

2. **Output Formatters**
   - [x] Design base formatter interface and abstract class
   - [x] Implement JSON formatter with syntax highlighting and structure
   - [x] Create formatters for arrays and objects with proper indentation
   - [x] Add fallback string formatter for all other types
   - [x] Implement collapsible sections for large outputs

3. **Export Capabilities**
   - [x] Create exporter interface for export functionality
   - [x] Implement JSON, CSV, and text exporters
   - [x] Add file save dialogs with appropriate file type filters
   - [x] Integrate export commands into VS Code command palette

4. **Integration**
   - [x] Create OutputFormatterManager to coordinate formatting and exporting
   - [x] Replace direct output display with formatted display
   - [x] Add export options to output channel display
   - [x] Make output formatting configurable

### Testing for Phase 4
1. **Unit Testing**
   - [x] Unit tests for output formatters
   - [x] Unit tests for output type detection
   - [x] Unit tests for export functionality

2. **Integration Testing**
   - [x] Test output formatting with various data types
   - [x] Test collapsible sections behavior
   - [x] Test export functionality with different formats

3. **End-to-End Testing**
   - [x] Launch VS Code and validate formatted output display
   - [x] Test user interaction with collapsible sections
   - [x] Validate export functionality in real environment

## Phase 5: Tinker Output Panel

- [ ] Create dedicated WebView panel for execution results
- [ ] Implement syntax highlighting for different output types
- [ ] Add interactive export buttons (JSON, CSV, TXT, Copy to Clipboard)
- [ ] Implement collapsible sections for complex data structures
- [ ] Create real-time output updates during execution

### Implementation Tasks
1. **WebView Panel Creation**
   - [ ] Create TinkerOutputPanel class extending WebviewPanel
   - [ ] Design HTML/CSS template for the panel
   - [ ] Implement message passing between extension and WebView
   - [ ] Add panel persistence across editor sessions

2. **Output Rendering**
   - [ ] Implement syntax highlighting for JSON, arrays, and objects
   - [ ] Create collapsible tree view for nested data structures
   - [ ] Add support for pagination of large result sets
   - [ ] Implement search functionality within results

3. **Export Functionality**
   - [ ] Add export buttons for different formats (JSON, CSV, TXT)
   - [ ] Implement clipboard copy functionality
   - [ ] Create download handlers for exported files
   - [ ] Add export progress indicators

4. **Integration**
   - [ ] Connect execution service with WebView panel
   - [ ] Implement result history navigation
   - [ ] Add configuration options for panel behavior
   - [ ] Create commands for panel management

### Testing for Phase 5
1. **Unit Testing**
   - [ ] Unit tests for WebView message handling
   - [ ] Unit tests for output rendering
   - [ ] Unit tests for export functionality

2. **Integration Testing**
   - [ ] Test panel creation and persistence
   - [ ] Test output rendering with various data types
   - [ ] Test export functionality with different formats
   - [ ] Test interaction between execution service and panel

3. **End-to-End Testing**
   - [ ] Launch VS Code and validate panel creation
   - [ ] Test user interaction with collapsible sections
   - [ ] Validate export functionality in real environment
   - [ ] Test panel behavior with large outputs

## Phase 6: Session Management

- [ ] Maintain state between code executions
- [ ] Implement session identifiers for code blocks
- [ ] Create session variable tracking
- [ ] Add session management commands
- [ ] Visualize active/inactive sessions

### Testing for Phase 6
1. **Unit Testing**
   - [ ] Unit tests for session management classes
   - [ ] Unit tests for variable tracking
   - [ ] Unit tests for session persistence

2. **Integration Testing**
   - [ ] Test session creation and switching
   - [ ] Test variable persistence between executions
   - [ ] Test session isolation between different files

3. **End-to-End Testing**
   - [ ] Launch VS Code and test session management UI
   - [ ] Validate session state persistence
   - [ ] Test variable access across multiple code blocks

## Phase 7: Snippet Library

- [ ] Create snippet storage system
- [ ] Implement snippet import/export
- [ ] Add snippet management UI
- [ ] Create commands for snippet operations

### Testing for Phase 7
1. **Unit Testing**
   - [ ] Unit tests for snippet storage system
   - [ ] Unit tests for snippet import/export
   - [ ] Unit tests for snippet validation

2. **Integration Testing**
   - [ ] Test snippet creation from code blocks
   - [ ] Test snippet import from external sources
   - [ ] Test snippet usage in code blocks

3. **End-to-End Testing**
   - [ ] Launch VS Code and test snippet management UI
   - [ ] Validate snippet persistence
   - [ ] Test snippet usage in real coding scenarios

## Technical Debt & Refactoring

- [x] Set up comprehensive test suite
- [x] Create proper documentation
- [ ] Implement telemetry for usage insights
- [ ] Optimize performance for large files
- [x] Fix linting issues
- [x] Add error handling for missing PHP binary
- [x] Improve code organization and modularity
- [x] Implement proper state management
- [x] Ensure type safety throughout the codebase
