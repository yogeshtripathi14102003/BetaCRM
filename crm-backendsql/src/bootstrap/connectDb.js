const { sequelize } = require('../core/database/sequelize');
const logger = require('../core/logger');

exports.connectDb = async () => {
  await sequelize.authenticate();
  logger.info('MySQL connected');
};

exports.disconnectDb = () => sequelize.close();
