

// const { Op } = require('sequelize');

// const { paginate } = require('../../../core/database/paginate');
// const {
//   runInTransaction,
//   opts,
// } = require('../../../core/database/withTransaction');

// const bus = require('../../../core/events/eventBus');
// const E = require('../../../core/events/eventNames');

// const AppError = require('../../../core/errors/AppError');
// const { forbidden } = require('../../../core/errors/httpErrors');

// const auditService = require('../../platform/services/audit.service');

// const access = require('./leadAccess.service');
// const activityService = require('./leadActivity.service');
// const assignmentService = require('./leadAssignment.service');
// const statusService = require('./leadStatus.service');
// const sourceService = require('./leadSource.service');

// const {
//   Lead,
//   LeadSource,
//   LeadStatus,
// } = require('../models');

// // ---------------- EDITABLE FIELDS ----------------

// const EDITABLE = [
//   'name',
//   'phone',
//   'email',
//   'course',
//   'city',
//   'state',
//   'remark',
//   'action',
//   'referralName',
//   'studentName',
//   'referralMobile',
//   'branch',
//   'universityName',
//   'lostReason',
//   'followUpDate',
//   'reminderDate',
//   'reminderTime',
// ];

// // ---------------- ASSOCIATIONS ----------------

// const include = [
//   {
//     model: LeadSource,
//     as: 'source',
//     attributes: ['id', 'name', 'code'],
//   },
//   {
//     model: LeadStatus,
//     as: 'status',
//     attributes: [
//       'id',
//       'name',
//       'code',
//       'color',
//       'isFinal',
//     ],
//   },
// ];

// // ---------------- HELPERS ----------------

// const sid = (v) =>
//   v === null || v === undefined ? null : String(v);

// const toDTO = (lead) => {
//   const o = lead.toJSON();

//   return {
//     ...o,

//     id: sid(o.id),
//     sourceId: sid(o.sourceId),
//     statusId: sid(o.statusId),
//     importId: sid(o.importId),
//     createdBy: sid(o.createdBy),
//     assignedTo: sid(o.assignedTo),

//     source: o.source
//       ? {
//           ...o.source,
//           id: sid(o.source.id),
//         }
//       : null,

//     status: o.status
//       ? {
//           ...o.status,
//           id: sid(o.status.id),
//         }
//       : null,
//   };
// };

// const pick = (body) =>
//   Object.fromEntries(
//     EDITABLE
//       .filter((key) => body[key] !== undefined)
//       .map((key) => [key, body[key]])
//   );

// // ---------------- FILTER RESOLVER ----------------

// // Accepts database ID, code or name.
// // Example:
// // hot_lead       -> status ID
// // Imported Lead  -> source ID
// // 4              -> database ID

// const resolveFilterId = async (Model, value) => {
//   if (
//     value === undefined ||
//     value === null ||
//     String(value).trim() === ''
//   ) {
//     return null;
//   }

//   const filterValue = String(value).trim();

//   const record = await Model.findOne({
//     where: {
//       [Op.or]: [
//         { code: filterValue },
//         { name: filterValue },
//         { id: filterValue },
//       ],
//     },
//     attributes: ['id'],
//   });

//   return record ? record.id : null;
// };

// // ---------------- ACTIVE SOURCE ----------------

// const activeSource = async (id, t) => {
//   const s = await LeadSource.findOne({
//     where: {
//       id,
//       isActive: true,
//     },
//     ...opts(t),
//   });

//   if (!s) {
//     throw new AppError(
//       422,
//       'Validation failed',
//       'VALIDATION_ERROR',
//       [
//         {
//           path: 'sourceId',
//           message: 'Ye source maujood nahi ya band hai',
//         },
//       ]
//     );
//   }

//   return s;
// };

// // ---------------- DROPDOWNS ----------------

// exports.meta = async (actor) => ({
//   sources: await sourceService.list({}, actor),
//   statuses: await statusService.list({}, actor),
// });

// // ---------------- LIST ----------------

// exports.list = async (q, actor) => {
//   const where = {};

//   // STATUS FILTER
//   // Supports status code, name or database ID.

