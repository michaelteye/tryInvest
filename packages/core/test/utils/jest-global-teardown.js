// Useful to handle situations where some open handles remain after tests
// Remember to set up the globalTeardown option in jest config
module.exports = () => {
  // Delay to print all remaining stuff
  setTimeout(() => process.exit(0), 2500);
};
