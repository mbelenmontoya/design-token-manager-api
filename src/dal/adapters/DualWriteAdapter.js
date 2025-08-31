import { DatabaseAdapter } from '../interfaces/DatabaseAdapter.js';

/**
 * Dual Write Adapter
 * Implements DatabaseAdapter interface by writing to both MongoDB and Supabase
 * TODO: Full implementation in PR #6
 */
export class DualWriteAdapter extends DatabaseAdapter {
  constructor() {
    super();
    throw new Error('DualWriteAdapter not yet implemented. Coming in PR #6.');
  }
}