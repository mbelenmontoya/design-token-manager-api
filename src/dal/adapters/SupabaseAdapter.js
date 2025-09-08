import { DatabaseAdapter } from '../interfaces/DatabaseAdapter.js';
import prisma from '../../config/prisma.js';

/**
 * Supabase Adapter
 * Implements DatabaseAdapter interface using Prisma (PostgreSQL on Supabase)
 */
export class SupabaseAdapter extends DatabaseAdapter {
  constructor() {
    super();
    this.isConnected = false;
  }

  // Connection methods
  async connect() {
    if (this.isConnected) return;
    try {
      await prisma.$connect();
      this.isConnected = true;
    } catch (err) {
      throw new Error(`Supabase (Prisma) connect failed: ${err.message}`);
    }
  }

  async disconnect() {
    try {
      await prisma.$disconnect();
      this.isConnected = false;
    } catch (_err) {
      // ignore
    }
  }

  async healthCheck() {
    try {
      const start = Date.now();
      const res = await prisma.$queryRaw`SELECT 1 as ok`;
      const elapsed = Date.now() - start;
      return {
        status: 'healthy',
        connection: 'connected',
        database: 'supabase-postgres',
        adapter: 'SupabaseAdapter',
        elapsedMs: elapsed,
        result: res
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connection: 'error',
        database: 'supabase-postgres',
        adapter: 'SupabaseAdapter',
        error: error.message
      };
    }
  }

  // User operations
  async createUser(userData) {
    return prisma.user.create({ data: userData });
  }
  async findUserById(id) {
    return prisma.user.findUnique({ where: { id } });
  }
  async findUserByUsername(username) {
    return prisma.user.findUnique({ where: { username } });
  }
  async updateUser(id, userData) {
    return prisma.user.update({ where: { id }, data: userData });
  }
  async deleteUser(id) {
    return prisma.user.delete({ where: { id } });
  }

  // Tenant operations
  async createTenant(tenantData) {
    return prisma.tenant.create({ data: tenantData });
  }
  async findTenantById(id) {
    return prisma.tenant.findUnique({ where: { id } });
  }
  async findTenantByName(name) {
    return prisma.tenant.findUnique({ where: { name } });
  }
  async updateTenant(id, tenantData) {
    return prisma.tenant.update({ where: { id }, data: tenantData });
  }
  async deleteTenant(id) {
    return prisma.tenant.delete({ where: { id } });
  }

  // Project operations
  async createProject(projectData) {
    return prisma.project.create({ data: projectData });
  }
  async findProjectById(id) {
    return prisma.project.findUnique({ where: { id }, include: { tenant: true } });
  }
  async findProjectsByTenant(tenantId) {
    return prisma.project.findMany({ where: { tenantId }, include: { tenant: true } });
  }
  async updateProject(id, projectData) {
    return prisma.project.update({ where: { id }, data: projectData });
  }
  async deleteProject(id) {
    return prisma.project.delete({ where: { id } });
  }

