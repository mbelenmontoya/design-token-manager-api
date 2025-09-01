import { DatabaseAdapter } from '../interfaces/DatabaseAdapter.js';
import mongoose from 'mongoose';

// Import existing Mongoose models
import User from '../../models/User.js';
import Tenant from '../../models/Tenant.js';
import Project from '../../models/Project.js';
import Token from '../../models/Token.js';
import Membership from '../../models/Membership.js';
import ApiKey from '../../models/ApiKey.js';
import Invitation from '../../models/Invitation.js';
import Category from '../../models/Category.js';
import TokenRelease from '../../models/TokenRelease.js';

/**
 * MongoDB Adapter
 * Implements DatabaseAdapter interface using existing Mongoose models
 * This allows gradual migration from direct Mongoose usage to DAL
 */
export class MongoAdapter extends DatabaseAdapter {
  constructor() {
    super();
    this.isConnected = false;
  }

  // Connection methods
  async connect() {
    if (this.isConnected) {
      return;
    }
    
    // MongoDB connection is already handled by the existing app setup
    // We just need to verify the connection exists
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not established');
    }
    
    this.isConnected = true;
  }

  async disconnect() {
    // Don't disconnect MongoDB as it's shared with the rest of the app
    this.isConnected = false;
  }

  async healthCheck() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      return {
        status: state === 1 ? 'healthy' : 'unhealthy',
        connection: states[state] || 'unknown',
        database: 'mongodb',
        adapter: 'MongoAdapter'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connection: 'error',
        database: 'mongodb',
        adapter: 'MongoAdapter',
        error: error.message
      };
    }
  }

  // User operations
  async createUser(userData) {
    return await User.create(userData);
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async findUserByUsername(username) {
    return await User.findOne({ username });
  }

  async updateUser(id, userData) {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  // Tenant operations
  async createTenant(tenantData) {
    return await Tenant.create(tenantData);
  }

  async findTenantById(id) {
    return await Tenant.findById(id);
  }

  async findTenantByName(name) {
    return await Tenant.findOne({ name });
  }

  async updateTenant(id, tenantData) {
    return await Tenant.findByIdAndUpdate(id, tenantData, { new: true });
  }

  async deleteTenant(id) {
    return await Tenant.findByIdAndDelete(id);
  }

  // Project operations
  async createProject(projectData) {
    return await Project.create(projectData);
  }

  async findProjectById(id) {
    return await Project.findById(id).populate('tenant');
  }

  async findProjectsByTenant(tenantId) {
    return await Project.find({ tenant: tenantId }).populate('tenant');
  }

  async updateProject(id, projectData) {
    return await Project.findByIdAndUpdate(id, projectData, { new: true });
  }

  async deleteProject(id) {
    return await Project.findByIdAndDelete(id);
  }

  // Token operations
  async createToken(tokenData) {
    return await Token.create(tokenData);
  }

  async findTokenById(id) {
    return await Token.findById(id).populate(['tenant', 'project']);
  }

  async findTokensByProject(projectId, options = {}) {
    const query = Token.find({ project: projectId });

    if (options.category) {
      query.where({ category: options.category });
    }
    if (options.name) {
      query.where({ name: options.name });
    }

    if (options.search) {
      query.where({
        $or: [
          { name: { $regex: options.search, $options: 'i' } },
          { description: { $regex: options.search, $options: 'i' } }
        ]
      });
    }
    
    if (options.limit) {
      query.limit(parseInt(options.limit));
    }
    
    if (options.skip) {
      query.skip(parseInt(options.skip));
    }
    
    return await query.populate(['tenant', 'project']).exec();
  }

  async findTokensByTenant(tenantId, options = {}) {
    const query = Token.find({ tenant: tenantId });

    if (options.category) {
      query.where({ category: options.category });
    }
    if (options.name) {
      query.where({ name: options.name });
    }
    
    if (options.search) {
      query.where({
        $or: [
          { name: { $regex: options.search, $options: 'i' } },
          { description: { $regex: options.search, $options: 'i' } }
        ]
      });
    }
    
    if (options.limit) {
      query.limit(parseInt(options.limit));
    }
    
    if (options.skip) {
      query.skip(parseInt(options.skip));
    }
    
    return await query.populate(['tenant', 'project']).exec();
  }

  async updateToken(id, tokenData) {
    return await Token.findByIdAndUpdate(id, tokenData, { new: true });
  }

  async deleteToken(id) {
    return await Token.findByIdAndDelete(id);
  }

  async searchTokens(query, options = {}) {
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { value: { $regex: query, $options: 'i' } }
      ]
    };

    if (options.tenantId) {
      searchQuery.tenant = options.tenantId;
    }

    if (options.projectId) {
      searchQuery.project = options.projectId;
    }

    if (options.category) {
      searchQuery.category = options.category;
    }

    const mongoQuery = Token.find(searchQuery);
    
    if (options.limit) {
      mongoQuery.limit(parseInt(options.limit));
    }
    
    if (options.skip) {
      mongoQuery.skip(parseInt(options.skip));
    }

    return await mongoQuery.populate(['tenant', 'project']).exec();
  }

  async countTokensByProject(projectId, options = {}) {
    const filter = { project: projectId };
    if (options.category) {
      filter.category = options.category;
    }
    if (options.name) {
      filter.name = options.name;
    }
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } }
      ];
    }
    return await Token.countDocuments(filter);
  }

  async countTokensByTenant(tenantId, options = {}) {
    const filter = { tenant: tenantId };
    if (options.category) {
      filter.category = options.category;
    }
    if (options.name) {
      filter.name = options.name;
    }
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } }
      ];
    }
    return await Token.countDocuments(filter);
  }

  // Membership operations
  async createMembership(membershipData) {
    return await Membership.create(membershipData);
  }

  async findMembershipById(id) {
    return await Membership.findById(id).populate(['user', 'tenant']);
  }

  async findMembershipsByUser(userId) {
    return await Membership.find({ user: userId }).populate(['user', 'tenant']);
  }

  async findMembershipsByTenant(tenantId) {
    return await Membership.find({ tenant: tenantId }).populate(['user', 'tenant']);
  }

  async updateMembership(id, membershipData) {
    return await Membership.findByIdAndUpdate(id, membershipData, { new: true });
  }

  async deleteMembership(id) {
    return await Membership.findByIdAndDelete(id);
  }

  // API Key operations
  async createApiKey(apiKeyData) {
    return await ApiKey.create(apiKeyData);
  }

  async findApiKeyById(id) {
    return await ApiKey.findById(id).populate(['tenant_id', 'project_id', 'created_by']);
  }

  async findApiKeyByHash(hashedKey) {
    return await ApiKey.findOne({ hashedKey }).populate(['tenant_id', 'project_id', 'created_by']);
  }

  async findApiKeysByProject(projectId) {
    return await ApiKey.find({ project_id: projectId }).populate(['tenant_id', 'project_id', 'created_by']);
  }

  async updateApiKey(id, apiKeyData) {
    return await ApiKey.findByIdAndUpdate(id, apiKeyData, { new: true });
  }

  async deleteApiKey(id) {
    return await ApiKey.findByIdAndDelete(id);
  }

  async rotateApiKey(id, prevHashedKey, newHashedKey) {
    const updated = await ApiKey.findOneAndUpdate(
      { _id: id, hashedKey: prevHashedKey },
      { hashedKey: newHashedKey },
      { new: true }
    );
    return Boolean(updated);
  }

  // Invitation operations
  async createInvitation(invitationData) {
    return await Invitation.create(invitationData);
  }

  async findInvitationById(id) {
    return await Invitation.findById(id).populate(['tenant', 'inviter', 'acceptedBy']);
  }

  async findInvitationByToken(tokenHash) {
    return await Invitation.findOne({ tokenHash }).populate(['tenant', 'inviter', 'acceptedBy']);
  }

  async findInvitationsByTenant(tenantId) {
    return await Invitation.find({ tenant: tenantId }).populate(['tenant', 'inviter', 'acceptedBy']);
  }

  async updateInvitation(id, invitationData) {
    return await Invitation.findByIdAndUpdate(id, invitationData, { new: true });
  }

  async deleteInvitation(id) {
    return await Invitation.findByIdAndDelete(id);
  }

  // Category operations
  async createCategory(categoryData) {
    return await Category.create(categoryData);
  }

  async findAllCategories() {
    return await Category.find({});
  }

  async findCategoryByName(name) {
    return await Category.findOne({ name });
  }

  async updateCategory(id, categoryData) {
    return await Category.findByIdAndUpdate(id, categoryData, { new: true });
  }

  async deleteCategory(id) {
    return await Category.findByIdAndDelete(id);
  }

  // Token Release operations
  async createTokenRelease(releaseData) {
    return await TokenRelease.create(releaseData);
  }

  async findTokenReleaseById(id) {
    return await TokenRelease.findById(id);
  }

  async findTokenReleases(options = {}) {
    const query = TokenRelease.find({});
    
    if (options.version) {
      query.where({ version: options.version });
    }
    
    if (options.theme) {
      query.where({ theme: options.theme });
    }
    
    if (options.format) {
      query.where({ format: options.format });
    }
    
    if (options.limit) {
      query.limit(parseInt(options.limit));
    }
    
    if (options.skip) {
      query.skip(parseInt(options.skip));
    }

    query.sort({ createdAt: -1 });
    
    return await query.exec();
  }

  async updateTokenRelease(id, releaseData) {
    return await TokenRelease.findByIdAndUpdate(id, releaseData, { new: true });
  }

  async deleteTokenRelease(id) {
    return await TokenRelease.findByIdAndDelete(id);
  }

  // Transaction operations (MongoDB doesn't require explicit transactions for single operations)
  async beginTransaction() {
    // For MongoDB, we can use sessions for transactions if needed
    // For now, return null as most operations don't require transactions
    return null;
  }

  async commitTransaction() {
    // No-op for basic MongoDB operations
    return true;
  }

  async rollbackTransaction() {
    // No-op for basic MongoDB operations
    return true;
  }
}
