# Tinker Notebook Example

This is an example Markdown file to demonstrate the functionality of the Tinker Notebook extension.

## Basic PHP Example

Here's a simple PHP example that you can run:

```php
$greeting = "Hello, World!";
echo $greeting;

// You can also use variables
$name = "Tinker Notebook";
echo "\nWelcome to {$name}!";
```

## Working with Arrays

PHP arrays are easy to work with:

```php
// Creating an array
$fruits = ["Apple", "Banana", "Orange", "Mango"];

// Displaying array contents
print_r($fruits);

// Adding an element
$fruits[] = "Strawberry";
echo "\nAfter adding Strawberry:\n";
print_r($fruits);

// Using array functions
echo "\nTotal fruits: " . count($fruits);
```

## Object-Oriented PHP

You can also work with classes and objects:

```php
class Person {
    private $name;
    private $age;
    
    public function __construct($name, $age) {
        $this->name = $name;
        $this->age = $age;
    }
    
    public function greet() {
        return "Hello, my name is {$this->name} and I am {$this->age} years old.";
    }
}

$person = new Person("John Doe", 30);
echo $person->greet();
```

## Error Handling Example

This example will generate an error:

```php
// This will cause an error
echo $undefinedVariable;
```

## Try It Yourself!

Add your own PHP code below and run it:

```php
// Your code here
```
