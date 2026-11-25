import { describe, expect, it } from 'vitest';
import { decide, filterRows } from './logic';
import config from './config.json';

describe('demo logic', () => {
  const rows = [['A one', 'Open'], ['B two', 'Done']];
  it('filters by query and status', () => {
    expect(filterRows(rows, 'two', 1, 'All')).toHaveLength(1);
    expect(filterRows(rows, '', 1, 'Open')).toEqual([['A one', 'Open']]);
  });
  it('records each decision once', () => {
    const item = { id: 'x', title: 't', detail: '', reason: '' };
    const log = decide([], item, 'approved');
    expect(decide(log, item, 'declined')).toBe(log);
  });
  it('config has founders-free demo data with rows and queue items', () => {
    expect(config.records.rows.length).toBeGreaterThan(5);
    expect(config.queue.items.length).toBeGreaterThan(2);
  });
});
