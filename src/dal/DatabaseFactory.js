import { SupabaseAdapter } from './adapters/SupabaseAdapter.js';

/**
 * Database Factory
 * Creates the appropriate database adapter based on environment configuration
 */
export class DatabaseFactory {
  static async createReadAdapter() {
    const readMode = process.env.DB_READS || 'mongo';
    
    switch (readMode) {
      case 'mongo':
        // Lazy-load to avoid importing Mongo wiring when unused
        return new (await import('./adapters/MongoAdapter.js')).MongoAdapter();
      case 'supabase':
        return new SupabaseAdapter();
      default:
        throw new Error(`Unsupported read mode: ${readMode}. Use 'mongo' or 'supabase'`);
    }
  }

  static async createWriteAdapter() {
    const writeMode = process.env.DB_WRITES || 'mongo';
    
    switch (writeMode) {
      case 'mongo':
        // Lazy-load to avoid importing Mongo wiring when unused
        return new (await import('./adapters/MongoAdapter.js')).MongoAdapter();
      case 'supabase':
        return new SupabaseAdapter();
      case 'dual':
        // Lazy-load to avoid importing Mongo wiring when unused
        return new (await import('./adapters/DualWriteAdapter.js')).DualWriteAdapter();
      default:
        throw new Error(`Unsupported write mode: ${writeMode}. Use 'mongo', 'supabase', or 'dual'`);
    }
  }

  static getConfiguration() {
    return {
      reads: process.env.DB_READS || 'mongo',
      writes: process.env.DB_WRITES || 'mongo'
    };
  }
}
