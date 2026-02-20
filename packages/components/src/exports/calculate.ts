export function calculate(
  a: number,
  b: number,
  operation: 'add' | 'subtract' | 'multiply' | 'divide' = 'add',
): number {
  switch (operation) {
    case 'add':
      return a + b
    case 'subtract':
      return a - b
    case 'multiply':
      return a * b
    case 'divide':
      return a / b
  }
}
