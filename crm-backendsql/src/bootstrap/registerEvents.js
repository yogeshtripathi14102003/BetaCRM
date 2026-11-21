// Har module ka registerEvents() ek hi baar chalata hai
let done = false;
module.exports = (manifests) => {
  if (done) return;
  manifests.forEach((m) => m.registerEvents && m.registerEvents());
  done = true;
};
