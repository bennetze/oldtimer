// Retired: the original migration overwrote reviewed records without approval.
console.error('Legacy import is retired. Use npm run vehicles:review -- check /absolute/extracted/category, review the differences, then apply with the matching --approve token and explicit replacement authorization.');
process.exitCode = 1;
