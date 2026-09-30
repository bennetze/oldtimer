import { watchMedia } from './accessibility.js';
export const normalizeSearchValue = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('de').trim();

export function createCardFilter(cards, reducedMotion, materialize = () => []) {
	const entryFor = card => ({ card, title: normalizeSearchValue(card.dataset.searchValue ?? ''), visible: !card.hidden, animation: undefined });
	const entries = cards.map(entryFor);
	let materialized = false;
	const setVisible = (entry, visible) => {
		if (entry.visible === visible) return;
		entry.visible = visible;
		const { card } = entry;
		card.dataset.searchVisible = String(visible);
		const nativeInert = 'inert' in card;
		if (nativeInert) card.inert = !visible;
		entry.animation?.cancel();
		entry.animation = undefined;
		// Cancel the entrance CSS animation only when this card actually changes.
		(typeof card.getAnimations === 'function' ? card.getAnimations() : []).forEach(animation => animation.cancel());
		if (reducedMotion.matches || !nativeInert || typeof card.animate !== 'function') { card.hidden = !visible; return; }
		if (visible) card.hidden = false;
		const animation = card.animate(visible
			? [{ opacity: 0, transform: 'translateY(0.7rem)' }, { opacity: 1, transform: 'translateY(0)' }]
			: [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-0.35rem)' }],
			{ duration: visible ? 320 : 150, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
		entry.animation = animation;
		animation.finished.then(() => {
			if (entry.animation !== animation) return;
			card.hidden = !entry.visible;
			entry.animation = undefined;
		}).catch(() => undefined);
	};
	watchMedia(reducedMotion, () => {
		if (!reducedMotion.matches) return;
		for (const entry of entries) {
			entry.animation?.cancel();
			entry.animation = undefined;
			entry.card.hidden = !entry.visible;
		}
	});
	return query => {
		const parts = normalizeSearchValue(query).split(/\s+/).filter(Boolean);
		if (parts.length && !materialized) {
			entries.push(...materialize().map(entryFor));
			materialized = true;
		}
		let count = 0;
		for (const entry of entries) {
			const matches = parts.length ? parts.every(part => entry.title.includes(part)) : entry.card.dataset.defaultVisible === 'true';
			if (matches) count++;
			setVisible(entry, matches);
		}
		return { searching: parts.length > 0, count };
	};
}