//   if (q.statusId) {
//     where.statusId = q.statusId;
//   } else if (q.status) {
//     const statusId = await resolveFilterId(
//       LeadStatus,
//       q.status
//     );

//     // Invalid status should return zero records.
//     where.statusId = statusId || -1;
//   }

//   // SOURCE FILTER
//   // Supports source code, name or database ID.

//   if (q.sourceId) {
//     where.sourceId = q.sourceId;
//   } else if (q.source) {
//     const sourceId = await resolveFilterId(
//       LeadSource,
//       q.source
//     );

//     // Invalid source should return zero records.
//     where.sourceId = sourceId || -1;
//   }

//   // OTHER EXACT FILTERS

//   [
//     'importId',
//     'city',
//     'state',
//     'course',
//     'branch',
//   ].forEach((key) => {
//     if (q[key]) {
//       where[key] = q[key];
//     }
//   });

//   // ASSIGNED COUNSELLOR FILTER

//   if (q.assignedTo) {
//     where.assignedTo = q.assignedTo;
//   }

//   // UNASSIGNED LEADS

//   if (q.unassigned === 'true') {
//     where.assignedTo = null;
//   }

//   // CREATED DATE RANGE

//   if (q.createdFrom || q.createdTo) {
//     where.createdAt = {
//       ...(q.createdFrom && {
//         [Op.gte]: q.createdFrom,
//       }),
//       ...(q.createdTo && {
//         [Op.lte]: q.createdTo,
//       }),
//     };
//   }

//   // FOLLOW-UP DATE RANGE

//   if (q.followUpFrom || q.followUpTo) {
//     where.followUpDate = {
//       ...(q.followUpFrom && {
//         [Op.gte]: q.followUpFrom,
//       }),
//       ...(q.followUpTo && {
//         [Op.lte]: q.followUpTo,
//       }),
//     };
//   }

//   // SEARCH

//   if (q.search) {
//     const like = `%${q.search.replace(/[%_]/g, '\\$&')}%`;

//     where[Op.or] = [
//       {
//         name: {
//           [Op.like]: like,
//         },
//       },
//       {
//         phone: {
//           [Op.like]: like,
//         },
//       },
//       {
//         email: {
//           [Op.like]: like,
//         },
//       },
//     ];
//   }

//   // IMPORTANT:
//   // Never remove access scoping.
//   // Counsellors only see leads permitted by their scope.

//   const scopedWhere = access.scoped(actor, where);

//   const { items, meta } = await paginate(Lead, {
//     where: scopedWhere,
//     include,
//     query: q,

//     sortable: [
//       'createdAt',
//       'updatedAt',
//       'name',
//       'followUpDate',
//       'assignedAt',
//       'leadScore',
//     ],
//   });

//   return {
//     items: items.map(toDTO),
//     meta,
//   };
// };

// // ---------------- GET ----------------

// exports.get = async (id, actor) =>
//   toDTO(
//     await access.findLead(id, actor, {
//       include,
//     })
//   );

// // ---------------- CREATE ----------------

// exports.create = async (body, ctx) => {
//   const { actor } = ctx;

//   let target = null;

//   if (body.assignedTo) {
//     if (!actor.can('lead.assign')) {
//       throw forbidden(
//         'Lead assign karne ki permission nahi hai'
//       );
//     }

//     target = (
//       await assignmentService.getAssignees(
//         [body.assignedTo],
//         actor
//       )
//     ).get(String(body.assignedTo));
//   } else if (!access.hasFullAccess(actor)) {
//     target = {
//       id: String(actor.id),
//       displayName: actor.displayName,
//     };
//   }

//   const id = await runInTransaction(async (t) => {
//     const source = body.sourceId
//       ? await activeSource(body.sourceId, t)
//       : await LeadSource.findOne({
//           where: {
//             code: 'manual_upload',
//           },
//           ...opts(t),
//         });

//     const status = body.statusId
//       ? await statusService.getActive(body.statusId, t)
//       : await statusService.getDefault(t);

//     const lead = await Lead.create(
//       {
//         ...pick(body),

//         sourceId: source.id,
//         statusId: status.id,

