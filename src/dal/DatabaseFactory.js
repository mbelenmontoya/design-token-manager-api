import { MongoAdapter } from './adapters/MongoAdapter.js';
import { SupabaseAdapter } from './adapters/SupabaseAdapter.js';
import { DualWriteAdapter } from './adapters/DualWriteAdapter.js';

/**
 * Database Factory
 * Creates the appropriate database adapter based on environment configuration
 */
export class DatabaseFactory {
  static createReadAdapter() {
    const readMode = process.env.DB_READS || 'mongo';
    
    switch (readMode) {
      case 'mongo':
        return new MongoAdapter();
      case 'supabase':
        return new SupabaseAdapter();
      default:
        throw new Error(`Unsupported read mode: ${readMode}. Use 'mongo' or 'supabase'`);
    }
  }

  static createWriteAdapter() {
    const writeMode = process.env.DB_WRITES || 'mongo';
    
    switch (writeMode) {
      case 'mongo':
        return new MongoAdapter();
      case 'supabase':
        return new SupabaseAdapter();
      case 'dual':
        return new DualWriteAdapter();
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