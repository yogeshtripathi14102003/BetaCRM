// leads table ko ENUM (source/status) se FOREIGN KEY relations par le jaata hai. Purana data safe:
//   1. naye columns jodo (nullable)   2. purane ENUM text se matching id bharo   3. NOT NULL + FK lagao   4. purane ENUM columns hatao
// Pehle se maujood leads kharab nahi hoti, fresh DB par bhi chalti hai.
const STATUS_ENUM = ['New', 'Not Interested', 'Details Shared', 'Follow-up', 'Hot Lead', 'University Issue', 'Fee Issue', 'Distance Issue', 'Language Issue', 'Not Picked', 'Admission Done'];
const SOURCE_ENUM = ['Website Inquiry', 'Website Registration', 'Manual Upload', 'Imported Lead', 'Referral', 'Campaign', 'Other'];
const ID = (T, allowNull = true) => ({ type: T.BIGINT.UNSIGNED, allowNull });

module.exports = {
  async up(qi, { DataTypes: T }) {
    const q = (sql) => qi.sequelize.query(sql);

    await qi.addColumn('leads', 'source_id', ID(T));
    await qi.addColumn('leads', 'status_id', ID(T));
    await qi.addColumn('leads', 'import_id', ID(T));
    await qi.addColumn('leads', 'created_by', ID(T));

    await q('UPDATE leads l INNER JOIN lead_sources s ON s.name = l.source SET l.source_id = s.id');
    await q('UPDATE leads l INNER JOIN lead_statuses s ON s.name = l.status SET l.status_id = s.id');
    await q("UPDATE leads SET source_id = (SELECT id FROM lead_sources WHERE code = 'manual_upload') WHERE source_id IS NULL");
    await q("UPDATE leads SET status_id = (SELECT id FROM lead_statuses WHERE code = 'new') WHERE status_id IS NULL");

    await qi.changeColumn('leads', 'source_id', ID(T, false));
    await qi.changeColumn('leads', 'status_id', ID(T, false));

    await qi.addConstraint('leads', { fields: ['source_id'], type: 'foreign key', name: 'fk_leads_source', references: { table: 'lead_sources', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
    await qi.addConstraint('leads', { fields: ['status_id'], type: 'foreign key', name: 'fk_leads_status', references: { table: 'lead_statuses', field: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
    await qi.addConstraint('leads', { fields: ['import_id'], type: 'foreign key', name: 'fk_leads_import', references: { table: 'lead_imports', field: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' });
    await qi.addConstraint('leads', { fields: ['created_by'], type: 'foreign key', name: 'fk_leads_created_by', references: { table: 'users', field: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' });

    await qi.removeIndex('leads', 'leads_status_created_at');
    await qi.removeColumn('leads', 'status');
    await qi.removeColumn('leads', 'source');

    await qi.addIndex('leads', ['status_id', 'created_at']);
    await qi.addIndex('leads', ['source_id']);
    await qi.addIndex('leads', ['import_id']);
  },

  async down(qi, { DataTypes: T }) {
    const q = (sql) => qi.sequelize.query(sql);

    await qi.addColumn('leads', 'source', { type: T.ENUM(...SOURCE_ENUM), allowNull: false, defaultValue: 'Manual Upload' });
    await qi.addColumn('leads', 'status', { type: T.ENUM(...STATUS_ENUM), allowNull: false, defaultValue: 'New' });
    await q('UPDATE leads l INNER JOIN lead_sources s ON s.id = l.source_id SET l.source = s.name');
    await q('UPDATE leads l INNER JOIN lead_statuses s ON s.id = l.status_id SET l.status = s.name');

    for (const c of ['fk_leads_source', 'fk_leads_status', 'fk_leads_import', 'fk_leads_created_by']) await qi.removeConstraint('leads', c);
    await qi.removeIndex('leads', 'leads_status_id_created_at');
    await qi.removeIndex('leads', 'leads_source_id');
    await qi.removeIndex('leads', 'leads_import_id');
    for (const c of ['source_id', 'status_id', 'import_id', 'created_by']) await qi.removeColumn('leads', c);
    await qi.addIndex('leads', ['status', 'created_at']);
  },
};  