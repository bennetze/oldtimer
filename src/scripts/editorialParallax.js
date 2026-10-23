// Keep media inside its own layout box for every intermediate scroll position.
export function boundedParallaxOffset(requested, range, layerTop, layerBottom, stageTop, stageBottom) {
	const minimum = Math.max(-range, stageTop - layerTop);
	const maximum = Math.min(range, stageBottom - layerBottom);
	if (minimum > maximum) return 0;
	return Math.min(Math.max(requested, minimum), maximum);
}

// Solve the travel limits from the last block backwards, then place blocks in
// reading order. Each block can move independently without overtaking a neighbour.
export function orderedParallaxOffsets(blocks, stageTop, stageBottom, clearance = 24) {
	const gaps = blocks.map((block, index) => index
		? Math.min(clearance, Math.max(0, block.top - blocks[index - 1].bottom)) : 0);
	const maximums = blocks.map(block => Math.min(block.range, stageBottom - block.bottom));
	for (let index = blocks.length - 2; index >= 0; index--) {
		maximums[index] = Math.min(maximums[index],
			blocks[index + 1].top + maximums[index + 1] - gaps[index + 1] - blocks[index].bottom);
	}
	const offsets = [];
	for (let index = 0; index < blocks.length; index++) {
		const block = blocks[index];
		const previousBottom = index
			? blocks[index - 1].bottom + offsets[index - 1] + gaps[index] : stageTop;
		const minimum = Math.max(-block.range, previousBottom - block.top);
		offsets.push(Math.min(Math.max(block.requested, minimum), maximums[index]));
	}
	return offsets;
}
