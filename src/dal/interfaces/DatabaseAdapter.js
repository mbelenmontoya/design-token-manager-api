/**
 * Database Adapter Interface
 * Defines the contract for database operations across different providers
 */
export class DatabaseAdapter {
  // Connection methods
  async connect() {
    throw new Error('connect method must be implemented');
  }

  async disconnect() {
    throw new Error('disconnect method must be implemented');
  }

  async healthCheck() {
    throw new Error('healthCheck method must be implemented');
  }

  // User operations
  async createUser(userData) {
    throw new Error('createUser method must be implemented');
  }

  async findUserById(id) {
    throw new Error('findUserById method must be implemented');
  }

  async findUserByUsername(username) {
    throw new Error('findUserByUsername method must be implemented');
  }

  async updateUser(id, userData) {
    throw new Error('updateUser method must be implemented');
  }

  async deleteUser(id) {
    throw new Error('deleteUser method must be implemented');
  }

  // Tenant operations
  async createTenant(tenantData) {
    throw new Error('createTenant method must be implemented');
  }

  async findTenantById(id) {
    throw new Error('findTenantById method must be implemented');
  }

  async findTenantByName(name) {
    throw new Error('findTenantByName method must be implemented');
  }

  async updateTenant(id, tenantData) {
    throw new Error('updateTenant method must be implemented');
  }

  async deleteTenant(id) {
    throw new Error('deleteTenant method must be implemented');
  }

  // Project operations
  async createProject(projectData) {
    throw new Error('createProject method must be implemented');
  }

  async findProjectById(id) {
    throw new Error('findProjectById method must be implemented');
  }

  async findProjectsByTenant(tenantId) {
    throw new Error('findProjectsByTenant method must be implemented');
  }

  async updateProject(id, projectData) {
    throw new Error('updateProject method must be implemented');
  }

  async deleteProject(id) {
    throw new Error('deleteProject method must be implemented');
  }

  // Token operations
  async createToken(tokenData) {
    throw new Error('createToken method must be implemented');
  }

  async findTokenById(id) {
    throw new Error('findTokenById method must be implemented');
  }

  async findTokensByProject(projectId, options = {}) {
    throw new Error('findTokensByProject method must be implemented');
  }

  async findTokensByTenant(tenantId, options = {}) {
    throw new Error('findTokensByTenant method must be implemented');
  }

  // Token counts
  async countTokensByProject(projectId, options = {}) {
    throw new Error('countTokensByProject method must be implemented');
  }

  async countTokensByTenant(tenantId, options = {}) {
    throw new Error('countTokensByTenant method must be implemented');
  }

  async updateToken(id, tokenData) {
    throw new Error('updateToken method must be implemented');
  }

  async deleteToken(id) {
    throw new Error('deleteToken method must be implemented');
  }

  async searchTokens(query, options = {}) {
    throw new Error('searchTokens method must be implemented');
  }

  // Membership operations
  async createMembership(membershipData) {
    throw new Error('createMembership method must be implemented');
  }

  async findMembershipById(id) {
    throw new Error('findMembershipById method must be implemented');
  }

  async findMembershipsByUser(userId) {
    throw new Error('findMembershipsByUser method must be implemented');
  }

  async findMembershipsByTenant(tenantId) {
    throw new Error('findMembershipsByTenant method must be implemented');
  }

  async updateMembership(id, membershipData) {
    throw new Error('updateMembership method must be implemented');
  }

  async deleteMembership(id) {
    throw new Error('deleteMembership method must be implemented');
  }

  // API Key operations
  async createApiKey(apiKeyData) {
    throw new Error('createApiKey method must be implemented');
  }

  async findApiKeyById(id) {
    throw new Error('findApiKeyById method must be implemented');
  }

  async findApiKeyByHash(hashedKey) {
    throw new Error('findApiKeyByHash method must be implemented');
  }

  async findApiKeysByProject(projectId) {
    throw new Error('findApiKeysByProject method must be implemented');
  }

  async updateApiKey(id, apiKeyData) {
    throw new Error('updateApiKey method must be implemented');
  }

  async deleteApiKey(id) {
    throw new Error('deleteApiKey method must be implemented');
  }

  // Atomic API key rotation (update only if previous hash matches)
  async rotateApiKey(id, prevHashedKey, newHashedKey) {
    throw new Error('rotateApiKey method must be implemented');
  }

  // Invitation operations
  async createInvitation(invitationData) {
    throw new Error('createInvitation method must be implemented');
  }

  async findInvitationById(id) {
    throw new Error('findInvitationById method must be implemented');
  }

  async findInvitationByToken(tokenHash) {
    throw new Error('findInvitationByToken method must be implemented');
  }

  async findInvitationsByTenant(tenantId) {
    throw new Error('findInvitationsByTenant method must be implemented');
  }

  async updateInvitation(id, invitationData) {
    throw new Error('updateInvitation method must be implemented');
  }

  async deleteInvitation(id) {
    throw new Error('deleteInvitation method must be implemented');
  }

  // Category operations
  async createCategory(categoryData) {
    throw new Error('createCategory method must be implemented');
  }

  async findAllCategories() {
    throw new Error('findAllCategories method must be implemented');
  }

  async findCategoryByName(name) {
    throw new Error('findCategoryByName method must be implemented');
  }

  async updateCategory(id, categoryData) {
    throw new Error('updateCategory method must be implemented');
  }

  async deleteCategory(id) {
    throw new Error('deleteCategory method must be implemented');
  }

  // Token Release operations
  async createTokenRelease(releaseData) {
    throw new Error('createTokenRelease method must be implemented');
  }

  async findTokenReleaseById(id) {
    throw new Error('findTokenReleaseById method must be implemented');
  }

  async findTokenReleases(options = {}) {
    throw new Error('findTokenReleases method must be implemented');
  }
  // Project assignments
  async findProjectAssignmentsByProject(projectId) {
    throw new Error('findProjectAssignmentsByProject must be implemented');
  }
  // Project assignments
  async findProjectAssignmentsByUser(userId) {
    throw new Error('findProjectAssignmentsByUser must be implemented');
  }
  async findAssignedProjectsByUser(userId, tenantId) {
    throw new Error('findAssignedProjectsByUser must be implemented');
  }
  async hasProjectAssignment(userId, projectId) {
    throw new Error('hasProjectAssignment must be implemented');
  }
  async createProjectAssignment(data) {
    throw new Error('createProjectAssignment must be implemented');
  }
  async deleteProjectAssignment(userId, projectId) {
    throw new Error('deleteProjectAssignment must be implemented');
  }

  async updateTokenRelease(id, releaseData) {
    throw new Error('updateTokenRelease method must be implemented');
  }

  async deleteTokenRelease(id) {
    throw new Error('deleteTokenRelease method must be implemented');
  }

  // Transaction operations (for dual-write scenarios)
  async beginTransaction() {
    throw new Error('beginTransaction method must be implemented');
  }

  async commitTransaction() {
    throw new Error('commitTransaction method must be implemented');
  }

  async rollbackTransaction() {
    throw new Error('rollbackTransaction method must be implemented');
  }
}
