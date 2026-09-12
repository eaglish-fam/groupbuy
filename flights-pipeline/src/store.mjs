import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export class FareStore {
  constructor(path) {
    mkdirSync(dirname(path), { recursive: true });
    this.database = new DatabaseSync(path);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS fare_observations (
        observation_id TEXT PRIMARY KEY,
        fare_key TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_result_id TEXT NOT NULL,
        search_kind TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        outbound_date TEXT NOT NULL,
        inbound_date TEXT,
        adults INTEGER NOT NULL,
        cabin_class TEXT NOT NULL,
        currency TEXT NOT NULL,
        price_amount REAL NOT NULL,
        price_unit TEXT,
        is_direct INTEGER NOT NULL,
        carrier TEXT,
        booking_url TEXT,
        freshness TEXT NOT NULL,
        complete INTEGER NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS fare_observations_route_time
        ON fare_observations(origin, destination, observed_at DESC);
      CREATE INDEX IF NOT EXISTS fare_observations_fare_key_time
        ON fare_observations(fare_key, observed_at DESC);
    `);
    this.insertStatement = this.database.prepare(`
      INSERT INTO fare_observations (
        observation_id, fare_key, provider, provider_result_id, search_kind,
        observed_at, origin, destination, outbound_date, inbound_date, adults,
        cabin_class, currency, price_amount, price_unit, is_direct, carrier,
        booking_url, freshness, complete, payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  }

  insertMany(observations) {
    this.database.exec('BEGIN');
    try {
      for (const item of observations) {
        this.insertStatement.run(
          item.observationId,
          item.fareKey,
          item.provider,
          item.providerResultId,
          item.searchKind,
          item.observedAt,
          item.origin,
          item.destination,
          item.outboundDate,
          item.inboundDate,
          item.adults,
          item.cabinClass,
          item.currency,
          item.priceAmount,
          item.priceUnit,
          item.isDirect ? 1 : 0,
          item.carrier,
          item.bookingUrl,
          item.freshness,
          item.complete ? 1 : 0,
          JSON.stringify(item),
        );
      }
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
    return observations.length;
  }

  count() {
    return this.database.prepare('SELECT COUNT(*) AS count FROM fare_observations').get().count;
  }

  close() {
    this.database.close();
  }
}
