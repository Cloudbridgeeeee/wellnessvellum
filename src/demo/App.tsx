import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import config from './config.json';
import { decide, filterRows, type AuditEntry, type Decision, type QueueItem } from './logic';

type Tab = 'overview' | 'records' | 'queue' | 'audit';
const TABS: [Tab, string][] = [['overview', config.tabs.overview], ['records', config.tabs.records], ['queue', config.tabs.queue], ['audit', 'Audit log']];
const KEY = `${config.name.toLowerCase()}-demo-audit`;

function useTab(): [Tab, (t: Tab) => void] {
  const read = () => (TABS.find(([t]) => location.hash === `#${t}`)?.[0] ?? 'overview');
  const [tab, setTab] = useState<Tab>(read);
  useEffect(() => { const f = () => setTab(read()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return [tab, (t) => { location.hash = t; setTab(t); }];
}

export default function App() {
  const [tab, setTab] = useTab();
  const [log, setLog] = useState<AuditEntry[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(log)), [log]);
  const style = { '--accent': config.accent, '--ink': config.ink, '--bg': config.bg, '--surface': config.surface, '--f-display': config.fontDisplay, '--f-text': config.fontText } as CSSProperties;
  return (
    <div className="dm" style={style}>
      <header className="dm-top">
        <a className="dm-logo" href="/">{config.name}</a>
        <span className="dm-client">{config.client}</span>
        <a className="dm-btn dm-btn--primary" href="/#pilot">{config.primary}</a>
      </header>
      <p className="dm-note">{config.note}</p>
      <nav className="dm-tabs" role="tablist" aria-label="Workspace">
        {TABS.map(([t, label]) => (
          <button key={t} role="tab" aria-selected={tab === t} className="dm-tab" onClick={() => setTab(t)}>
            {label}{t === 'queue' && <span className="dm-count">{config.queue.items.length - log.length}</span>}
          </button>
        ))}
      </nav>
      <main className="dm-view" key={tab}>
        {tab === 'overview' && <Overview />}
        {tab === 'records' && <Records />}
        {tab === 'queue' && <Queue log={log} onDecide={(i, d) => setLog((l) => decide(l, i, d))} />}
        {tab === 'audit' && <Audit log={log} onReset={() => setLog([])} />}
      </main>
    </div>
  );
}

function Overview() {
  const c = config.overview.chart;
  const max = Math.max(...c.values, c.threshold ?? 0) * 1.15;
  return (
    <>
      <h1 className="dm-h1">{config.overview.title}</h1>
      <dl className="dm-kpis">{config.overview.kpis.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>
      <section className="dm-card">
        <h2>{c.title}</h2>
        <div className="dm-chart" role="img" aria-label={c.title}>
          {c.threshold != null && <div className="dm-limit" style={{ bottom: `${(c.threshold / max) * 100}%` }}><span>{c.thresholdLabel}</span></div>}
          {c.values.map((v, i) => (
            <div key={i} className="dm-col">
              <div className={`dm-bar ${c.threshold != null && v > c.threshold ? 'is-over' : ''}`} style={{ height: `${(v / max) * 100}%`, '--i': i } as CSSProperties} title={`${c.labels[i]}: ${v}`} />
              <span>{c.labels[i]}</span>
            </div>
          ))}
        </div>
        <p className="dm-foot">{c.caption}</p>
      </section>
    </>
  );
}

function Records() {
  const r = config.records;
  const statuses = useMemo(() => ['All', ...new Set(r.rows.map((x) => x[r.statusCol]!))], [r]);
  const [q, setQ] = useState('');
  const [st, setSt] = useState('All');
  const rows = filterRows(r.rows, q, r.statusCol, st);
  return (
    <>
      <h1 className="dm-h1">{r.title}</h1>
      <div className="dm-filters">
        <label>Search<input value={q} onChange={(e) => setQ(e.target.value)} placeholder={r.searchHint} /></label>
        <label>Status<select value={st} onChange={(e) => setSt(e.target.value)}>{statuses.map((s) => <option key={s}>{s}</option>)}</select></label>
        <span className="dm-meta">{rows.length} of {r.rows.length}</span>
      </div>
      <div className="dm-table-wrap">
        <table className="dm-table">
          <thead><tr>{r.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.join()}>{row.map((cell, i) => <td key={i}>{i === r.statusCol ? <span className={`dm-chip dm-chip--${r.tones[cell as keyof typeof r.tones] ?? 'plain'}`}>{cell}</span> : cell}</td>)}</tr>)}</tbody>
        </table>
        {!rows.length && <p className="dm-empty">No records match “{q}”. Clear the search or pick another status.</p>}
      </div>
    </>
  );
}

function Queue({ log, onDecide }: { log: AuditEntry[]; onDecide: (i: QueueItem, d: Decision) => void }) {
  return (
    <>
      <h1 className="dm-h1">{config.queue.title}</h1>
      <p className="dm-lead">{config.queue.lead}</p>
      <ul className="dm-queue">
        {config.queue.items.map((it) => {
          const done = log.find((e) => e.id === it.id);
          return (
            <li key={it.id} className={`dm-card dm-item ${done ? 'is-done' : ''}`}>
              <div><h2>{it.title}</h2><p>{it.detail}</p><p className="dm-why">{it.reason}</p></div>
              {done ? <span className={`dm-chip dm-chip--${done.decision === 'approved' ? 'good' : 'bad'}`}>{done.decision === 'approved' ? 'Approved' : 'Declined'}</span> : (
                <div className="dm-actions"><button className="dm-btn dm-btn--primary" onClick={() => onDecide(it, 'approved')}>Approve</button><button className="dm-btn" onClick={() => onDecide(it, 'declined')}>Decline</button></div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Audit({ log, onReset }: { log: AuditEntry[]; onReset: () => void }) {
  return (
    <>
      <div className="dm-row"><h1 className="dm-h1">Audit log</h1>{log.length > 0 && <button className="dm-btn" onClick={onReset}>Reset demo</button>}</div>
      {log.length === 0 ? <p className="dm-empty">No decisions yet. Approve or decline an item in “{config.tabs.queue}” and it is recorded here with the time.</p> : (
        <ul className="dm-audit">{log.map((e) => <li key={e.id}><time>{new Date(e.at).toLocaleString()}</time><span>{e.title}</span><span className={`dm-chip dm-chip--${e.decision === 'approved' ? 'good' : 'bad'}`}>{e.decision === 'approved' ? 'Approved' : 'Declined'}</span></li>)}</ul>
      )}
    </>
  );
}
