# Tinker Notebook - TODO List

## Overview
This document outlines the development plan for Tinker Notebook, a compact version of Laravel Tinker Notebook that focuses on executing PHP code from Markdown files.

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

### Progress Summary
- ✅ Implemented Laravel project detection with the `LaravelDetector` class
- ✅ Implemented temporary Laravel project management with the `LaravelManager` class
- ✅ Implemented Tinker code execution with the `TinkerExecutor` class
- ✅ Integrated differentiated execution in the main `extension.ts` file
- ✅ Enhanced error handling with descriptive messages
- ✅ Added visual feedback with emojis in the output channel
- ✅ Completed unit tests for all Phase 2 components
- ✅ Completed integration tests for Phase 2 functionality

3. **End-to-End Testing**
   - [x] Launch VS Code in a Laravel project and validate tinker execution
   - [x] Launch VS Code in a non-Laravel project and validate temporary creation
   - [x] Validate error messages when tinker execution is not possible
   - [x] Test behavior with different system configurations

## Phase 3: Code Block State Management

### Core Features
- [ ] Implement automatic and custom block identifiers (```php:id, ```tinker:id)
- [ ] Track execution state of each code block
- [ ] Enable referencing previous block results (e.g., $tinker_outputs.id)
- [ ] Add visual indicators for block execution status
- [ ] Persist block state between editor sessions

### Implementation Tasks
1. **Block Identification System**
   - [ ] Parse custom identifiers from code block syntax
   - [ ] Generate automatic identifiers for blocks without custom IDs
   - [ ] Create unique ID registry to prevent duplicates
   - [ ] Implement ID validation and error handling

2. **Execution State Tracking**
   - [ ] Define state enum (not executed, executing, success, error)
   - [ ] Create state manager to track each block's current state
   - [ ] Implement state persistence between editor sessions
   - [ ] Add event system for state changes

3. **Visual Status Indicators**
   - [ ] Add status decorators with appropriate emojis:
     - [ ] ▶️ Not executed
     - [ ] ⏹️ Executing/stop execution
     - [ ] 🟢 Successfully executed
     - [ ] ❌ Error in execution
   - [ ] Update decorators in real-time based on state changes
   - [ ] Add hover information showing execution details

4. **Result Referencing System**
   - [ ] Store execution results with block IDs
   - [ ] Implement $tinker_outputs.id syntax parser
   - [ ] Replace references in subsequent blocks before execution
   - [ ] Handle circular references and dependency tracking

### Testing for Phase 3
1. **Unit Testing**
   - [ ] Unit tests for block ID generation and parsing
   - [ ] Unit tests for state management
   - [ ] Unit tests for result storage and reference resolution
   - [ ] Unit tests for decorator management

2. **Integration Testing**
   - [ ] Test ID generation across multiple files
   - [ ] Test state persistence between editor sessions
   - [ ] Test reference resolution in complex scenarios
   - [ ] Test visual indicator updates during execution

3. **End-to-End Testing**
   - [ ] Launch VS Code and validate block identification
   - [ ] Test execution state visualization
   - [ ] Validate result referencing between blocks
   - [ ] Test state persistence after IDE restart

## Phase 4: Session Management

- [ ] Maintain state between code executions
- [ ] Implement session identifiers for code blocks
- [ ] Create session variable tracking
- [ ] Add session management commands
- [ ] Visualize active/inactive sessions

### Testing for Phase 2
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

## Phase 5: Enhanced Output Formatting

- [ ] Implement smart output detection (JSON, arrays, etc.)
- [ ] Add formatting options for different output types
- [ ] Create collapsible result sections
- [ ] Add export capabilities for results

### Testing for Phase 4
1. **Unit Testing**
   - [ ] Unit tests for output formatters
   - [ ] Unit tests for output type detection
   - [ ] Unit tests for export functionality

2. **Integration Testing**
   - [ ] Test output formatting with various data types
   - [ ] Test collapsible sections behavior
   - [ ] Test export functionality with different formats

3. **End-to-End Testing**
   - [ ] Launch VS Code and validate formatted output display
   - [ ] Test user interaction with collapsible sections
   - [ ] Validate export functionality in real environment

## Phase 6: Snippet Library

- [ ] Create snippet storage system
- [ ] Implement snippet import/export
- [ ] Add snippet management UI
- [ ] Create commands for snippet operations

### Testing for Phase 5
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

## Phase 7: Advanced Features

- [ ] Optimize process management
- [ ] Implement special directives processing
- [ ] Add support for custom PHP binary configuration
- [ ] Create advanced error handling and suggestions
- [ ] Add support for custom output formatters

### Testing for Phase 6
1. **Unit Testing**
   - [ ] Unit tests for process management
   - [ ] Unit tests for directive processing
   - [ ] Unit tests for custom formatters
   - [ ] Unit tests for error handling

2. **Integration Testing**
   - [ ] Test process management with long-running scripts
   - [ ] Test directive processing in various contexts
   - [ ] Test custom formatters with different output types

3. **End-to-End Testing**
   - [ ] Launch VS Code and validate advanced features
   - [ ] Test performance with large files and complex code
   - [ ] Validate error suggestions in real coding scenarios

## Technical Debt & Refactoring

- [x] Set up comprehensive test suite
- [x] Create proper documentation
- [ ] Implement telemetry for usage insights
- [ ] Optimize performance for large files
- [x] Fix linting issues
- [ ] Add error handling for missing PHP binary
- [x] Improve code organization and modularity

## Continuous Integration & Deployment

- [ ] Set up GitHub Actions workflow for CI
- [ ] Configure automated testing on pull requests
- [ ] Set up automated VSIX package generation
- [ ] Configure automated deployment to VS Code Marketplace
- [ ] Implement version management and changelog generation

## Performance & Scalability Testing

- [ ] Benchmark performance with large Markdown files
- [ ] Test memory usage with multiple code executions
- [ ] Measure startup time impact
- [ ] Profile CPU usage during code execution
- [ ] Test with various PHP versions and configurations