//         createdBy: actor.id,

//         resolvedAt: status.isFinal
//           ? new Date()
//           : null,
//       },
//       opts(t)
//     );

//     await activityService.log(
//       {
//         leadId: lead.id,
//         type: 'system',
//         title: 'Lead created',

//         metadata: {
//           source: source.name,
//           status: status.name,
//         },

//         createdBy: actor.id,
//       },
//       t
//     );

//     if (target) {
//       await assignmentService.applyAssignment(
//         [lead],
//         target,
//         ctx,
//         t,
//         {
//           method: 'manual',
//         }
//       );
//     }

//     return lead.id;
//   });

//   bus.emit(E.LEAD_CREATED, {
//     leadId: String(id),
//     userId: actor.id,
//   });

//   await auditService.record(ctx, {
//     action: 'lead.created',
//     entity: 'Lead',
//     entityId: id,

//     meta: {
//       assignedTo: target && target.id,
//     },
//   });

//   return toDTO(
//     await Lead.findByPk(id, {
//       include,
//     })
//   );
// };

// // ---------------- UPDATE ----------------

// exports.update = async (id, body, ctx) => {
//   const { actor } = ctx;

//   const lead = await access.findLead(id, actor, {
//     include,
//   });

//   const patch = pick(body);

//   const changes = await runInTransaction(async (t) => {
//     let converted = false;

//     // SOURCE UPDATE

//     if (
//       body.sourceId !== undefined &&
//       String(body.sourceId) !== String(lead.sourceId)
//     ) {
//       patch.sourceId = (
//         await activeSource(body.sourceId, t)
//       ).id;
//     }

//     // STATUS UPDATE
//     // Accepts status slug OR database ID.

//     if (
//       body.status !== undefined ||
//       body.statusId !== undefined
//     ) {
//       const next =
//         body.status !== undefined
//           ? await statusService.getActiveByCode(
//               body.status,
//               t
//             )
//           : await statusService.getActive(
//               body.statusId,
//               t
//             );

//       if (String(next.id) !== String(lead.statusId)) {
//         patch.statusId = next.id;

//         patch.resolvedAt = next.isFinal
//           ? lead.resolvedAt || new Date()
//           : null;

//         converted = next.code === 'admission_done';

//         await activityService.log(
//           {
//             leadId: lead.id,
//             type: 'status_change',

//             title: `Status: ${lead.status.name} → ${next.name}`,

//             metadata: {
//               from: lead.status.name,
//               to: next.name,
//             },

//             createdBy: actor.id,
//           },
//           t
//         );
//       }
//     }

//     await lead.update(patch, opts(t));

//     return {
//       keys: Object.keys(patch),
//       converted,
//     };
//   });

//   if (changes.converted) {
//     bus.emit(E.LEAD_CONVERTED, {
//       leadId: String(lead.id),
//       userId: actor.id,
//     });
//   }

//   await auditService.record(ctx, {
//     action: 'lead.updated',
//     entity: 'Lead',
//     entityId: lead.id,

//     meta: {
//       changes: changes.keys,
//     },
//   });

//   return toDTO(
//     await Lead.findByPk(lead.id, {
//       include,
//     })
//   );
// };

// // ---------------- DELETE ----------------

// exports.remove = async (id, ctx) => {
//   const lead = await access.findLead(
//     id,
//     ctx.actor
//   );

//   await auditService.record(ctx, {
//     action: 'lead.deleted',
//     entity: 'Lead',
//     entityId: lead.id,

//     meta: {
//       name: lead.name,
//       phone: lead.phone,
//     },
//   });

//   await lead.destroy();
// };




const { Op } = require('sequelize');

const { paginate } = require('../../../core/database/paginate');
const {
  runInTransaction,
  opts,
} = require('../../../core/database/withTransaction');

const bus = require('../../../core/events/eventBus');
const E = require('../../../core/events/eventNames');

const AppError = require('../../../core/errors/AppError');
const { forbidden } = require('../../../core/errors/httpErrors');

const auditService = require('../../platform/services/audit.service');

