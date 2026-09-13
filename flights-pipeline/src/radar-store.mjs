import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// A separate v4 schema preserves the legacy table without rewriting its evidence.
export class RadarStore {
  constructor(path) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS radar_runs(id TEXT PRIMARY KEY, provider TEXT, started_at TEXT, finished_at TEXT, status TEXT, requests INTEGER DEFAULT 0, inserted INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS radar_queries(id TEXT PRIMARY KEY, slot TEXT, provider TEXT, query_json TEXT, purpose TEXT, created_at TEXT, last_attempt TEXT, last_success TEXT, retired INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS radar_attempts(id TEXT PRIMARY KEY, run_id TEXT, query_id TEXT, attempted_at TEXT, status TEXT, response_count INTEGER, error_code TEXT);
      CREATE TABLE IF NOT EXISTS radar_quotes(id TEXT PRIMARY KEY, run_id TEXT, query_id TEXT, fetched_at TEXT, source_at TEXT, expires_at TEXT, comparable_key TEXT, source_key TEXT, price REAL, payload_json TEXT);
      CREATE INDEX IF NOT EXISTS radar_quote_cohort ON radar_quotes(comparable_key, fetched_at);
      CREATE INDEX IF NOT EXISTS radar_attempt_time ON radar_attempts(attempted_at);
      CREATE TABLE IF NOT EXISTS radar_settings(key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS radar_reviews(id TEXT PRIMARY KEY, quote_id TEXT, revision TEXT, status TEXT, actor TEXT, reviewed_at TEXT, verification_json TEXT);
      CREATE TABLE IF NOT EXISTS radar_releases(id TEXT PRIMARY KEY, review_id TEXT, created_at TEXT, payload_json TEXT);
      CREATE TABLE IF NOT EXISTS radar_locks(name TEXT PRIMARY KEY, owner TEXT, expires_at TEXT);
    `);
  }
  transaction(fn) { this.db.exec('BEGIN IMMEDIATE'); try { const result = fn(); this.db.exec('COMMIT'); return result; } catch (e) { this.db.exec('ROLLBACK'); throw e; } }
  acquire(owner, now, durationMs = 20 * 60_000) {
    return this.transaction(() => {
      const lock = this.db.prepare('SELECT * FROM radar_locks WHERE name=?').get('collector');
      if (lock && lock.expires_at > now) return false;
      this.db.prepare('INSERT OR REPLACE INTO radar_locks VALUES (?, ?, ?)').run('collector', owner, new Date(Date.parse(now) + durationMs).toISOString());
      return true;
    });
  }
  release(owner) { this.db.prepare('DELETE FROM radar_locks WHERE name=? AND owner=?').run('collector', owner); }
  get(key, fallback = null) { const row = this.db.prepare('SELECT value FROM radar_settings WHERE key=?').get(key); return row ? JSON.parse(row.value) : fallback; }
  set(key, value) { this.db.prepare('INSERT OR REPLACE INTO radar_settings VALUES (?,?)').run(key, JSON.stringify(value)); }
  begin(provider, at) { const id = randomUUID(); this.db.prepare('INSERT INTO radar_runs(id,provider,started_at,status) VALUES(?,?,?,?)').run(id, provider, at, 'running'); return id; }
  finish(id, at, status, requests, inserted) { this.db.prepare('UPDATE radar_runs SET finished_at=?,status=?,requests=?,inserted=? WHERE id=?').run(at,status,requests,inserted,id); }
  attemptsSince(at, provider = null) {
    if(!provider)return this.db.prepare('SELECT count(*) n FROM radar_attempts WHERE attempted_at>=?').get(at).n;
    return this.db.prepare('SELECT count(*) n FROM radar_attempts a JOIN radar_queries q ON q.id=a.query_id WHERE a.attempted_at>=? AND q.provider=?').get(at,provider).n;
  }
  enqueue(provider, slot, query, purpose, at) {
    const id = digest([provider, query]);
    this.db.prepare('INSERT OR IGNORE INTO radar_queries(id,slot,provider,query_json,purpose,created_at) VALUES(?,?,?,?,?,?)').run(id,slot,provider,JSON.stringify(query),purpose,at);
    return id;
  }
  activeSlot(provider, slot, today) {
    const rows = this.db.prepare('SELECT * FROM radar_queries WHERE provider=? AND slot=? AND retired=0 ORDER BY created_at DESC').all(provider,slot);
    for (const row of rows) {
      if (JSON.parse(row.query_json).outbound.iso >= today) return row;
      this.db.prepare('UPDATE radar_queries SET retired=1 WHERE id=?').run(row.id);
    }
    return null;
  }
  due(provider, before, limit) {
    return this.db.prepare(`SELECT * FROM radar_queries WHERE provider=? AND retired=0 AND (last_attempt IS NULL OR last_attempt<?)
      ORDER BY CASE purpose WHEN 'baseline' THEN 0 ELSE 1 END, COALESCE(last_attempt,''), created_at, rowid LIMIT ?`).all(provider,before,limit);
  }
  attempt(runId, queryId, at, status, count = 0, error = null) {
    const id=randomUUID();
    this.db.prepare('INSERT INTO radar_attempts VALUES (?,?,?,?,?,?,?)').run(id,runId,queryId,at,status,count,error);
    this.db.prepare('UPDATE radar_queries SET last_attempt=?,last_success=CASE WHEN ? IN (\'ok\',\'empty\') THEN ? ELSE last_success END WHERE id=?').run(at,status,at,queryId);
    return id;
  }
  insert(quotes, runId, queryId) {
    return this.transaction(() => {
      let inserted = 0;
      const statement = this.db.prepare('INSERT OR IGNORE INTO radar_quotes VALUES(?,?,?,?,?,?,?,?,?,?)');
      for (const q of quotes) inserted += Number(statement.run(q.id,runId,queryId,q.fetchedAt,q.sourceAt,q.expiresAt,q.comparableKey,q.sourceKey,q.price,JSON.stringify(q)).changes);
      return inserted;
    });
  }
  quotes(since = '1970') { return this.db.prepare('SELECT payload_json FROM radar_quotes WHERE fetched_at>=? ORDER BY fetched_at').all(since).map(x=>JSON.parse(x.payload_json)); }
  health(now) {
    const end = Date.parse(now);
    const runs = this.db.prepare('SELECT * FROM radar_runs ORDER BY started_at DESC LIMIT 10').all();
    const queries = this.db.prepare('SELECT provider,count(*) queries,sum(last_success IS NOT NULL) checked,sum(last_success>=?) fresh FROM radar_queries WHERE retired=0 GROUP BY provider').all(new Date(end-86400000).toISOString());
    const attempts = this.db.prepare('SELECT status,count(*) n FROM radar_attempts WHERE attempted_at>=? GROUP BY status').all(new Date(end-86400000).toISOString());
    return { generatedAt:now, runs, queries, attempts, observations:this.db.prepare('SELECT count(*) n FROM radar_quotes').get().n, paused:this.get('paused',false), consecutiveFailedRuns:this.get('failedRuns',0) };
  }
  backup(path) { mkdirSync(dirname(path),{recursive:true,mode:0o700}); this.db.exec("VACUUM INTO '" + path.replaceAll("'","''") + "'"); const check = new DatabaseSync(path,{readOnly:true}); try { const r=check.prepare('PRAGMA integrity_check').get(); if(Object.values(r)[0]!=='ok') throw new Error('Backup integrity failed'); } finally {check.close();} return path; }
  close() { this.db.close(); }
}
