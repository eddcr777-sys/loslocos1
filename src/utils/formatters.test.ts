import { formatCount } from './formatters';

describe('formatCount', () => {
  test('debe retornar el número como string si es menor a 1000', () => {
    expect(formatCount(999)).toBe('999');
    expect(formatCount(0)).toBe('0');
    expect(formatCount(500)).toBe('500');
  });

  test('debe formatear miles con sufijo "k"', () => {
    expect(formatCount(1000)).toBe('1k');
    expect(formatCount(1250)).toBe('1.3k'); // Redondeo a 1 decimal
    expect(formatCount(1500)).toBe('1.5k');
    expect(formatCount(9500)).toBe('9.5k');
  });

  test('debe formatear millones con sufijo "++"', () => {
    expect(formatCount(1000000)).toBe('1++');
    expect(formatCount(1200000)).toBe('1.2++');
    expect(formatCount(2500000)).toBe('2.5++');
  });

  test('debe formatear miles de millones con sufijo "°"', () => {
    expect(formatCount(1000000000)).toBe('1°');
    expect(formatCount(1500000000)).toBe('1.5°');
    expect(formatCount(2000000000)).toBe('2°');
  });
});