const access = require('./leadAccess.service');
const activityService = require('./leadActivity.service');
const assignmentService = require('./leadAssignment.service');
const statusService = require('./leadStatus.service');
const sourceService = require('./leadSource.service');

const {
  Lead,
  LeadSource,
  LeadStatus,
} = require('../models');

// ---------------- EDITABLE FIELDS ----------------

const EDITABLE = [
  'name',
  'phone',
  'email',
  'course',
  'city',
  'state',
  'remark',
  'action',
  'referralName',
  'studentName',
  'referralMobile',
  'branch',
  'universityName',
  'lostReason',
  'followUpDate',
  'reminderDate',
  'reminderTime',
];

// ---------------- ASSOCIATIONS ----------------

const include = [
  {
    model: LeadSource,
    as: 'source',
    attributes: ['id', 'name', 'code'],
  },
  {
    model: LeadStatus,
    as: 'status',
    attributes: [
      'id',
      'name',
      'code',
      'color',
      'isFinal',
    ],
  },
];

// ---------------- HELPERS ----------------

const sid = (v) =>
  v === null || v === undefined ? null : String(v);

const toDTO = (lead) => {
  const o = lead.toJSON();

  return {
    ...o,

    id: sid(o.id),
    sourceId: sid(o.sourceId),
    statusId: sid(o.statusId),
    importId: sid(o.importId),
    createdBy: sid(o.createdBy),
    assignedTo: sid(o.assignedTo),

    source: o.source
      ? {
          ...o.source,
          id: sid(o.source.id),
        }
      : null,

    status: o.status
      ? {
          ...o.status,
          id: sid(o.status.id),
        }
      : null,
  };
};

const pick = (body) =>
  Object.fromEntries(
    EDITABLE
      .filter((key) => body[key] !== undefined)
      .map((key) => [key, body[key]])
  );

// ---------------- FILTER RESOLVER ----------------

// Accepts database ID, code or name.
// Example:
// hot_lead       -> status ID
// Imported Lead  -> source ID
// 4              -> database ID

const resolveFilterId = async (Model, value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const filterValue = String(value).trim();

  const record = await Model.findOne({
    where: {
      [Op.or]: [
        { code: filterValue },
        { name: filterValue },
        { id: filterValue },
      ],
    },
    attributes: ['id'],
  });

  return record ? record.id : null;
};

// ---------------- SHARED LEAD FILTERS ----------------

// Same filters are used by list and CSV export.

const buildLeadWhere = async (q = {}) => {
  const where = {};

  // STATUS FILTER
  // Supports status ID, code or name.

  if (q.statusId) {
    where.statusId = q.statusId;
  } else if (q.status) {
    const statusId = await resolveFilterId(
      LeadStatus,
      q.status
    );

    // Invalid status returns zero records.
    where.statusId = statusId || -1;
  }

  // SOURCE FILTER
  // Supports source ID, code or name.

  if (q.sourceId) {
    where.sourceId = q.sourceId;
  } else if (q.source) {
    const sourceId = await resolveFilterId(
      LeadSource,
      q.source
    );

    // Invalid source returns zero records.
    where.sourceId = sourceId || -1;
  }

  // OTHER EXACT FILTERS

  [
    'importId',
    'city',
    'state',
    'course',
    'branch',
  ].forEach((key) => {
    if (q[key]) {
      where[key] = q[key];
    }
  });

  // ASSIGNED COUNSELLOR FILTER

  if (q.assignedTo) {
    where.assignedTo = q.assignedTo;
  }

  // UNASSIGNED LEADS

  if (q.unassigned === 'true') {
    where.assignedTo = null;
  }

  // CREATED DATE RANGE

  if (q.createdFrom || q.createdTo) {
    where.createdAt = {
      ...(q.createdFrom && {
        [Op.gte]: q.createdFrom,
      }),
      ...(q.createdTo && {
        [Op.lte]: q.createdTo,
      }),
    };
  }

  // FOLLOW-UP DATE RANGE

  if (q.followUpFrom || q.followUpTo) {
    where.followUpDate = {
      ...(q.followUpFrom && {
        [Op.gte]: q.followUpFrom,
      }),
      ...(q.followUpTo && {
        [Op.lte]: q.followUpTo,
      }),
    };
  }

  // SEARCH

  if (q.search) {
    const like = `%${q.search.replace(/[%_]/g, '\\$&')}%`;

    where[Op.or] = [
      {
        name: {
          [Op.like]: like,
        },
      },
      {
        phone: {
          [Op.like]: like,
        },
      },
      {
        email: {
          [Op.like]: like,
        },
      },
    ];
  }

  return where;
};

