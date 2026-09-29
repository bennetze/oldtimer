import { createHash } from 'node:crypto';

export function finalizeCsp($) {
	const policy = $('meta[http-equiv="content-security-policy"]');
	if (!policy.length) return;
	const hashes = $('script:not([src])').toArray().map(node => `'sha256-${createHash('sha256').update($(node).html() || '').digest('base64')}'`);
	policy.attr('content', (policy.attr('content') || '').replace(/(script-src(?:-elem)?)(?=\s|;|$)([^;]*)/g, (_, name, values) => `${name} ${[...new Set([...values.trim().split(/\s+/).filter(Boolean), ...hashes])].join(' ')}`));
	// A meta policy only protects following content, including early head scripts.
	policy.remove();
	const charset = $('head > meta[charset]').first();
	if (charset.length) charset.after(policy);
	else $('head').prepend(policy);
}
