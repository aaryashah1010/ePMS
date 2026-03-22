const prisma = require('../utils/prisma');
const { NotFoundError } = require('../utils/errors');

async function createAttribute(req, res, next) {
  try {
    const attr = await prisma.attributeMaster.create({ data: req.body });
    res.status(201).json({ success: true, attribute: attr });
  } catch (err) { next(err); }
}

async function getAllAttributes(req, res, next) {
  try {
    const where = {};
    if (req.query.type) where.type = req.query.type;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    const attributes = await prisma.attributeMaster.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ success: true, attributes });
  } catch (err) { next(err); }
}

async function updateAttribute(req, res, next) {
  try {
    const attr = await prisma.attributeMaster.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, attribute: attr });
  } catch (err) { next(err); }
}

async function deleteAttribute(req, res, next) {
  try {
    await prisma.attributeMaster.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Attribute deactivated' });
  } catch (err) { next(err); }
}

module.exports = { createAttribute, getAllAttributes, updateAttribute, deleteAttribute };
