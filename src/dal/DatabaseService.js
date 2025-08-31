import { DatabaseFactory } from './DatabaseFactory.js';

/**
 * Database Service
 * Main interface for database operations throughout the application
 */
class DatabaseService {
  constructor() {
    this.readAdapter = null;
    this.writeAdapter = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.readAdapter = DatabaseFactory.createReadAdapter();
      this.writeAdapter = DatabaseFactory.createWriteAdapter();

      await this.readAdapter.connect();
      if (this.readAdapter !== this.writeAdapter) {
        await this.writeAdapter.connect();
      }

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize database service: ${error.message}`);
    }
  }

  async disconnect() {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.readAdapter.disconnect();
      if (this.readAdapter !== this.writeAdapter) {
        await this.writeAdapter.disconnect();
      }
      this.isInitialized = false;
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  async healthCheck() {
    const readHealth = await this.readAdapter.healthCheck();
    const writeHealth = this.readAdapter === this.writeAdapter ? 
      readHealth : 
      await this.writeAdapter.healthCheck();

    return {
      read: readHealth,
      write: writeHealth,
      configuration: DatabaseFactory.getConfiguration()
    };
  }

  // Read operations
  async findUserById(id) {
    return this.readAdapter.findUserById(id);
  }

  async findUserByUsername(username) {
    return this.readAdapter.findUserByUsername(username);
  }

  async findTenantById(id) {
    return this.readAdapter.findTenantById(id);
  }

  async findTenantByName(name) {
    return this.readAdapter.findTenantByName(name);
  }

  async findProjectById(id) {
    return this.readAdapter.findProjectById(id);
  }

  async findProjectsByTenant(tenantId) {
    return this.readAdapter.findProjectsByTenant(tenantId);
  }

  async findTokenById(id) {
    return this.readAdapter.findTokenById(id);
  }

  async findTokensByProject(projectId, options = {}) {
    return this.readAdapter.findTokensByProject(projectId, options);
  }

  async findTokensByTenant(tenantId, options = {}) {
    return this.readAdapter.findTokensByTenant(tenantId, options);
  }

  async searchTokens(query, options = {}) {
    return this.readAdapter.searchTokens(query, options);
  }

  async findMembershipById(id) {
    return this.readAdapter.findMembershipById(id);
  }

  async findMembershipsByUser(userId) {
    return this.readAdapter.findMembershipsByUser(userId);
  }

  async findMembershipsByTenant(tenantId) {
    return this.readAdapter.findMembershipsByTenant(tenantId);
  }

  async findApiKeyById(id) {
    return this.readAdapter.findApiKeyById(id);
  }

  async findApiKeyByHash(hashedKey) {
    return this.readAdapter.findApiKeyByHash(hashedKey);
  }

  async findApiKeysByProject(projectId) {
    return this.readAdapter.findApiKeysByProject(projectId);
  }

  async findInvitationById(id) {
    return this.readAdapter.findInvitationById(id);
  }

  async findInvitationByToken(tokenHash) {
    return this.readAdapter.findInvitationByToken(tokenHash);
  }

  async findInvitationsByTenant(tenantId) {
    return this.readAdapter.findInvitationsByTenant(tenantId);
  }

  async findAllCategories() {
    return this.readAdapter.findAllCategories();
  }

  async findCategoryByName(name) {
    return this.readAdapter.findCategoryByName(name);
  }

  async findTokenReleaseById(id) {
    return this.readAdapter.findTokenReleaseById(id);
  }

  async findTokenReleases(options = {}) {
    return this.readAdapter.findTokenReleases(options);
  }

  // Write operations
  async createUser(userData) {
    return this.writeAdapter.createUser(userData);
  }

  async updateUser(id, userData) {
    return this.writeAdapter.updateUser(id, userData);
  }

  async deleteUser(id) {
    return this.writeAdapter.deleteUser(id);
  }

  async createTenant(tenantData) {
    return this.writeAdapter.createTenant(tenantData);
  }

  async updateTenant(id, tenantData) {
    return this.writeAdapter.updateTenant(id, tenantData);
  }

  async deleteTenant(id) {
    return this.writeAdapter.deleteTenant(id);
  }

  async createProject(projectData) {
    return this.writeAdapter.createProject(projectData);
  }

  async updateProject(id, projectData) {
    return this.writeAdapter.updateProject(id, projectData);
  }

  async deleteProject(id) {
    return this.writeAdapter.deleteProject(id);
  }

  async createToken(tokenData) {
    return this.writeAdapter.createToken(tokenData);
  }

  async updateToken(id, tokenData) {
    return this.writeAdapter.updateToken(id, tokenData);
  }

  async deleteToken(id) {
    return this.writeAdapter.deleteToken(id);
  }

  async createMembership(membershipData) {
    return this.writeAdapter.createMembership(membershipData);
  }

  async updateMembership(id, membershipData) {
    return this.writeAdapter.updateMembership(id, membershipData);
  }

  async deleteMembership(id) {
    return this.writeAdapter.deleteMembership(id);
  }

  async createApiKey(apiKeyData) {
    return this.writeAdapter.createApiKey(apiKeyData);
  }

  async updateApiKey(id, apiKeyData) {
    return this.writeAdapter.updateApiKey(id, apiKeyData);
  }

  async deleteApiKey(id) {
    return this.writeAdapter.deleteApiKey(id);
  }

  async createInvitation(invitationData) {
    return this.writeAdapter.createInvitation(invitationData);
  }

  async updateInvitation(id, invitationData) {
    return this.writeAdapter.updateInvitation(id, invitationData);
  }

  async deleteInvitation(id) {
    return this.writeAdapter.deleteInvitation(id);
  }

  async createCategory(categoryData) {
    return this.writeAdapter.createCategory(categoryData);
  }

  async updateCategory(id, categoryData) {
    return this.writeAdapter.updateCategory(id, categoryData);
  }

  async deleteCategory(id) {
    return this.writeAdapter.deleteCategory(id);
  }

  async createTokenRelease(releaseData) {
    return this.writeAdapter.createTokenRelease(releaseData);
  }

  async updateTokenRelease(id, releaseData) {
    return this.writeAdapter.updateTokenRelease(id, releaseData);
  }

  async deleteTokenRelease(id) {
    return this.writeAdapter.deleteTokenRelease(id);
  }
}

// Export singleton instance
const databaseService = new DatabaseService();
export default databaseService;