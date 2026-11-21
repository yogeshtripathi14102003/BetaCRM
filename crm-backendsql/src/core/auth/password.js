const bcrypt = require('bcryptjs');

const ROUNDS = 12;

exports.hash = (plain) => bcrypt.hash(plain, ROUNDS);
exports.compare = (plain, hash) => (hash ? bcrypt.compare(plain, hash) : Promise.resolve(false));
// user exist na kare tab bhi same time lage (user enumeration timing attack se bachne ke liye)
exports.DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', ROUNDS);
