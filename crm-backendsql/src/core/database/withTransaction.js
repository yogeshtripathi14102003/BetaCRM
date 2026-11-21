const { sequelize } = require('./sequelize');

// MySQL (InnoDB) me transactions hamesha milte hain. Error aaye to apne aap rollback.
//   await runInTransaction(async (t) => { await A.create({...}, { transaction: t }); ... })
exports.runInTransaction = (work) => sequelize.transaction((t) => work(t));

exports.opts = (t) => (t ? { transaction: t } : {});
