import { DatabaseAdapter } from '../interfaces/DatabaseAdapter.js';

/**
 * Supabase Adapter
 * Implements DatabaseAdapter interface using Prisma and Supabase
 * TODO: Full implementation in PR #5
 */
export class SupabaseAdapter extends DatabaseAdapter {
  constructor() {
    super();
    throw new Error('SupabaseAdapter not yet implemented. Coming in PR #5.');
  }
}