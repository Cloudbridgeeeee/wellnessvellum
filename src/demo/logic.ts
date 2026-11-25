export type Decision = 'approved' | 'declined';
export interface QueueItem { id: string; title: string; detail: string; reason: string }
export interface AuditEntry { at: string; id: string; title: string; decision: Decision }

/** Rows whose cells contain the query (case-insensitive) and whose status matches the filter. */
export function filterRows(rows: string[][], query: string, statusCol: number, status: string) {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => (status === 'All' || r[statusCol] === status) && (!q || r.some((c) => c.toLowerCase().includes(q))));
}

/** Records a decision once per item; a second decision on the same item is ignored. */
export function decide(log: AuditEntry[], item: QueueItem, decision: Decision, now = new Date()): AuditEntry[] {
  if (log.some((e) => e.id === item.id)) return log;
  return [{ at: now.toISOString(), id: item.id, title: item.title, decision }, ...log];
}