  // Token operations
  async createToken(tokenData) {
    const { tenant, tenantId, project, projectId, ...rest } = tokenData || {};
    const data = {
      ...rest,
      tenantId: tenantId || (tenant && (tenant.id || tenant)) || undefined,
      projectId: projectId || (project && (project.id || project)) || undefined,
    };
    return prisma.token.create({ data });
  }
  async findTokenById(id) {
    return prisma.token.findUnique({ where: { id } });
  }
  async findTokensByProject(projectId, options = {}) {
    const where = { projectId };
    if (options.category) where.category = options.category;
    if (options.name) where.name = options.name;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { value: { contains: options.search, mode: 'insensitive' } },
      ];
    }
    return prisma.token.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: options.skip ? parseInt(options.skip) : undefined,
      take: options.limit ? parseInt(options.limit) : undefined,
    });
  }
  async findTokensByTenant(tenantId, options = {}) {
    const where = { tenantId };
    if (options.category) where.category = options.category;
    if (options.name) where.name = options.name;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { value: { contains: options.search, mode: 'insensitive' } },
      ];
    }
    return prisma.token.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: options.skip ? parseInt(options.skip) : undefined,
      take: options.limit ? parseInt(options.limit) : undefined,
    });
  }
  async countTokensByProject(projectId, options = {}) {
    const where = { projectId };
    if (options.category) where.category = options.category;
    if (options.name) where.name = options.name;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }
    return prisma.token.count({ where });
  }
  async countTokensByTenant(tenantId, options = {}) {
    const where = { tenantId };
    if (options.category) where.category = options.category;
    if (options.name) where.name = options.name;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }
    return prisma.token.count({ where });
  }
  async updateToken(id, tokenData) {
    return prisma.token.update({ where: { id }, data: tokenData });
  }
  async deleteToken(id) {
    return prisma.token.delete({ where: { id } });
  }
  async searchTokens(query, options = {}) {
    const where = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { value: { contains: query, mode: 'insensitive' } },
      ]
    };
    if (options.tenantId) where.tenantId = options.tenantId;
    if (options.projectId) where.projectId = options.projectId;
    if (options.category) where.category = options.category;
    return prisma.token.findMany({
      where,
      skip: options.skip ? parseInt(options.skip) : undefined,
      take: options.limit ? parseInt(options.limit) : undefined,
    });
  }

  // Membership operations
  async createMembership(membershipData) {
    return prisma.membership.create({ data: membershipData });
  }
  async findMembershipById(id) {
    return prisma.membership.findUnique({ where: { id }, include: { user: true, tenant: true } });
  }
  async findMembershipsByUser(userId) {
    return prisma.membership.findMany({ where: { userId }, include: { user: true, tenant: true } });
  }
  async findMembershipsByTenant(tenantId) {
    return prisma.membership.findMany({ where: { tenantId }, include: { user: true, tenant: true } });
  }
  async updateMembership(id, membershipData) {
    return prisma.membership.update({ where: { id }, data: membershipData });
  }
  async deleteMembership(id) {
    return prisma.membership.delete({ where: { id } });
  }

  // API Key operations
  async createApiKey(apiKeyData) {
    return prisma.apiKey.create({ data: apiKeyData });
  }
  async findApiKeyById(id) {
    return prisma.apiKey.findUnique({ where: { id }, include: { tenant: true, project: true, createdBy: true } });
  }
  async findApiKeyByHash(hashedKey) {
    return prisma.apiKey.findFirst({ where: { hashedKey, revoked: false }, include: { tenant: true, project: true, createdBy: true } });
  }
  async findApiKeysByProject(projectId) {
    return prisma.apiKey.findMany({ where: { projectId }, include: { tenant: true, project: true, createdBy: true } });
  }
  async updateApiKey(id, apiKeyData) {
    return prisma.apiKey.update({ where: { id }, data: apiKeyData });
  }
  async deleteApiKey(id) {
    return prisma.apiKey.delete({ where: { id } });
  }

  async rotateApiKey(id, prevHashedKey, newHashedKey) {
    const res = await prisma.apiKey.updateMany({
      where: { id, hashedKey: prevHashedKey },
      data: { hashedKey: newHashedKey },
    });
    return res.count === 1;
  }

  // Invitation operations
  async createInvitation(invitationData) {
    return prisma.invitation.create({ data: invitationData });
  }
  async findInvitationById(id) {
    return prisma.invitation.findUnique({ where: { id }, include: { tenant: true, inviter: true, acceptedBy: true } });
  }
  async findInvitationByToken(tokenHash) {
    return prisma.invitation.findUnique({ where: { tokenHash }, include: { tenant: true, inviter: true, acceptedBy: true } });
  }
  async findInvitationsByTenant(tenantId) {
    return prisma.invitation.findMany({ where: { tenantId }, include: { tenant: true, inviter: true, acceptedBy: true } });
  }
  async updateInvitation(id, invitationData) {
    return prisma.invitation.update({ where: { id }, data: invitationData });
  }
  async deleteInvitation(id) {
    return prisma.invitation.delete({ where: { id } });
  }

  // Category operations
  async createCategory(categoryData) {
    return prisma.category.create({ data: categoryData });
  }
  async findAllCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
  async findCategoryByName(name) {
    return prisma.category.findUnique({ where: { name } });
  }
  async updateCategory(id, categoryData) {
    return prisma.category.update({ where: { id }, data: categoryData });
  }
  async deleteCategory(id) {
    return prisma.category.delete({ where: { id } });
  }

  // Token Release operations
  async createTokenRelease(releaseData) {
    return prisma.tokenRelease.create({ data: releaseData });
  }
  async findTokenReleaseById(id) {
    return prisma.tokenRelease.findUnique({ where: { id } });
  }
  async findTokenReleases(options = {}) {
    const where = {};
    if (options.version) where.version = options.version;
    if (options.theme) where.theme = options.theme;
    if (options.format) where.format = options.format;
    return prisma.tokenRelease.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: options.skip ? parseInt(options.skip) : undefined,
      take: options.limit ? parseInt(options.limit) : undefined,
    });
  }
  async updateTokenRelease(id, releaseData) {
    return prisma.tokenRelease.update({ where: { id }, data: releaseData });
  }
  async deleteTokenRelease(id) {
    return prisma.tokenRelease.delete({ where: { id } });
  }


  // Project assignments
  async findProjectAssignmentsByProject(projectId) {
    return prisma.projectAssignment.findMany({ where: { projectId }, include: { user: true } });
  }
  async findProjectAssignmentsByUser(userId) {
    return prisma.projectAssignment.findMany({ where: { userId }, include: { project: true } });
  }
  async findAssignedProjectsByUser(userId, tenantId) {
    return prisma.projectAssignment.findMany({ where: { userId, project: { tenantId } }, include: { project: true } });
  }
  async hasProjectAssignment(userId, projectId) {
    const pa = await prisma.projectAssignment.findFirst({ where: { userId, projectId } });
    return !!pa;
  }
  async createProjectAssignment(data) {
    return prisma.projectAssignment.create({ data });
  }
  async deleteProjectAssignment(userId, projectId) {
    try { await prisma.projectAssignment.delete({ where: { userId_projectId: { userId, projectId } } }); return true; } catch { return false; }
  }

  // Transaction operations (use prisma.$transaction in higher-level flows)
  async beginTransaction() { return null; }
  async commitTransaction() { return true; }
  async rollbackTransaction() { return true; }
}
