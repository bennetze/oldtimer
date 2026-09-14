// Vehicle wording is authored per record; never run it through the site dictionary.
export function vehicleLanguage(pathname, base = '/') {
	return pathname.slice(base.replace(/\/?$/, '/').length).match(/^en(?:\/|$)/) ? 'en' : 'de';
}
export function localizeVehicle(record, language) {
	if (language !== 'en') return record;
	return {
		...record,
		title: record.titleEn,
		description: record.descriptionEn,
		cardImageAlt: record.cardImageAltEn,
		leadImageAlt: record.leadImageAltEn,
		blocks: record.blocks.map(block => block.type === 'gallery'
			? { ...block, images: block.images.map(image => ({ ...image, alt: image.altEn, caption: image.captionEn })) }
			: { ...block, html: block.htmlEn }),
	};
}
