// const logger = require('../../core/logger');
// const env = require('../../config/env');
// const password = require('../../core/auth/password');
// const { User, Role, Permission } = require('../../modules/platform/models');
// const settingService = require('../../modules/platform/services/setting.service');

// // Manifests se permissions + default roles + super admin seed karta hai. Idempotent hai (kitni bhi baar chalao).
// module.exports = async (manifests) => {
//   for (const m of manifests) {
//     for (const p of m.permissions || []) {
//       await Permission.upsert({ key: p.key, module: m.name, description: p.description });
//     }
//     for (const r of m.roles || []) {
//       const [role, created] = await Role.findOrCreate({
//         where: { name: r.name },
//         defaults: { label: r.label, module: m.name, isSystem: true, permissions: r.permissions, dataScope: r.dataScope || 'own' },
//       });
//       // permissions/dataScope sirf pehli baar set hote hain, taaki admin ke edits overwrite na hon
//       if (!created) await role.update({ label: r.label, module: m.name, isSystem: true });
//     }
//   }

//   // modules ke settings definitions (value sirf pehli baar default se set, admin ka badla hua nahi chhuta)
//   for (const m of manifests) await settingService.syncDefinitions(m.name, m.settings);

//   // super_admin hamesha '*'
//   await Role.update({ permissions: ['*'], dataScope: 'all' }, { where: { name: 'super_admin' } });
//   const superRole = await Role.findOne({ where: { name: 'super_admin' } });

//   const existing = await User.findOne({ where: { email: env.SUPER_ADMIN_EMAIL }, attributes: ['id'] });
//   if (!existing) {
//     const user = await User.create({
//       email: env.SUPER_ADMIN_EMAIL,
//       passwordHash: await password.hash(env.SUPER_ADMIN_PASSWORD),
//       displayName: 'Super Admin',
//       userType: 'platform_admin',
//       modules: manifests.map((m) => m.name),
//       status: 'active',
//       isEmailVerified: true,
//     });
//     await user.setRoles([superRole]);
//     logger.warn(`Super admin bana: ${env.SUPER_ADMIN_EMAIL} (password turant change karo!)`);
//   }

//   logger.info('seed complete');
// };

const logger = require('../../core/logger');
const env = require('../../config/env');
const password = require('../../core/auth/password');
const { User, Role, Permission } = require('../../modules/platform/models');
const settingService = require('../../modules/platform/services/setting.service');

// 'application.read' pehle se covered hai agar role me '*' ya 'application.*' ya wahi permission ho
const covers = (have, p) => have.includes('*') || have.includes(p) || have.includes(`${p.split('.')[0]}.*`);

// Manifests se permissions + default roles + super admin seed karta hai. Idempotent hai (kitni bhi baar chalao).
module.exports = async (manifests) => {
  for (const m of manifests) {
    for (const p of m.permissions || []) {
      await Permission.upsert({ key: p.key, module: m.name, description: p.description });
    }
    for (const r of m.roles || []) {
      const [role, created] = await Role.findOrCreate({
        where: { name: r.name },
        defaults: { label: r.label, module: m.name, isSystem: true, permissions: r.permissions, dataScope: r.dataScope || 'own' },
      });
      if (!created) {
        // Existing role: admin ke edits overwrite NAHI hote.
        // Manifest ki jo permissions role me nahi hain, sirf wahi jod di jati hain (kuch hatayi nahi jati).
        const have = Array.isArray(role.permissions) ? role.permissions : [];
        const missing = (r.permissions || []).filter((p) => !covers(have, p));
        await role.update({
          label: r.label,
          module: m.name,
          isSystem: true,
          ...(missing.length && { permissions: [...have, ...missing] }),
        });
        if (missing.length) logger.info(`role ${r.name}: ${missing.length} nayi permissions judi -> ${missing.join(', ')}`);
      }
    }
  }

  // modules ke settings definitions (value sirf pehli baar default se set, admin ka badla hua nahi chhuta)
  for (const m of manifests) await settingService.syncDefinitions(m.name, m.settings);

  // super_admin hamesha '*'
  await Role.update({ permissions: ['*'], dataScope: 'all' }, { where: { name: 'super_admin' } });
  const superRole = await Role.findOne({ where: { name: 'super_admin' } });

  const existing = await User.findOne({ where: { email: env.SUPER_ADMIN_EMAIL }, attributes: ['id'] });
  if (!existing) {
    const user = await User.create({
      email: env.SUPER_ADMIN_EMAIL,
      passwordHash: await password.hash(env.SUPER_ADMIN_PASSWORD),
      displayName: 'Super Admin',
      userType: 'platform_admin',
      modules: manifests.map((m) => m.name),
      status: 'active',
      isEmailVerified: true,
    });
    await user.setRoles([superRole]);
    logger.warn(`Super admin bana: ${env.SUPER_ADMIN_EMAIL} (password turant change karo!)`);
  }

  logger.info('seed complete');
};