import * as assert from 'assert';
import { OutputDetector, OutputType } from '../../../formatting/outputDetector';
import { JsonFormatter } from '../../../formatting/formatters/jsonFormatter';
import { ArrayFormatter } from '../../../formatting/formatters/arrayFormatter';
import { ObjectFormatter } from '../../../formatting/formatters/objectFormatter';
import { StringFormatter } from '../../../formatting/formatters/stringFormatter';

suite('OutputDetector Tests', () => {
  test('Should detect JSON object correctly', () => {
    const json = '{"name": "John", "age": 30}';
    const result = OutputDetector.detectType(json);
    assert.strictEqual(result, OutputType.JSON);
  });

  test('Should detect JSON array correctly', () => {
    const json = '[1, 2, 3, 4]';
    const result = OutputDetector.detectType(json);
    assert.strictEqual(result, OutputType.Array);
  });

  test('Should detect PHP array correctly', () => {
    const phpArray = 'array(1, 2, 3, 4)';
    const result = OutputDetector.detectType(phpArray);
    assert.strictEqual(result, OutputType.PHPArray);
  });

  test('Should detect PHP object correctly', () => {
    const phpObject = 'object(stdClass)#1 (2) {"name":"John","age":30}';
    const result = OutputDetector.detectType(phpObject);
    assert.strictEqual(result, OutputType.PHPObject);
  });

  test('Should detect string correctly', () => {
    const text = 'Hello, world!';
    const result = OutputDetector.detectType(text);
    assert.strictEqual(result, OutputType.String);
  });

  test('Should detect number correctly', () => {
    const number = '42';
    const result = OutputDetector.detectType(number);
    assert.strictEqual(result, OutputType.String);
  });

  test('Should handle empty input correctly', () => {
    const empty = '';
    const result = OutputDetector.detectType(empty);
    assert.strictEqual(result, OutputType.String);
  });

  test('Should find JSON formatter for JSON input', () => {
    const json = '{"name": "John", "age": 30}';
    const formatters = [
      new JsonFormatter(),
      new ArrayFormatter(),
      new ObjectFormatter(),
      new StringFormatter()
    ];
    
    const formatter = OutputDetector.findFormatter(json, formatters);
    assert.ok(formatter instanceof JsonFormatter);
  });

  test('Should find Array formatter for PHP array input', () => {
    const phpArray = 'array(1, 2, 3, 4)';
    const formatters = [
      new JsonFormatter(),
      new ArrayFormatter(),
      new ObjectFormatter(),
      new StringFormatter()
    ];
    
    const formatter = OutputDetector.findFormatter(phpArray, formatters);
    assert.ok(formatter instanceof ArrayFormatter);
  });

  test('Should find Object formatter for PHP object input', () => {
    const phpObject = 'object(stdClass)#1 (2) {"name":"John","age":30}';
    const formatters = [
      new JsonFormatter(),
      new ArrayFormatter(),
      new ObjectFormatter(),
      new StringFormatter()
    ];
    
    const formatter = OutputDetector.findFormatter(phpObject, formatters);
    assert.ok(formatter instanceof ObjectFormatter);
  });

  test('Should fallback to String formatter for plain text', () => {
    const text = 'Hello, world!';
    const formatters = [
      new JsonFormatter(),
      new ArrayFormatter(),
      new ObjectFormatter(),
      new StringFormatter()
    ];
    
    const formatter = OutputDetector.findFormatter(text, formatters);
    assert.ok(formatter instanceof StringFormatter);
  });
});