// Approved German notice supplied by the user on 11 October 2026,
// with an authored English translation. Site preview safeguards remain active.
import { socialProfiles } from '../../config/social.js';

const noticeProfiles = socialProfiles.map(profile => ({
	name: profile.name === 'TikTok' ? 'Tiktok' : profile.name,
	href: profile.icon === 'tiktok' ? `${profile.href}?lang=de-DE` : profile.href,
}));

export const legalNotice = {
	de: {
		title: 'Impressum',
		description: 'Impressum der DIE OLDTIMERMANUFAKTUR GmbH mit Unternehmensangaben, Kontakt, Registereintrag, USt-IdNr., Verbraucherstreitbeilegung und Social-Media-Profilen.',
		eyebrow: 'Entwicklungsvorschau',
		navigation: 'Abschnitte des Impressums',
		phone: 'Telefon',
		phoneDisplay: '036 966 / 83 7 83',
		email: 'E-Mail',
		profiles: noticeProfiles,
		sections: [
			{ id: 'impressum-anbieter', label: 'Anbieter', title: 'DIE OLDTIMERMANUFAKTUR GmbH' },
			{ id: 'impressum-kontakt', label: 'Kontakt', title: 'Kontakt' },
			{ id: 'impressum-geschaeftsfuehrer', label: 'Geschäftsführer', title: 'Vertretungsberechtigter Geschäftsführer', paragraphs: [
				'Mario Schrank (Geschäftsführer)',
			] },
			{ id: 'impressum-register', label: 'Registereintrag', title: 'Registereintrag', paragraphs: [
				'Registergericht: Jena',
				'Registernummer: 500477',
			] },
			{ id: 'impressum-umsatzsteuer', label: 'Umsatzsteuer', title: 'Umsatzsteuer-Identifikationsnummer', paragraphs: [
				'Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE 814808272',
			] },
			{ id: 'impressum-streitbeilegung', label: 'Streitbeilegung', title: 'Verbraucherstreitbeilegung/Universalschlichtungsstelle', paragraphs: [
				'Wir sind nicht bereit und nicht verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
			] },
			{ id: 'impressum-social-media', label: 'Social Media', title: 'Dieses Impressum gilt auch für folgende Social-Media-Profile' },
		],
	},
	en: {
		title: 'Legal notice',
		description: 'Legal notice for DIE OLDTIMERMANUFAKTUR GmbH with company and contact details, registration, VAT ID, consumer dispute resolution and social media profiles.',
		eyebrow: 'Development preview',
		navigation: 'Legal notice sections',
		phone: 'Telephone',
		phoneDisplay: '+49 36966 83783',
		email: 'Email',
		profiles: noticeProfiles,
		sections: [
			{ id: 'impressum-anbieter', label: 'Provider', title: 'DIE OLDTIMERMANUFAKTUR GmbH' },
			{ id: 'impressum-kontakt', label: 'Contact', title: 'Contact' },
			{ id: 'impressum-geschaeftsfuehrer', label: 'Managing director', title: 'Managing director authorised to represent the company', paragraphs: [
				'Mario Schrank (Managing Director)',
			] },
			{ id: 'impressum-register', label: 'Registration', title: 'Register entry', paragraphs: [
				'Register court: Jena',
				'Registration number: 500477',
			] },
			{ id: 'impressum-umsatzsteuer', label: 'VAT', title: 'VAT identification number', paragraphs: [
				'VAT identification number pursuant to section 27a of the German Value Added Tax Act (UStG): DE 814808272',
			] },
			{ id: 'impressum-streitbeilegung', label: 'Dispute resolution', title: 'Consumer dispute resolution / universal arbitration body', paragraphs: [
				'We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration body.',
			] },
			{ id: 'impressum-social-media', label: 'Social media', title: 'This legal notice also applies to the following social media profiles' },
		],
	},
};
