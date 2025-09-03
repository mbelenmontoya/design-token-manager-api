import { SupabaseAdapter } from './adapters/SupabaseAdapter.js';

/**
 * Database Factory
 * Creates the appropriate database adapter based on environment configuration
 */
export class DatabaseFactory {
  static createReadAdapter() {
    return new SupabaseAdapter();
  }

  static createWriteAdapter() {
    return new SupabaseAdapter();
  }

  static getConfiguration() {
    return { reads: 'supabase', writes: 'supabase' };
  }
}