// ---------------- CSV HELPERS ----------------

// Escape CSV values.
// Also protects spreadsheet users from formula injection.

const csvCell = (value) => {
  if (value === null || value === undefined) {
    return '""';
  }

  let text = value instanceof Date
    ? value.toISOString()
    : String(value);

  // Prevent spreadsheet formula execution.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  // Escape double quotes and wrap every value.
  return `"${text.replace(/"/g, '""')}"`;
};

// Convert lead records into CSV.

const buildCsv = (rows) => {
  const headers = [
    'Lead ID',
    'Name',
    'Phone',
    'Email',
    'Course',
    'City',
    'State',
    'Branch',
    'University',
    'Source',
    'Status',
    'Assigned To',
    'Created At',
    'Follow Up Date',
    'Remark',
  ];

  const lines = [
    headers.map(csvCell).join(','),

    ...rows.map((lead) => [
      lead.id,
      lead.name,
      lead.phone,
      lead.email,
      lead.course,
      lead.city,
      lead.state,
      lead.branch,
      lead.universityName,
      lead.source?.name,
      lead.status?.name,
      lead.assignedTo,
      lead.createdAt,
      lead.followUpDate,
      lead.remark,
    ].map(csvCell).join(',')),
  ];

  // BOM supports UTF-8 / Hindi text in Excel.
  return `\uFEFF${lines.join('\r\n')}`;
};

// ---------------- ACTIVE SOURCE ----------------

const activeSource = async (id, t) => {
  const s = await LeadSource.findOne({
    where: {
      id,
      isActive: true,
    },
    ...opts(t),
  });

  if (!s) {
    throw new AppError(
      422,
      'Validation failed',
      'VALIDATION_ERROR',
      [
        {
          path: 'sourceId',
          message: 'Ye source maujood nahi ya band hai',
        },
      ]
    );
  }

  return s;
};

// ---------------- DROPDOWNS ----------------

exports.meta = async (actor) => ({
  sources: await sourceService.list({}, actor),
  statuses: await statusService.list({}, actor),
});

// ---------------- LIST ----------------

exports.list = async (q, actor) => {
  const where = await buildLeadWhere(q);

  // IMPORTANT:
  // Never remove access scoping.
  // Counsellors only see leads permitted by their scope.

  const scopedWhere = access.scoped(actor, where);

  const { items, meta } = await paginate(Lead, {
    where: scopedWhere,
    include,
    query: q,

    sortable: [
      'createdAt',
      'updatedAt',
      'name',
      'followUpDate',
      'assignedAt',
      'leadScore',
    ],
  });

  return {
    items: items.map(toDTO),
    meta,
  };
};

// ---------------- EXPORT CSV ----------------

