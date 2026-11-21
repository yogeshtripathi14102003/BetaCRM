const { parsePagination, buildMeta } = require('../utils/pagination');

// "-createdAt" -> [['createdAt','DESC']]. Sirf allowed fields (SQL injection / unknown column se bachav)
const parseSort = (sort, allowed, fallback = [['createdAt', 'DESC']]) => {
  if (!sort) return fallback;
  const desc = String(sort).startsWith('-');
  const field = String(sort).replace(/^-/, '');
  return allowed.includes(field) ? [[field, desc ? 'DESC' : 'ASC']] : fallback;
};

// const { items, meta } = await paginate(Lead, { where, include, query: req.query, sortable: ['createdAt','name'] })
exports.paginate = async (Model, { where, include, attributes, query = {}, sortable = ['createdAt'], defaultLimit = 20 } = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit });
  const { rows, count } = await Model.findAndCountAll({
    where,
    include,
    attributes,
    order: parseSort(query.sort, sortable),
    limit,
    offset: skip,
    distinct: true, // include (join) ke saath count galat na ho
  });
  return { items: rows, meta: buildMeta(count, page, limit) };
};

exports.parseSort = parseSort;
