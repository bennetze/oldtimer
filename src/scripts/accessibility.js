// Small, local compatibility helpers. No external scripts or polyfill downloads.
export function watchMedia(query, listener) {
	if (typeof query.addEventListener === 'function') query.addEventListener('change', listener);
	else if (typeof query.addListener === 'function') query.addListener(listener);
}

const isolated = new WeakMap();
const focusable = 'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';
export function setIsolated(element, active) {
	if ('inert' in element) {
		if (active && !isolated.has(element)) isolated.set(element, { inert: element.inert });
		if (active) element.inert = true;
		else if (isolated.has(element)) { element.inert = isolated.get(element).inert; isolated.delete(element); }
		return;
	}
	if (active) {
		if (isolated.has(element)) return;
		const nodes = [element, ...element.querySelectorAll(focusable)];
		isolated.set(element, {
			ariaHidden: element.getAttribute('aria-hidden'),
			pointerEvents: element.style.pointerEvents,
			nodes: nodes.map(node => [node, node.getAttribute('tabindex')]),
		});
		element.setAttribute('aria-hidden', 'true');
		element.style.pointerEvents = 'none';
		for (const node of nodes) node.setAttribute('tabindex', '-1');
	} else {
		const saved = isolated.get(element);
		if (!saved) return;
		if (saved.ariaHidden === null) element.removeAttribute('aria-hidden');
		else element.setAttribute('aria-hidden', saved.ariaHidden);
		element.style.pointerEvents = saved.pointerEvents;
		for (const [node, tabindex] of saved.nodes) {
			if (tabindex === null) node.removeAttribute('tabindex');
			else node.setAttribute('tabindex', tabindex);
		}
		isolated.delete(element);
	}
}

export function systemPointerPreference(storage) {
	const key = 'oldtimer.systemPointer';
	let enabled = false;
	try { enabled = storage()?.getItem(key) === 'true'; } catch { /* Private/storage-disabled mode. */ }
	return {
		get enabled() { return enabled; },
		set(value) {
			enabled = Boolean(value);
			try {
				if (enabled) storage()?.setItem(key, 'true');
				else storage()?.removeItem(key);
			} catch { /* The current-document choice still works. */ }
		},
	};
}

// Native dialogs where supported; otherwise the same surface with explicit isolation.
export function createModal(dialog) {
	const doc = dialog.ownerDocument;
	const native = typeof dialog.showModal === 'function' && typeof dialog.close === 'function';
	let opener;
	let siblings = [];
	let overflow;
	const items = () => [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')];
	const restore = () => {
		if (!native) {
			for (const sibling of siblings) setIsolated(sibling, false);
			siblings = [];
			doc.body.style.overflow = overflow;
		}
		opener?.focus();
		opener = undefined;
	};
	const close = () => {
		if (!dialog.hasAttribute('open')) return;
		if (native) dialog.close();
		else {
			dialog.removeAttribute('open');
			dialog.removeAttribute('aria-modal');
			restore();
			dialog.dispatchEvent(new Event('close'));
		}
	};
	dialog.addEventListener('close', restore);
	doc.addEventListener?.('focusin', event => {
		if (!native && dialog.hasAttribute('open') && !dialog.contains(event.target)) items()[0]?.focus();
	});
	dialog.addEventListener('keydown', event => {
		if (event.key === 'Escape') { event.preventDefault(); close(); }
		if (event.key !== 'Tab') return;
		const targets = items();
		if (!targets.length) { event.preventDefault(); return; }
		event.preventDefault();
		const index = targets.indexOf(doc.activeElement);
		const next = index < 0 ? (event.shiftKey ? targets.length - 1 : 0)
			: (index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
		targets[next].focus();
	});
	return {
		open(trigger) {
			opener = trigger;
			if (native) dialog.showModal();
			else {
				dialog.setAttribute('role', 'dialog');
				dialog.setAttribute('aria-modal', 'true');
				dialog.setAttribute('open', '');
				items()[0]?.focus();
				// Isolate siblings at every ancestor level without hiding the dialog.
				for (let branch = dialog; branch && branch !== doc.body; branch = branch.parentElement) {
					for (const sibling of branch.parentElement?.children ?? []) {
						if (sibling !== branch) { setIsolated(sibling, true); siblings.push(sibling); }
					}
				}
				overflow = doc.body.style.overflow;
				doc.body.style.overflow = 'hidden';
			}
			items()[0]?.focus();
		},
		close,
	};
}
