# Contributing to Tinker Notebook

Thank you for your interest in contributing to Tinker Notebook! This document provides information on how to set up the development environment, understand the project architecture, and contribute effectively.

## Architecture

Tinker Notebook is a VS Code extension that allows you to execute PHP and Laravel Tinker code blocks directly from Markdown files. The extension features:

- Detection and execution of PHP/Tinker code blocks in Markdown files
- Differentiated execution between PHP (using system binary) and Tinker (using Laravel's artisan)
- Laravel project detection and temporary project creation when needed
- Block state management with persistent storage
- Result referencing system between code blocks
- Visual status indicators for execution state
- Smart output formatting for different data types
- Dedicated Tinker Output panel with WebView interface (coming soon)
- Interactive export options for execution results (coming soon)

For more detailed information about the project architecture, check the implementation details in [TODO.md](TODO.md).

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/elalecs/tinker-notebook.git
   cd tinker-notebook
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. To run the extension in development mode, press F5 in VS Code to launch a new window with the extension loaded.

## Project Structure

```
tinker-notebook/
├── src/
│   ├── codeBlock/          # Code block detection & decoration
│   │   ├── detector.ts     # Detects code blocks in Markdown
│   │   └── decorator.ts    # Adds visual decorators to blocks
│   ├── execution/          # Code execution services
│   │   ├── executor.ts     # Base executor for PHP code
│   │   ├── tinkerExecutor.ts # Executor for Tinker code
│   │   └── resultHandler.ts # Processes execution results
│   ├── laravel/            # Laravel-related components
│   │   ├── detector.ts     # Detects Laravel projects
│   │   └── manager.ts      # Manages temporary Laravel projects
│   ├── stateManagement/    # Block state tracking
│   │   ├── blockState.ts   # Defines block state model
│   │   └── stateManager.ts # Manages persistent state
│   ├── output/             # Output formatting
│   │   ├── formatter.ts    # Base formatter interface
│   │   └── formatters/     # Type-specific formatters
│   ├── webview/            # WebView panel components (planned)
│   │   ├── tinkerOutputPanel.ts  # WebView panel for execution results
│   │   ├── messageHandler.ts     # Handles messages between extension and WebView
│   │   └── resources/            # HTML, CSS, and JS resources for WebView
│   └── utils/              # Utility functions
│       ├── fileUtils.ts    # File handling utilities
│       └── referenceParser.ts # Parses block references
├── test/
│   ├── unit/               # Unit tests (Jest)
│   │   ├── codeBlock/      # Tests for code block components
│   │   ├── execution/      # Tests for execution services
│   │   └── laravel/        # Tests for Laravel components
│   └── integration/        # Integration tests
├── docs/                   # Documentation
└── dist/                   # Compiled code (generated)
```

## Testing

The project uses multiple types of tests to ensure quality:

### Unit Tests

Unit tests use Jest and are located in the `test/unit/` directory. These tests verify individual components without needing to start VS Code.

To run unit tests:

```bash
npm run test:unit
```

To run unit tests in watch mode (useful during development):

```bash
npm run test:watch
```

### Integration Tests

Integration tests validate the interaction between components and are located in the `test/integration/` directory.

To run integration tests:

```bash
npm run test:integration
```

### End-to-End Tests

End-to-end tests run the extension in a real VS Code environment using `@vscode/test-electron`.

To run end-to-end tests:

```bash
npm run test:e2e
```

### Running All Tests

To run all tests:

```bash
npm run test
```

## Current Development Status

See [TODO.md](TODO.md) for a detailed breakdown of completed and planned features.

## Contribution Guidelines

1. **Feature Branches**: Create a branch for your feature or fix.
2. **Code Style**: Follow TypeScript best practices and the existing code style.
3. **Testing**: Ensure all tests pass and add new tests for your changes.
4. **Documentation**: Update documentation when adding or changing features.
5. **Pull Requests**: Submit a pull request with a clear description of the changes.

## Code Quality Standards

- Use explicit types in TypeScript
- Document public APIs with JSDoc comments
- Maintain high test coverage
- Handle edge cases and errors gracefully
- Follow VS Code extension best practices
- Use descriptive names for variables, functions, and classes

## Building and Distribution

### Creating a VSIX Package

To create a VSIX package for manual distribution or testing:

1. Ensure you have the latest version of `vsce` installed:
   ```bash
   npm install -g @vscode/vsce
   ```

2. Build the extension:
   ```bash
   npm run compile
   ```

3. Package the extension into a VSIX file:
   ```bash
   vsce package
   ```

4. Install the package:
   ```bash
   code --install-extension tinker-notebook-0.1.0.vsix
   ```

This will create a `.vsix` file in the root directory of the project, named according to the version in `package.json` (e.g., `tinker-notebook-0.1.0.vsix`).

### Manual Installation

To install the extension manually from a VSIX file:

1. Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Click on the "..." menu in the top-right corner of the Extensions panel
4. Select "Install from VSIX..."
5. Navigate to and select the VSIX file
6. Reload VS Code when prompted

This method is useful for testing the extension before publishing it to the VS Code Marketplace, or for distributing it to users who don't have access to the Marketplace.

## Tips for Developers

1. **Testing Strategy**: 
   - Use unit tests for isolated components and business logic
   - Use integration tests to verify component interactions
   - Use end-to-end tests to validate the full extension functionality

2. **Debugging**:
   - To debug the extension, start a debugging session in VS Code (F5)
   - To debug tests, use the `Debug Tests` command in VS Code

3. **Performance Considerations**:
   - Be mindful of extension activation time
   - Consider the performance impact of code execution on large files
   - Optimize state management for responsiveness

Thank you for contributing to Tinker Notebook!
