import { reviewImport, applyImport } from './lib/vehicle-import.mjs';

const [mode, source, ...args] = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
	if (!['--from', '--approve'].includes(args[i]) || !args[i + 1] || options[args[i]]) throw new Error('Expected --from category/slug and/or --approve TOKEN.');
	options[args[i]] = args[i + 1];
}
if (!['check', 'apply'].includes(mode) || !source) throw new Error('Usage: npm run vehicles:review -- check|apply /extracted/category [--from category/slug] [--approve TOKEN]');
try {
	const review = await reviewImport(process.cwd(), source, options['--from'] || null);
	console.log(JSON.stringify({ from: review.from, to: review.key, changes: review.summary, textChanges: review.textChanges, approvalToken: review.token }, null, 2));
	if (mode === 'apply') {
		if (!options['--approve']) throw new Error('Run check, review the differences, then pass its token with --approve.');
		console.log(JSON.stringify(await applyImport(review, options['--approve']), null, 2));
		console.log('Run npm test, npm run build and npm run build:pages before publishing. No deployment performed.');
	}
} catch (error) { console.error(error.message); process.exitCode = 1; }
