import { describe, expect, it } from 'vitest';
import { getRewatchOrder, wouldCreateCycle } from '../src/logic/rewatch.js';

// 1 Iron Man, 2 First Avenger, 3 Avengers, 4 Civil War,
// 5 Ragnarok, 6 Infinity War, 7 Endgame, 8 Doomsday
const graph = new Map([
  [3, [1, 2]],
  [4, [3]],
  [6, [4, 5]],
  [7, [6]],
  [8, [7]],
]);

describe('getRewatchOrder', () => {
  it('Doomsday needs all 7 other movies, prerequisites first', () => {
    const order = getRewatchOrder(8, graph);

    expect([...order].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(order).not.toContain(8);

    order.forEach((id, index) => {
      for (const prerequisite of graph.get(id) ?? []) {
        expect(order.indexOf(prerequisite)).toBeLessThan(index);
      }
    });
  });

  it('Civil War needs Iron Man and First Avenger, then The Avengers', () => {
    const order = getRewatchOrder(4, graph);
    expect(order.slice(0, 2).sort()).toEqual([1, 2]);
    expect(order[2]).toBe(3);
    expect(order).toHaveLength(3);
  });

  it('Ragnarok has no prerequisites -> empty list', () => {
    expect(getRewatchOrder(5, graph)).toEqual([]);
  });

  it('lists a shared prerequisite only once (diamond)', () => {
    const diamond = new Map([
      [2, [1]],
      [3, [1]],
      [4, [2, 3]],
    ]);
    const order = getRewatchOrder(4, diamond);
    expect(order.filter((id) => id === 1)).toHaveLength(1);
    expect(order).toHaveLength(3);
  });
});

describe('wouldCreateCycle', () => {
  it('Endgame as a prerequisite of Iron Man is a cycle', () => {
    expect(wouldCreateCycle(1, [7], graph)).toBe(true);
  });

  it('a movie cannot require itself', () => {
    expect(wouldCreateCycle(1, [1], graph)).toBe(true);
  });

  it('a direct two-movie loop is a cycle', () => {
    expect(wouldCreateCycle(3, [4], graph)).toBe(true);
  });

  it('valid new prerequisites are allowed', () => {
    expect(wouldCreateCycle(5, [1, 2], graph)).toBe(false);
    expect(wouldCreateCycle(1, [], graph)).toBe(false);
  });
});