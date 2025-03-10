# Tinker Notebook

A lightweight VS Code extension that enables interactive PHP and Laravel Tinker code execution directly in Markdown files. Tinker Notebook allows you to write, document, and execute PHP code within Markdown code blocks, providing immediate feedback without leaving your editor.

## Current Status

- ✅ **Phase 1**: Basic PHP code execution from Markdown files
- ✅ **Phase 2**: Differentiated PHP/Tinker execution with Laravel project detection
- ✅ **Phase 3**: Code block state management with persistent storage
- ✅ **Phase 4**: Enhanced output formatting for different data types
- 🔄 **Phase 5**: Tinker Output Panel with WebView interface

## Implemented Features

- **Code Execution**
  - Execution of PHP code blocks (```php) using the system PHP binary
  - Execution of Tinker blocks (```tinker) using php artisan tinker
  - Automatic detection of Laravel projects in the workspace
  - Creation of temporary Laravel projects when necessary

- **State Management**
  - Block identification system with custom IDs (```php:id, ```tinker:id)
  - Execution state tracking with visual indicators:
    - ▶️ Not executed
    - ⏹️ Running/stop execution
    - 🟢 Successfully executed
    - ❌ Execution error
  - State persistence between editor sessions

- **Result References**
  - Block reference system using $tinker_outputs.id syntax
  - Detection and prevention of circular references
  - Detailed information when hovering over blocks

- **Output Formatting**
  - Intelligent detection of output types (JSON, arrays, objects, etc.)
  - Formatters for different data types with syntax highlighting
  - Collapsible sections to improve readability
  - Export functionality in various formats (JSON, CSV, Text)

## Requirements

- PHP 7.4+ (required)
- Composer & Laravel (optional for Tinker blocks)

## Installation

### From VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Tinker Notebook"
4. Click Install
5. Reload VS Code when prompted

### Manual Installation

1. Download the `.vsix` file from the [GitHub releases page](https://github.com/elalecs/tinker-notebook/releases)
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click on the "..." menu in the top right of the Extensions panel
4. Select "Install from VSIX..."
5. Navigate to and select the downloaded `.vsix` file
6. Reload VS Code when prompted

## Usage

1. Create or open a Markdown file (`.md`)
2. Add a PHP code block using triple backticks and the language identifier `php` or `tinker`:

```markdown
# My PHP Notes

Here's a simple PHP example:

```php
$greeting = "Hello, World!";
echo $greeting;

// You can also use variables
$name = "Tinker Notebook";
echo "Welcome to {$name}!";
```

```tinker:my_query
// This block will run with Laravel Tinker
$users = \App\Models\User::all();
return $users;
```

// You can reference previous results
```php
$data = $tinker_outputs.my_query;
var_dump(count($data));
```
```

3. Place the cursor inside the code block
4. Press Ctrl+Enter (Cmd+Enter on Mac) to execute the code
5. View the results in the Output panel

## Extension Configuration

This extension contributes the following settings:

* `tinker-notebook.phpPath`: Path to the PHP executable (default: "php")
* `tinker-notebook.timeout`: Timeout for PHP execution in milliseconds (default: 30000)
* `tinker-notebook.laravelPath`: Path to the Laravel project for Tinker execution (optional)

## Keyboard Shortcuts

* `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac): Execute the code block at the current cursor position

## Upcoming Features

### Tinker Output Panel (Coming Soon)

We're working on a dedicated Tinker Output panel that will provide an enhanced experience for viewing execution results:

- **WebView Interface**: A dedicated panel with syntax highlighting for different output types
- **Interactive Export**: Buttons to export results as JSON, CSV, TXT, or copy to clipboard
- **Collapsible Sections**: Easily navigate complex data structures with expandable/collapsible sections
- **Real-time Updates**: See execution progress and results in real-time

Check the [TODO.md](TODO.md) file to see all planned features and improvements.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed information on how to set up the development environment and contribute to the project.

## License

This extension is licensed under the GPL-3.0 License.

## Documentation
- [User Guide](docs/user-guide.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Development Plan](TODO.md)