import databaseService from '../dal/DatabaseService.js';
import { ERR } from '../utils/errors.js';

export const listAssignments = async (req, res, next) => {
  try {
    const { tenantId, projectId } = req.params;
    if (String(tenantId) !== String(req.tenantId)) return ERR.FORBIDDEN(res);
    if (req.role !== 'admin') return ERR.FORBIDDEN(res);
    // Ideal: método DAL para listar por proyecto; como fallback usamos prisma si está disponible
    let items = [];
    const prisma = databaseService.readAdapter?.prisma;
    if (prisma?.projectAssignment) {
      const rows = await prisma.projectAssignment.findMany({ where: { projectId }, include: { user: true } });
      items = rows.map(a => ({ userId: a.userId, projectId: a.projectId, role: a.role || null, username: a.user?.username }));
    }
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
};

export const createAssignment = async (req, res, next) => {
  try {
    const { tenantId, projectId } = req.params;
    const { userId, role } = req.body || {};
    if (String(tenantId) !== String(req.tenantId)) return ERR.FORBIDDEN(res);
    if (req.role !== 'admin') return ERR.FORBIDDEN(res);
    if (!userId) return ERR.VALIDATION(res, 'userId is required');
    const created = await databaseService.createProjectAssignment({ userId, projectId, role });
    res.status(201).json({ userId: created.userId, projectId: created.projectId, role: created.role || null });
  } catch (err) { next(err); }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    const { tenantId, projectId, userId } = req.params;
    if (String(tenantId) !== String(req.tenantId)) return ERR.FORBIDDEN(res);
    if (req.role !== 'admin') return ERR.FORBIDDEN(res);
    const ok = await databaseService.deleteProjectAssignment(userId, projectId);
    if (!ok) return ERR.NOT_FOUND(res, 'Assignment not found');
    res.status(204).send();
  } catch (err) { next(err); }
};
