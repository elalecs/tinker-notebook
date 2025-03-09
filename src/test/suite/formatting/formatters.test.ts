import * as assert from 'assert';
import { ExecutionResult } from '../../../execution/executor';
import { JsonFormatter } from '../../../formatting/formatters/jsonFormatter';
import { ArrayFormatter } from '../../../formatting/formatters/arrayFormatter';
import { ObjectFormatter } from '../../../formatting/formatters/objectFormatter';
import { StringFormatter } from '../../../formatting/formatters/stringFormatter';
import { FormattingOptions } from '../../../formatting/interfaces/outputFormatter.interface';

suite('Formatters Tests', () => {
  const defaultOptions: FormattingOptions = {
    collapsible: false,
    maxDepth: 3,
    highlightSyntax: false,
    showLineNumbers: false
  };

  const mockResult: ExecutionResult = {
    output: '',
    exitCode: 0,
    executionTime: 100
  };

  suite('JsonFormatter Tests', () => {
    const jsonFormatter = new JsonFormatter();

    test('Should correctly detect JSON objects', () => {
      assert.ok(jsonFormatter.canFormat('{"name": "John", "age": 30}'));
      assert.ok(jsonFormatter.canFormat('{"nested": {"foo": "bar"}}'));
      assert.ok(!jsonFormatter.canFormat('Not a JSON'));
      assert.ok(!jsonFormatter.canFormat('array(1, 2, 3)'));
    });

    test('Should format JSON objects properly', () => {
      const json = '{"name": "John", "age": 30}';
      const result: ExecutionResult = { ...mockResult, output: json };
      
      const formatted = jsonFormatter.format(result, defaultOptions);
      
      // Check that the formatted output contains the keys
      assert.ok(formatted.includes('"name"'));
      assert.ok(formatted.includes('"age"'));
      assert.ok(formatted.includes('John'));
      assert.ok(formatted.includes('30'));
    });

    test('Should respect maxDepth option', () => {
      const json = JSON.stringify({
        level1: {
          level2: {
            level3: {
              level4: {
                level5: "too deep"
              }
            }
          }
        }
      });
      
      const result: ExecutionResult = { ...mockResult, output: json };
      
      // With maxDepth 2
      const formatted = jsonFormatter.format(result, { ...defaultOptions, maxDepth: 2 });
      
      // Should include level2
      assert.ok(formatted.includes('level2'));
      
      // Should not include complete level4 value
      assert.ok(!formatted.includes('level5'));
      assert.ok(!formatted.includes('too deep'));
      
      // Should have ellipsis indicating truncation
      assert.ok(formatted.includes('...'));
    });

    test('Should create collapsible sections when requested', () => {
      const json = '{"name": "John", "age": 30}';
      const result: ExecutionResult = { ...mockResult, output: json };
      
      const formatted = jsonFormatter.format(result, { ...defaultOptions, collapsible: true });
      
      // Should have collapsible section markers
      assert.ok(formatted.includes('▼ JSON Output'));
      assert.ok(formatted.includes('▲ End of JSON Output'));
    });
  });

  suite('ArrayFormatter Tests', () => {
    const arrayFormatter = new ArrayFormatter();

    test('Should correctly detect PHP arrays', () => {
      assert.ok(arrayFormatter.canFormat('array(1, 2, 3)'));
      assert.ok(arrayFormatter.canFormat('array("foo" => "bar")'));
      assert.ok(!arrayFormatter.canFormat('{"name": "John"}'));
      assert.ok(!arrayFormatter.canFormat('Not an array'));
    });

    test('Should format PHP arrays properly', () => {
      const phpArray = 'array(1, 2, 3, "name" => "John")';
      const result: ExecutionResult = { ...mockResult, output: phpArray };
      
      const formatted = arrayFormatter.format(result, defaultOptions);
      
      // Check that the formatted output contains the elements
      assert.ok(formatted.includes('1'));
      assert.ok(formatted.includes('2'));
      assert.ok(formatted.includes('3'));
      assert.ok(formatted.includes('name'));
      assert.ok(formatted.includes('John'));
    });
  });

  suite('ObjectFormatter Tests', () => {
    const objectFormatter = new ObjectFormatter();

    test('Should correctly detect PHP objects', () => {
      assert.ok(objectFormatter.canFormat('object(stdClass)#1 (2) {"name":"John","age":30}'));
      assert.ok(objectFormatter.canFormat('App\\Models\\User::__set_state(array("id" => 1))'));
      assert.ok(!objectFormatter.canFormat('{"name": "John"}'));
      assert.ok(!objectFormatter.canFormat('Not an object'));
    });

    test('Should format PHP objects properly', () => {
      const phpObject = 'object(stdClass)#1 (2) {"name":"John","age":30}';
      const result: ExecutionResult = { ...mockResult, output: phpObject };
      
      const formatted = objectFormatter.format(result, defaultOptions);
      
      // Check that the formatted output contains class and properties
      assert.ok(formatted.includes('stdClass'));
      assert.ok(formatted.includes('name'));
      assert.ok(formatted.includes('John'));
      assert.ok(formatted.includes('age'));
      assert.ok(formatted.includes('30'));
    });
  });

  suite('StringFormatter Tests', () => {
    const stringFormatter = new StringFormatter();

    test('Should accept any input (fallback formatter)', () => {
      assert.ok(stringFormatter.canFormat('Hello, world!'));
      assert.ok(stringFormatter.canFormat('{"name": "John"}'));
      assert.ok(stringFormatter.canFormat('array(1, 2, 3)'));
    });

    test('Should format plain strings properly', () => {
      const text = 'Hello, world!';
      const result: ExecutionResult = { ...mockResult, output: text };
      
      const formatted = stringFormatter.format(result, defaultOptions);
      
      // Should keep the text intact
      assert.strictEqual(formatted, text);
    });

    test('Should detect and highlight PHP code', () => {
      const phpCode = `<?php
function hello($name) {
    echo "Hello, " . $name;
}
hello("World");`;

      const result: ExecutionResult = { ...mockResult, output: phpCode };
      
      const formatted = stringFormatter.format(result, { ...defaultOptions, highlightSyntax: true });
      
      // Should include syntax highlighting escape sequences
      assert.ok(formatted.includes('\x1b['));
    });

    test('Should add line numbers for multiline output when requested', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      const result: ExecutionResult = { ...mockResult, output: multilineText };
      
      const formatted = stringFormatter.format(result, { ...defaultOptions, showLineNumbers: true });
      
      // Should include line numbers
      assert.ok(formatted.includes('1 | Line 1'));
      assert.ok(formatted.includes('2 | Line 2'));
      assert.ok(formatted.includes('3 | Line 3'));
    });
  });
});