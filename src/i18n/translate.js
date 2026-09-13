import translations from './en.json' with { type: 'json' };

export const normalize = (text) => text.replace(/\s+/g, ' ').trim();
const glossary = [
	['Kurier- und Lieferwagen', 'Courier and Delivery Van'],
	[' – Aufnahme ', ' – photograph '], [' der Fahrzeugdokumentation', ' in the vehicle record'],
	[' – Fahrzeugdokumentation', ' – vehicle record'], [' vergrößern', ' — enlarge'],
	['Baujahr', 'year'], ['Bj.', 'year'], ['4-türiges', '4-door'], ['2-türiges', '2-door'],
	['Sportcabriolet', 'Sport Cabriolet'], ['Sportcoupe', 'Sport Coupé'], ['Sport-Coupe', 'Sport Coupé'],
	['Limousine', 'Saloon'], ['Kabinenroller', 'Bubble Car'], ['Berlin-Roller', 'Berlin Scooter'],
	['Flügeltürer', 'Gullwing'], ['Seitenwagen', 'sidecar'], ['Beiwagen', 'sidecar'],
	['Gespann mit', 'combination with'], ['Kombi- und Kurierfahrzeug', 'Estate and Courier Vehicle'],
	['Flanier- und Paradewagen', 'Touring and Parade Car'], ['Spezialroadster', 'Special Roadster'],
	['Reise-Cabriolet', 'Touring Cabriolet'], ['Kombi', 'Estate'], ['Pagode', 'Pagoda'],
];
export function translate(text) {
	const key = normalize(text);
	if (!key) return text;
	let value = translations[key];
	if (value === undefined && key.includes(' | Die Oldtimermanufaktur')) {
		value = `${translate(key.replace(' | Die Oldtimermanufaktur', ''))} | Die Oldtimermanufaktur`;
	}
	if (value === undefined) {
		const match = key.match(/^(.*?)( – Aufnahme \d+ der Fahrzeugdokumentation| – Fahrzeugdokumentation)( vergrößern)?$/);
		if (match) value = translate(match[1]) + (match[2].includes('Aufnahme') ? ` – photograph ${match[2].match(/\d+/)[0]} in the vehicle record` : ' – vehicle record') + (match[3] ? ' — enlarge' : '');
	}
	if (value === undefined && / – Seite \d+$/.test(key)) value = translate(key.replace(/ – Seite \d+$/, '')) + key.match(/ – Seite \d+$/)[0].replace('Seite', 'Page');
	if (value === undefined && /^Bildergruppe \d+$/.test(key)) value = key.replace('Bildergruppe', 'Image group');
	if (value === undefined && /^Seite \d+$/.test(key)) value = key.replace('Seite', 'Page');
	if (value === undefined && /, Seite \d+$/.test(key)) value = translate(key.replace(/, Seite \d+$/, '')) + key.match(/, Seite \d+$/)[0].replace('Seite', 'Page');
	if (value === undefined && / durchsuchen$/.test(key)) value = `Search ${translate(key.replace(/ durchsuchen$/, '')).toLowerCase()}`;
	if (value === undefined && /^Alle /.test(key)) value = `All ${translate(key.slice(5)).toLowerCase()}`;
	if (value === undefined) {
		value = key;
		for (const [de, en] of glossary) value = value.replaceAll(de, en);
	}
	return text.replace(text.trim(), value);
}
