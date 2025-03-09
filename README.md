# Tinker Notebook

A lightweight VS Code extension that enables interactive PHP code execution directly in Markdown files. Tinker Notebook allows you to write, document, and execute PHP code within Markdown code blocks, providing immediate feedback without leaving your editor.

## Features

- **Interactive PHP Code Execution**: Run PHP code directly in your Markdown files with Ctrl+Enter (Cmd+Enter on Mac)
- **Code Block Detection**: Automatically detects ```php and ```tinker code blocks in Markdown files
- **Visual Feedback**: Displays execution status with decorators next to code blocks
- **Output Display**: Shows execution results in the Output panel
- **Error Handling**: Displays errors in the Problems panel with references to the source code

## Requirements

- VS Code or VSCodium (version 1.60.0 or higher)
- PHP 7.4+ installed and available in your PATH

## Installation

### From VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Tinker Notebook"
4. Click Install
5. Reload VS Code when prompted

### Manual Installation

1. Download the `.vsix` file from the [GitHub releases page](https://github.com/your-username/tinker-notebook/releases)
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu in the top-right of the Extensions panel
4. Select "Install from VSIX..."
5. Navigate to and select the downloaded `.vsix` file
6. Reload VS Code when prompted

## Usage

1. Create or open a Markdown file (`.md`)
2. Add a PHP code block using triple backticks and the `php` or `tinker` language identifier:

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

3. Place your cursor inside the code block
4. Press Ctrl+Enter (Cmd+Enter on Mac) to execute the code
5. View the results in the Output panel

## Extension Settings

This extension contributes the following settings:

* `tinker-notebook.phpPath`: Path to PHP executable (default: "php")
* `tinker-notebook.timeout`: Timeout for PHP execution in milliseconds (default: 30000)

## Keyboard Shortcuts

* `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac): Execute the code block at the current cursor position

## Roadmap

See the [TODO.md](TODO.md) file for planned features and enhancements.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License.

---

**Enjoy using Tinker Notebook!**
