import { test } from 'node:test';
import assert from 'node:assert';
import { evaluateMath } from './math.js';

test('evaluateMath handles simple operations', () => {
  assert.strictEqual(evaluateMath('1+1'), 2);
  assert.strictEqual(evaluateMath('5-3'), 2);
  assert.strictEqual(evaluateMath('4*2'), 8);
  assert.strictEqual(evaluateMath('10/2'), 5);
});

test('evaluateMath handles operator precedence', () => {
  assert.strictEqual(evaluateMath('1+2*3'), 7);
  assert.strictEqual(evaluateMath('10-4/2'), 8);
  assert.strictEqual(evaluateMath('2*3+4*5'), 26);
});

test('evaluateMath handles floating point numbers', () => {
  assert.strictEqual(evaluateMath('1.5+2.5'), 4);
  // Use a small epsilon for floating point comparison
  const result = evaluateMath('0.1*0.2');
  assert.ok(Math.abs(result - 0.02) < 1e-10);
});

test('evaluateMath handles unary operators', () => {
  assert.strictEqual(evaluateMath('-5+3'), -2);
  assert.strictEqual(evaluateMath('5+-3'), 2);
  assert.strictEqual(evaluateMath('--5'), 5);
});

test('evaluateMath handles empty input', () => {
  assert.strictEqual(evaluateMath(''), 0);
  assert.strictEqual(evaluateMath('  '), 0);
});

test('evaluateMath throws on division by zero', () => {
  assert.throws(() => evaluateMath('5/0'), { message: 'Division by zero' });
});

test('evaluateMath throws on invalid input', () => {
  assert.throws(() => evaluateMath('1+a'), /Expected number/);
  assert.throws(() => evaluateMath('1++'), /Expected number/);
});

test('evaluateMath throws on malicious input', () => {
  assert.throws(() => evaluateMath('alert(1)'), /Expected number/);
  assert.throws(() => evaluateMath('Function("return 1")()'), /Expected number/);
});
