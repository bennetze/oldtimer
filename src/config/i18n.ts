export type Locale = 'de' | 'en';

export const defaultLocale: Locale = 'de';
export const languageStorageKey = 'oldtimermanufaktur-language';

export const localeData = {
	de: {
		htmlLang: 'de-DE',
		openGraphLocale: 'de_DE',
		shortLabel: 'DE',
	},
	en: {
		htmlLang: 'en-GB',
		openGraphLocale: 'en_GB',
		shortLabel: 'EN',
	},
} as const;

const translatedRoutes = [
	/^\/$/,
	/^\/(?:handwerk|ueber-uns|projekte)\/?$/,
	/^\/projekte\/(?:aktuelle-projekte|vergangene-projekte|fahrzeugangebote)\/?$/,
	/^\/projekte\/vergangene-projekte\/seite\/\d+\/?$/,
];

export const normalizeRoute = (path: string) => {
	const withoutQuery = path.split(/[?#]/, 1)[0] || '/';
	const normalized = withoutQuery.replace(/\/{2,}/g, '/');

	if (normalized === '/') {
		return '/';
	}

	return `/${normalized.replace(/^\/+|\/+$/g, '')}/`;
};

export const removeEnglishPrefix = (path: string) => {
	const normalized = normalizeRoute(path);

	if (normalized === '/en/') {
		return '/';
	}

	return normalizeRoute(normalized.replace(/^\/en(?=\/)/, ''));
};

export const isTranslatedRoute = (path: string) => {
	const germanRoute = removeEnglishPrefix(path);
	return translatedRoutes.some((pattern) => pattern.test(germanRoute));
};

export const localizedRoute = (path: string, locale: Locale) => {
	const germanRoute = removeEnglishPrefix(path);

	if (locale === 'de') {
		return germanRoute;
	}

	return germanRoute === '/' ? '/en/' : `/en${germanRoute}`;
};

const vehicleCategoryRoute = (path: string) => {
	const match = removeEnglishPrefix(path).match(
		/^\/projekte\/(aktuelle-projekte|vergangene-projekte|fahrzeugangebote)\//,
	);

	return match ? `/projekte/${match[1]}/` : undefined;
};

export const languageTarget = (path: string, locale: Locale) => {
	if (isTranslatedRoute(path)) {
		return localizedRoute(path, locale);
	}

	if (locale === 'en') {
		const archiveRoute = vehicleCategoryRoute(path);
		return archiveRoute ? localizedRoute(archiveRoute, 'en') : '/en/';
	}

	return removeEnglishPrefix(path);
};

export const chromeCopy = {
	de: {
		menu: 'Menü',
		close: 'Schließen',
		menuDialog: 'Hauptmenü',
		mainNavigation: 'Hauptnavigation',
		pageNavigation: 'Seitennavigation',
		legalNavigation: 'Rechtliches',
		socialMedia: 'Social Media',
		languageNavigation: 'Sprache wählen',
		developmentTitle: 'Entwicklungsvorschau',
		developmentText:
			'Ein Teil der Bildmotive sind KI-generierte Platzhalter. Sie zeigen nicht die tatsächlichen Personen, Fahrzeuge oder Betriebsräume.',
		legalNotice: 'Impressum',
		privacy: 'Datenschutzerklärung',
		homeLabel: 'Die Oldtimermanufaktur Startseite',
		youtubePending: 'YouTube-Profil folgt',
		instagramPending: 'Instagram-Profil folgt',
		tiktokPending: 'TikTok-Profil folgt',
	},
	en: {
		menu: 'Menu',
		close: 'Close',
		menuDialog: 'Main menu',
		mainNavigation: 'Main navigation',
		pageNavigation: 'Page navigation',
		legalNavigation: 'Legal information in German',
		socialMedia: 'Social media',
		languageNavigation: 'Choose language',
		developmentTitle: 'Development preview',
		developmentText:
			'Some images are AI-generated placeholders. They do not show the actual people, vehicles or company premises.',
		legalNotice: 'Impressum (DE)',
		privacy: 'Datenschutzerklärung (DE)',
		homeLabel: 'The Oldtimermanufaktur homepage',
		youtubePending: 'YouTube profile coming soon',
		instagramPending: 'Instagram profile coming soon',
		tiktokPending: 'TikTok profile coming soon',
	},
} as const;

export const navigationItems = {
	de: [
		{ title: 'Startseite', href: '/', activePath: '/' },
		{ title: 'Handwerk', href: '/handwerk/', activePath: '/handwerk' },
		{ title: 'Über uns', href: '/ueber-uns/', activePath: '/ueber-uns' },
		{ title: 'Projekte', href: '/projekte/', activePath: '/projekte' },
		{
			title: 'Fahrzeugangebote',
			href: '/projekte/fahrzeugangebote/',
			activePath: '/projekte/fahrzeugangebote',
		},
	],
	en: [
		{ title: 'Home', href: '/', activePath: '/' },
		{ title: 'Craft', href: '/handwerk/', activePath: '/handwerk' },
		{ title: 'About us', href: '/ueber-uns/', activePath: '/ueber-uns' },
		{ title: 'Projects', href: '/projekte/', activePath: '/projekte' },
		{
			title: 'Vehicles for sale',
			href: '/projekte/fahrzeugangebote/',
			activePath: '/projekte/fahrzeugangebote',
		},
	],
} as const;
