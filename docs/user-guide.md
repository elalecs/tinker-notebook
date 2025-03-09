# Tinker Notebook - User Guide

## Introduction

Tinker Notebook is a VS Code extension that brings interactive PHP and Laravel Tinker code execution directly into your editor. Similar to Jupyter notebooks for Python, this extension allows you to write, document, and execute PHP code within Markdown files, providing immediate feedback without leaving your IDE.

## Installation and Setup Guide

### Prerequisites

- VS Code (version 1.60.0 or higher)
- PHP 7.4+ installed and available in your PATH
- Composer installed (optional, only required for Tinker blocks)
- Laravel (optional, only required for Tinker blocks)

### Installing the Extension

#### From VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or View → Extensions)
3. Search for "Tinker Notebook"
4. Click Install
5. Reload VS Code when prompted

#### Manual Installation

1. Download the `.vsix` file from the [GitHub releases page](https://github.com/your-username/tinker-notebook/releases)
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu in the top-right of the Extensions panel
4. Select "Install from VSIX..."
5. Navigate to and select the downloaded `.vsix` file
6. Reload VS Code when prompted

### Verifying Installation

To verify that the extension is properly installed and working:

1. Create a new file with a `.md` extension
2. Enter some basic PHP code in a code block
3. Run the command "Tinker Notebook: Run Block" (Ctrl+Enter when cursor is in a code block)
4. You should see the output appear in the Output panel

### Configuration Options

The extension can be configured through VS Code's settings. To access these settings:

1. Go to File → Preferences → Settings (or press Ctrl+,)
2. Search for "Tinker Notebook"
3. Adjust the settings according to your preferences

#### Available Settings

| Setting | Description | Default |
|---------|-------------|--------|
| `tinker-notebook.phpPath` | Path to PHP executable | Auto-detected |
| `tinker-notebook.timeout` | Timeout for PHP/Tinker commands (ms) | 30000 |
| `tinker-notebook.laravelPath` | Path to Laravel project for Tinker execution | Auto-detected |

### Troubleshooting Installation

#### Common Issues

1. **PHP Not Found**: Ensure PHP is installed and in your PATH. You can verify this by running `php -v` in your terminal.

2. **Laravel Project Not Detected**: Make sure you have opened a valid Laravel project folder in VS Code.

3. **Tinker Not Available**: Ensure Tinker is installed in your Laravel project. You can install it with `composer require laravel/tinker`.

4. **Permission Issues**: On Unix-based systems, ensure the PHP executable has execute permissions.

#### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/your-username/tinker-notebook/issues) for similar problems
2. Submit a new issue with detailed information about your environment and the problem

## Basic Usage Tutorial

### Creating Your First Notebook

1. Open VS Code
2. Create a new file with a `.md` extension (e.g., `examples.md`)
3. Add some markdown content to document your code

### Writing and Executing Code

1. **Add a PHP Code Block**:
   ```markdown
   # My First Tinker Notebook
   
   This is a simple example of using Tinker Notebook.
   
   ```php
   // Simple PHP code
   $greeting = "Hello, World!";
   echo $greeting;
   ```
   ```

2. **Execute the Code**:
   - Place your cursor inside the code block
   - Press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
   - Alternatively, use the command palette and search for "Tinker Notebook: Run Block"

3. **View the Results**:
   - Results appear in the Output panel
   - The code block will be decorated with a status indicator (🟢 for success, ❌ for error)

### Working with PHP and Tinker Blocks

Tinker Notebook supports two types of code blocks:

1. **PHP Blocks**: Standard PHP code executed with the system PHP binary
   ```php
   $name = "Tinker Notebook";
   echo "Hello from {$name}!";
   ```

2. **Tinker Blocks**: Laravel Tinker code executed with `php artisan tinker`
   ```tinker
   // This requires a Laravel project
   $users = App\Models\User::all();
   $users->count();
   ```

### Using Block IDs and Result References

You can assign custom IDs to code blocks and reference their results in other blocks:

1. **Assign an ID to a Block**:
   ```markdown
   ```php:my_data
   $data = ["name" => "John", "age" => 30];
   return $data;
   ```
   ```

2. **Reference the Result in Another Block**:
   ```markdown
   ```php
   $previous_data = $tinker_outputs.my_data;
   echo "Name: " . $previous_data["name"];
   ```
   ```

### Organizing Your Notebook

Use markdown to structure your notebook with headings, lists, and text explanations:

```markdown
# Database Exploration

## User Model

First, let's retrieve all users:

```php
$users = ["John", "Jane", "Bob"];
print_r($users);
```

## Processing Data

Now, let's process the data:

```php
$names = ["John", "Jane", "Bob"];
$greetings = array_map(function($name) {
    return "Hello, {$name}!";
}, $names);
print_r($greetings);
```
```

### Saving and Sharing

- Your notebooks are saved as regular markdown files
- They can be committed to version control
- Other team members with the extension can execute the code blocks
- Without the extension, they're still readable as regular markdown files

## Advanced Features Documentation

### Code Block Types and Syntax

The extension supports two main types of code blocks:

1. **Standard PHP Code Blocks**: 
   ```php
   $greeting = "Hello, World!";
   echo $greeting;
   ```

2. **Tinker-specific Blocks**: 
   ```tinker
   // This requires a Laravel project
   $users = App\Models\User::all();
   $users->count();
   ```

### Block Identification System

You can assign custom IDs to your code blocks for easier reference:

1. **PHP Blocks with ID**:
   ```php:my_calculation
   $result = 10 * 5;
   return $result;
   ```

2. **Tinker Blocks with ID**:
   ```tinker:user_count
   return App\Models\User::count();
   ```

### Visual Status Indicators

Code blocks display their execution status with visual indicators:

- ▶️ Not executed
- ⏹️ Executing/stop execution
- 🟢 Successfully executed
- ❌ Error in execution

### Result Referencing System

Reference results from previous blocks using the `$tinker_outputs` object:

```php
// Reference a result from a block with ID "user_count"
$count = $tinker_outputs.user_count;
echo "There are {$count} users in the database.";
```

### Smart Output Formatting

The extension automatically detects and formats different types of output:

#### JSON Formatting

When your code returns JSON data, it's automatically formatted for better readability:

```php
$data = ['name' => 'John', 'age' => 30, 'skills' => ['PHP', 'Laravel', 'Vue']];
return json_encode($data);
```

The output will be formatted as properly indented JSON.

#### Array and Object Formatting

When your code returns arrays or objects, they're formatted for better readability:

```php
$users = [
    ['name' => 'John', 'email' => 'john@example.com'],
    ['name' => 'Jane', 'email' => 'jane@example.com']
];
return $users;
```

#### PHP var_dump Formatting

When using `var_dump()`, the output is formatted for better readability:

```php
$user = ['name' => 'John', 'email' => 'john@example.com'];
var_dump($user);
```

### Interactive Results

#### Collapsible Results

For large results, you can toggle between expanded and collapsed views in the Output panel.

#### Copy and Export

Easily copy or export your results using the options in the Output panel:

1. **Copy to Clipboard**: Use the copy button or context menu in the Output panel
2. **Export Results**: Export results to various formats (JSON, CSV, Text)

## Troubleshooting Guide

### Common Runtime Errors

#### PHP Syntax Errors

**Symptom**: Error message indicating a syntax error in your code.

**Solution**:
1. Check the line number indicated in the error message
2. Look for missing semicolons, brackets, or quotes
3. Ensure all PHP expressions are properly terminated

#### Undefined Variables

**Symptom**: Error message: "Undefined variable: variableName"

**Solution**:
1. Check if the variable was defined in the current block
2. Make sure the variable name is spelled correctly
3. Check if you're trying to reference a result with an incorrect ID

#### Memory Limit Exceeded

**Symptom**: Error message about memory allocation or exhausted memory

**Solution**:
1. Limit the amount of data you're retrieving
2. Avoid loading large datasets into memory
3. Consider using generators or chunking for large data processing

#### Timeout Errors

**Symptom**: Operation times out or execution takes too long

**Solution**:
1. Increase the timeout setting in VS Code preferences
2. Optimize your queries to execute faster

### Extension Issues

#### Extension Not Activating

**Symptom**: Code blocks don't execute or commands aren't available

**Solution**:
1. Ensure you have a `.md` file open
2. Check the VS Code output panel for extension errors
3. Reinstall the extension if necessary

#### Laravel Project Detection Issues

**Symptom**: Tinker blocks fail to execute with Laravel-related errors

**Solution**:
1. Ensure you have a valid Laravel project open
2. Check if the Laravel project has Tinker installed
3. Set the `tinker-notebook.laravelPath` setting manually if auto-detection fails

## Performance Optimization Tips

### Writing Efficient Code

#### Database Queries

1. **Limit Retrieved Data**:
   ```php
   // Instead of retrieving all records
   // $users = User::all();
   
   // Limit to what you need
   $users = User::take(10)->get();
   ```

2. **Select Only Needed Columns**:
   ```php
   $users = User::select('id', 'name', 'email')->get();
   ```

#### Memory Management

1. **Process Large Datasets in Chunks**:
   ```php
   User::chunk(100, function ($users) {
       foreach ($users as $user) {
           // Process each user
       }
   });
   ```

2. **Clean Up After Large Operations**:
   ```php
   // After processing large data
   gc_collect_cycles();
   ```

### Extension Configuration

1. **Adjust Timeout for Complex Operations**:
   - Increase `tinker-notebook.timeout` for operations that take longer to complete

2. **Use Raw Output for Large Results**:
   - For very large outputs, consider using simpler output formats