exports.exportCsv = async (q, actor) => {
  const where = await buildLeadWhere(q);

  // SECURITY:
  // Apply the same own/team/all access scope as the list API.
  // Never export leads outside the actor's permission scope.

  const scopedWhere = access.scoped(actor, where);

  // No pagination here.
  // Export all matching records, not just the current page.

  const leads = await Lead.findAll({
    where: scopedWhere,
    include,
    order: [['createdAt', 'DESC']],
  });

  const csv = buildCsv(leads);

  const filename = `leads-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return {
    csv,
    filename,
    count: leads.length,
  };
};

// ---------------- GET ----------------

exports.get = async (id, actor) =>
  toDTO(
    await access.findLead(id, actor, {
      include,
    })
  );

// ---------------- CREATE ----------------

exports.create = async (body, ctx) => {
  const { actor } = ctx;

  let target = null;

  if (body.assignedTo) {
    if (!actor.can('lead.assign')) {
      throw forbidden(
        'Lead assign karne ki permission nahi hai'
      );
    }

    target = (
      await assignmentService.getAssignees(
        [body.assignedTo],
        actor
      )
    ).get(String(body.assignedTo));
  } else if (!access.hasFullAccess(actor)) {
    target = {
      id: String(actor.id),
      displayName: actor.displayName,
    };
  }

  const id = await runInTransaction(async (t) => {
    const source = body.sourceId
      ? await activeSource(body.sourceId, t)
      : await LeadSource.findOne({
          where: {
            code: 'manual_upload',
          },
          ...opts(t),
        });

    const status = body.statusId
      ? await statusService.getActive(body.statusId, t)
      : await statusService.getDefault(t);

    const lead = await Lead.create(
      {
        ...pick(body),

        sourceId: source.id,
        statusId: status.id,

        createdBy: actor.id,

        resolvedAt: status.isFinal
          ? new Date()
          : null,
      },
      opts(t)
    );

    await activityService.log(
      {
        leadId: lead.id,
        type: 'system',
        title: 'Lead created',

        metadata: {
          source: source.name,
          status: status.name,
        },

        createdBy: actor.id,
      },
      t
    );

    if (target) {
      await assignmentService.applyAssignment(
        [lead],
        target,
        ctx,
        t,
        {
          method: 'manual',
        }
      );
    }

    return lead.id;
  });

  bus.emit(E.LEAD_CREATED, {
    leadId: String(id),
    userId: actor.id,
  });

  await auditService.record(ctx, {
    action: 'lead.created',
    entity: 'Lead',
    entityId: id,

    meta: {
      assignedTo: target && target.id,
    },
  });

  return toDTO(
    await Lead.findByPk(id, {
      include,
    })
  );
};

// ---------------- UPDATE ----------------

exports.update = async (id, body, ctx) => {
  const { actor } = ctx;

  const lead = await access.findLead(id, actor, {
    include,
  });

  const patch = pick(body);

  const changes = await runInTransaction(async (t) => {
    let converted = false;

    // SOURCE UPDATE

    if (
      body.sourceId !== undefined &&
      String(body.sourceId) !== String(lead.sourceId)
    ) {
      patch.sourceId = (
        await activeSource(body.sourceId, t)
      ).id;
    }

    // STATUS UPDATE
    // Accepts status slug OR database ID.

    if (
      body.status !== undefined ||
      body.statusId !== undefined
    ) {
      const next =
        body.status !== undefined
          ? await statusService.getActiveByCode(
              body.status,
              t
            )
          : await statusService.getActive(
              body.statusId,
              t
            );

      if (String(next.id) !== String(lead.statusId)) {
        patch.statusId = next.id;

        patch.resolvedAt = next.isFinal
          ? lead.resolvedAt || new Date()
          : null;

        converted = next.code === 'admission_done';

        await activityService.log(
          {
            leadId: lead.id,
            type: 'status_change',

            title: `Status: ${lead.status.name} → ${next.name}`,

            metadata: {
              from: lead.status.name,
              to: next.name,
            },

            createdBy: actor.id,
          },
          t
        );
      }
    }

    await lead.update(patch, opts(t));

    return {
      keys: Object.keys(patch),
      converted,
    };
  });

  if (changes.converted) {
    bus.emit(E.LEAD_CONVERTED, {
      leadId: String(lead.id),
      userId: actor.id,
    });
  }

  await auditService.record(ctx, {
    action: 'lead.updated',
    entity: 'Lead',
    entityId: lead.id,

    meta: {
      changes: changes.keys,
    },
  });

  return toDTO(
    await Lead.findByPk(lead.id, {
      include,
    })
  );
};

// ---------------- DELETE ----------------

exports.remove = async (id, ctx) => {
  const lead = await access.findLead(
    id,
    ctx.actor
  );

  await auditService.record(ctx, {
    action: 'lead.deleted',
    entity: 'Lead',
    entityId: lead.id,

    meta: {
      name: lead.name,
      phone: lead.phone,
    },
  });

  await lead.destroy();
};
