# Rechts- und Compliance-Prüfprotokoll

**Projekt:** Die Oldtimermanufaktur – Astro-Website  
**Prüfstand:** 2. August 2026  
**Status:** Technische Korrekturen abgeschlossen; nicht zur Produktionsveröffentlichung freigegeben  
**Rechtsraum:** Deutschland und unmittelbar einschlägiges EU-Recht

## Zweck, Umfang und Grenzen

Dieses Protokoll hält die technische und inhaltliche Vorprüfung der Website fest.
Es ist keine Rechtsberatung und ersetzt insbesondere bei ungeklärten Tatsachen
keine Prüfung durch eine deutsche Rechtsanwältin oder einen deutschen Rechtsanwalt
beziehungsweise eine Datenschutzfachperson.

Auf ausdrücklichen Wunsch wurden keine Rechtstexte entworfen, ergänzt oder
inhaltlich geprüft. Der Ordner `drafts/rechtstexte/` war vollständig außerhalb des
Prüfumfangs. Leere Seiten für Impressum und Datenschutzerklärung werden deshalb
nicht mit vorläufigen Texten gefüllt. Das Fehlen dieser Texte bleibt jedoch ein
Veröffentlichungs-Hindernis.

Geprüft wurden insbesondere:

- Quellcode, sichtbare Inhalte, Navigation, Metadaten und strukturierte Daten;
- Bilder, Videos, Schriften und vorhandene Lizenzinformationen;
- Cookies, Browser-Speicher, externe Einbindungen und Kontaktwege;
- die für GitHub Pages erzeugte Entwicklungsvorschau sowie die für den späteren
  Produktionshost erzeugte statische Ausgabe.
- Datenschutz, Anbieterkennzeichnung, Verbraucherrecht, Werbeaussagen,
  Bild-/Persönlichkeitsrechte, KI-Transparenz, Barrierefreiheit, IT-Sicherheit,
  Urheber-/Lizenzrecht und interne Nachweispflichten.

## Ergebnis in einem Satz

Die lokal möglichen Schutz- und Transparenzkorrekturen sind umgesetzt. Die neue
Astro-Website darf trotzdem noch nicht als Produktionsfassung veröffentlicht werden:
Pflichttexte, bestätigte Unternehmensdaten, die tatsächliche Hostingkonstellation
und belastbare Einzelbelege für die Mediennutzung fehlen; außerdem müssen sämtliche
KI-Platzhalter vor der finalen Veröffentlichung durch echte Aufnahmen ersetzt werden.
Die bisherige Website ist nicht Gegenstand dieses Umbaus und wurde nicht verändert.

## Veröffentlichungs-Hindernisse

### 1. Impressum und Datenschutzerklärung fehlen

Die lokalen Routen `/impressum/` und `/datenschutz/` enthalten bewusst keine
Rechtstexte. `noindex` verhindert nur eine gewünschte Suchmaschinenaufnahme und
ersetzt weder die Anbieterkennzeichnung nach § 5 DDG noch die Informationen bei der
Erhebung personenbezogener Daten nach Art. 13 DSGVO. E-Mail- und Telefonkontakt,
Server-Logfiles und gegebenenfalls das vom Host gesetzte Session-Cookie sind bereits
datenschutzrelevante Verarbeitungsvorgänge.

**Maßnahme:** Bis zur gesonderten Rechtstext-Runde keine neue öffentliche Fassung
freigeben. Dann die Texte aus verifizierten Unternehmens-, Hosting-, E-Mail-,
Beschäftigten- und Vertragsdaten erstellen oder anwaltlich prüfen lassen.

### 2. GitHub Pages ist ausschließlich Entwicklungsvorschau

GitHub Pages wird nach Auskunft des Projektverantwortlichen nur während der
Entwicklung genutzt. Der GitHub-Pages-Build versieht nun jede Route mit
`noindex,follow,noarchive`, entfernt kanonische Produktionslinks und JSON-LD und
kennzeichnet die Darstellung sichtbar als Entwicklungsvorschau. Das Repository soll
vor der finalen Veröffentlichung privat werden und GitHub Pages soll entfallen.

**Restmaßnahme:** GitHub Pages vor dem Produktionsstart tatsächlich abschalten, das
Repository privat stellen und prüfen, ob Suchmaschinen noch alte Vorschau-URLs
kennen. Keine Produktionsumschaltung vor abgeschlossener Rechtstext-, Medien- und
Tatsachenprüfung.

### 3. KI-Bildplatzhalter dürfen nicht in die Produktionsfassung

Nach Auskunft des Projektverantwortlichen sind alle Bildmotive außer dem Hero-Video
und daraus abgeleiteten Standbildern KI-generierte Gestaltungshilfen. Sie werden in
der Vorschau nun auf jeder Seite klar als Platzhalter bezeichnet; informative
Alternativtexte verschweigen die KI-Herkunft nicht. Die Konfiguration hält den
Vorschaustatus zentral fest.

**Restmaßnahme:** Wie zugesagt sämtliche KI-Bilder vor Produktion durch die echten
Aufnahmen ersetzen. Für jede finale Datei Herkunft, Rechtekette, kommerzielle
Nutzungsrechte, abgebildete Personen und erforderliche Freigaben im
`MEDIA-RIGHTS-REGISTER.md` belegen. Die Vorschaukennzeichnung erst danach entfernen.

### 4. Unternehmens- und Werbeaussagen sind noch nicht belegt

Die aktuelle Fassung enthält auf ausdrücklichen Wunsch wieder folgende noch zu
belegende Aussagen:

- Gründung beziehungsweise Entstehung im Jahr 1987;
- Gründerstellung von Mario Schrank;
- „dreifacher Meister“;
- internationale Auszeichnungen;
- gemeinsame beziehungsweise generationsübergreifende Leitung durch Mario und
  Anton Schrank;
- Register-, Umsatzsteuer-, Adress- und Kontaktdaten sowie die handwerksrechtliche
  Einordnung.

Unrichtige oder nicht belegbare geschäftliche Aussagen können nach § 5 UWG
irreführend sein. Metadaten und strukturierte Daten sind dabei ebenfalls
öffentliche Aussagen, nicht bloß interne Technik.

Die zwischenzeitliche Entfernung beziehungsweise Neutralisierung der Gründungs-,
Titel-, Auszeichnungs- und Leitungsangaben wurde auf ausdrücklichen Wunsch wieder
rückgängig gemacht. Diese Rücknahme bestätigt nicht automatisch deren Richtigkeit.

**Restmaßnahme:** Handelsregisterauszug, Handwerksrollen-/Kammerdaten,
Meisterbriefe/Fachrichtungen, Auszeichnungen und eine freigegebene Beschreibung der
tatsächlichen Leitung vorlegen. Kontakt-, Adress- und Rechtsformangaben vor
Produktion ebenfalls gegen Originalunterlagen prüfen.

### 5. Hero-Video: Rechte sind bestätigt, Nachweise noch abzulegen

Der Projektverantwortliche bestätigt, dass die Rechte an sämtlichen Bildern und
Videos bei der DIE OLDTIMERMANUFAKTUR GmbH liegen. Das Hero-Video zeigt mindestens
eine erkennbare Person beziehungsweise einen Fahrer, ein lesbares Kennzeichen und
ein konkret identifizierbares Fahrzeug. Technisch enthält die MP4-Datei korrekt nur
einen H.264-Videostream ohne Audio oder Zeitcode-/Datenstream.

**Restmaßnahme:** Die Bestätigung durch zugrunde liegende Verträge, Einwilligungen,
Originaldateien und Freigaben für Person, Kennzeichen, Fahrzeug und Web-/Social-
Preview-Nutzung belegbar machen und im Medienregister verweisen.

## Datenschutz und digitale Dienste

### Festgestellter technischer Zustand der neuen Astro-Fassung

- Keine Analyse-, Werbe- oder Tracking-Skripte gefunden.
- Keine `localStorage`-, `sessionStorage`-, Service-Worker-, Geolocation-,
  WebSocket- oder vergleichbare Browser-Speichernutzung gefunden.
- Keine Formulare, Newsletter-Anmeldung, eingebettete Karte, Social-Feed, YouTube-
  oder sonstige Drittanbieter-iFrames gefunden.
- Jost-Schriften, Bilder und Videos werden lokal ausgeliefert.
- Google Maps ist nur als externer Link eingebunden; bis zum Klick fließt dadurch
  aus der neuen Seite kein Kartenabruf an Google.

Damit benötigt allein der derzeitige Astro-Quellcode voraussichtlich keinen
Cookie-Consent-Banner. Das gilt nur, wenn der wirkliche Produktionsserver keine
nicht unbedingt erforderlichen Cookies oder ähnliche Endgerätezugriffe hinzufügt.
Nach jedem echten Deployment muss dies im Browser und auf HTTP-Ebene erneut geprüft
werden.

### Offene Datenschutzpflichten

- Vertrag zur Auftragsverarbeitung mit dem noch auszuwählenden Hostinganbieter,
  eingesetzte Unterauftragnehmer, Serverstandorte und Logfile-Aufbewahrungsdauer;
- Anbieter und technische Verarbeitung des E-Mail-Postfachs;
- Rechtsgrundlagen, Zwecke, Empfänger, Speicherfristen und Betroffenenrechte für
  Serverlogs sowie E-Mail-/Telefonanfragen;
- Verzeichnis von Verarbeitungstätigkeiten nach Art. 30 DSGVO;
- angemessene technische und organisatorische Maßnahmen nach Art. 32 DSGVO;
- Zahl der Personen, die regelmäßig automatisiert personenbezogene Daten
  verarbeiten, und damit eine mögliche Benennungspflicht nach § 38 BDSG;
- Prozess für Auskunft, Berichtigung, Löschung, Einschränkung,
  Datenübertragbarkeit, Widerspruch und Datenschutzverletzungen.

Der finale Hostinganbieter ist noch unbekannt. Dessen tatsächliche Header, Logfiles,
Cookies, Auftragsverarbeitung, Unterauftragnehmer und Datenstandorte müssen nach dem
ersten Staging-Deployment neu erhoben werden; die spätere Datenschutzerklärung muss
genau diesen Betrieb beschreiben.

### IT-Sicherheit mit Datenschutzbezug

Die lokale Apache-Konfiguration enthält nun eine vorsichtige CSP sowie HSTS (nur bei
HTTPS), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` und eine
`Permissions-Policy`. Keiner dieser Header ist isoliert gesetzlich vorgeschrieben;
zusammen sind sie aber Teil einer risikoadäquaten technischen Härtung.
Hostingumgebungen ohne Apache-Unterstützung ignorieren `.htaccess`, weshalb die
Regeln nach Auswahl des finalen Hosts in dessen Konfiguration übertragen und gegen
die echte Antwort geprüft werden müssen.

Die drei hohen Sicherheitsbefunde in `postcss`, `sharp`/`libvips` und `svgo` wurden
durch kompatible Aktualisierungen beseitigt. Der anschließende Abhängigkeitscheck
meldet keine bekannten Schwachstellen.

## Verbraucherrecht und Handwerksbetrieb

### Vertragsabschluss und Fernabsatz

Die Seite enthält keine Shop-, Buchungs-, Preis-, Angebots- oder Checkout-Funktion
und soll nach Auskunft des Projektverantwortlichen ausschließlich der Information
und Kontaktanbahnung dienen. Weitere Schritte werden per Telefon, E-Mail, Fax oder
persönlich geklärt. Solange über die Website selbst kein vollständiger
Vertragsabschluss angeboten wird, sind keine Checkout-/Bestellpflichten zu bauen.
Ob ein konkreter späterer Vertrag im Fernabsatz zustande kommt, hängt dennoch vom
tatsächlichen Kommunikations- und Abschlussprozess ab und ist bei Änderungen neu zu
prüfen.

### Verbraucherstreitbeilegung

§ 36 VSBG kann Informationen zur Bereitschaft oder Verpflichtung zur Teilnahme an
Verbraucherstreitbeilegung verlangen. Die Ausnahme für kleine Unternehmen hängt von
der Zahl der Beschäftigten am 31. Dezember des Vorjahres ab. § 37 VSBG gilt nach
einer nicht beigelegten konkreten Streitigkeit unabhängig davon. Eine etwaige
Teilnahmeverpflichtung oder freiwillige Bereitschaft ist noch zu klären.

Die frühere EU-Online-Streitbeilegungsplattform wurde zum 20. Juli 2025 eingestellt.
Ein alter OS-/ODR-Link darf deshalb nicht neu in Rechtstexte aufgenommen werden.

### Reglementiertes Handwerk

Karosserie- und Fahrzeugbauer sowie Kraftfahrzeugtechniker sind zulassungspflichtige
Handwerke der Anlage A zur Handwerksordnung. Je nach tatsächlicher Betriebsleistung
können weitere Gewerke berührt sein. Für Anbieterkennzeichnung und Rechtstexte
müssen deshalb Handwerksrolle, zuständige Kammer, tatsächliche Meistertitel und
Fachrichtungen verifiziert werden; Titel dürfen nicht verkürzt oder verallgemeinert
werden.

### Barrierefreiheitsstärkungsgesetz

Eine rein informative Unternehmenswebsite fällt nicht automatisch als solche unter
das BFSG. Bietet sie Verbrauchern aber einen vollständigen Online-Vertragsabschluss,
Shop oder Buchungsprozess, kann eine Dienstleistung im elektronischen
Geschäftsverkehr vorliegen. Für Dienstleistungen von Kleinstunternehmen besteht eine
Ausnahme, deren Voraussetzungen (weniger als zehn Beschäftigte und höchstens zwei
Millionen Euro Jahresumsatz oder Bilanzsumme) tatsächlich belegt werden müssen.

Unabhängig von der noch offenen BFSG-Anwendbarkeit wurden folgende vorhandene
Zugänglichkeitsprobleme korrigiert:

- Text ist wieder normal auswählbar und das Kontextmenü wird nur auf Medien
  unterdrückt;
- Pfeiltasten werden bei fokussierten interaktiven Elementen nicht abgefangen;
- Abschnittsziele messen am Desktop 44 × 44 CSS-Pixel;
- der externe Kartenlink ist sichtbar als Google-Maps-Link mit neuem Fenster
  gekennzeichnet.

Das verbleibende Blockieren von Rechtsklick und Ziehen auf Bildern/Videos ist nur ein
Bedienhindernis, kein Kopier- oder DRM-Schutz: Jede ausgelieferte Mediendatei kann
technisch weiterhin abgerufen werden. Darauf darf sich der Rechteinhaber nicht als
rechtliche oder technische Absicherung verlassen.

## KI-Verordnung

### Transparenz für synthetische Inhalte

Art. 50 Abs. 4 der EU-KI-Verordnung verlangt seit dem 2. August 2026 von beruflichen
Betreibern eine Offenlegung, wenn ein eingesetztes KI-System Bild-, Audio- oder
Videoinhalte erzeugt oder manipuliert, die einen Deepfake darstellen. Ein Deepfake
ist KI-Inhalt, der bestehenden Personen, Objekten, Orten, Einrichtungen oder
Ereignissen ähnelt und fälschlich authentisch oder wahrheitsgemäß erscheinen würde.
Die Information muss spätestens bei der ersten Exposition klar, unterscheidbar und
barrierefrei erfolgen.

Nach der aktuellen Kommissionsauskunft müssen Inhalte, die bereits vor dem
2. August 2026 erzeugt **und** öffentlich bereitgestellt wurden, nicht rückwirkend
gekennzeichnet werden. Dieser enge Altbestandsfall löst weder Bildnis-, Lizenz- noch
Irreführungsprobleme. Eine neue Veröffentlichung, geänderte Fassung oder Nutzung für
eine neue Darstellung sollte ohne fachliche Bestätigung nicht auf diese Ausnahme
gestützt werden. Der sicherste Weg bleibt der Ersatz täuschend echter synthetischer
Personen-/Betriebsbilder durch echte, lizenzierte Aufnahmen.

Die Unterzeichnung des EU-Verhaltenskodex ist freiwillig. Ohne Unterzeichnung muss
ein betroffener Betreiber die Gleichwertigkeit seiner eigenen Offenlegungs- und
Dokumentationsmaßnahmen belegen können.

Für die Entwicklungsvorschau ist jetzt ein dauerhaft sichtbarer Hinweis eingebaut,
der die KI-generierten Bildmotive als Platzhalter bezeichnet und klarstellt, dass
sie nicht die tatsächlichen Personen, Fahrzeuge oder Betriebsräume zeigen. Das ist
eine Risikoreduktion für die Vorschau, aber kein Ersatz für den zugesagten Austausch
durch echte Fotos vor Produktion.

### KI-Kompetenz

Falls Mitarbeitende oder beauftragte Personen KI-Systeme für Texte, Bilder,
Kundenkommunikation oder andere betriebliche Zwecke einsetzen, verlangt Art. 4 der
KI-Verordnung risikogerechte Maßnahmen zur KI-Kompetenz. Ein Zertifikat oder eine
bestimmte Organisationsform ist nicht vorgeschrieben; ein kurzes Inventar der
eingesetzten Systeme, Zuständigkeiten, Regeln, Risiken und dokumentierte Einweisung
sind für einen kleinen Betrieb ein angemessener Ausgangspunkt. Ob und wie der Betrieb
selbst KI einsetzt, ist noch offen.

## Urheberrecht, Lizenzen und Marken

- Die lokale Schrift Jost nennt in ihren Metadaten die SIL Open Font License 1.1.
  Die offizielle Lizenzdatei liegt nun unter `public/licenses/Jost-OFL-1.1.txt`.
- Der Projektverantwortliche bestätigt die DIE OLDTIMERMANUFAKTUR GmbH als
  Rechteinhaberin aller Bilder und Videos. Das neue `MEDIA-RIGHTS-REGISTER.md`
  beschreibt, wie diese Aussage pro Datei mit Originalen, Verträgen,
  Einwilligungen, Rechnungen und Freigaben belegt werden muss. Die Abwesenheit von
  EXIF-/XMP-Daten wäre allein kein Nachweis.
- Namen, Logos, Fahrzeugembleme und sonstige Marken dürfen nur im sachlich
  erforderlichen und rechtlich gedeckten Umfang verwendet werden. Eine
  Register-/Markenprüfung wurde mangels bestätigter Zeichen und Inhaberschaft nicht
  abgeschlossen.
- Die Astro-Standardfavicons wurden durch ein neutrales, lokal erstelltes
  OM-Monogramm in SVG-, ICO- und Apple-Touch-Icon-Form ersetzt. Es bleibt ein
  vorläufiges Zeichen und ist bei Vorliegen des echten Favicons auszutauschen.
- `robots.txt` trennt bekannte Trainingscrawler von Such-/nutzerveranlassten
  Crawlern und erklärt zusätzlich einen maschinenlesbaren Vorbehalt für Text- und
  Data-Mining. `llms.txt` beschreibt dieselbe Nutzungsentscheidung. Beide Dateien
  sind nur gegenüber beachtenden Bots wirksam beziehungsweise informativ und können
  unerlaubtes Kopieren oder Training technisch nicht garantieren. Insbesondere
  blockiert `Google-Extended` zugleich bestimmte Gemini-Grounding-Funktionen; diese
  Folge wurde zugunsten des Trainingsverbots in Kauf genommen.

## Navigation, Links und öffentliche Aussagen

- Noch nicht existierende kommerzielle Routen werden nicht mehr verlinkt. Ihre
  bestehenden Navigationskonzepte bleiben als nicht interaktive Hinweise „In
  Vorbereitung“ sichtbar, bis Inhalt und Gestaltung bestätigt sind.
- YouTube-, Instagram- und TikTok-Icons bleiben sichtbar, sind aber bis zur Anlage
  offizieller Profile nicht interaktiv und enthalten keine `#`-Platzhalterlinks.
- `sitemap.xml`, `robots.txt`, `llms.txt`, kanonische URLs, Open Graph und JSON-LD
  müssen bei jeder Freigabe dieselbe tatsächliche Seitenlage und dieselben
  bestätigten Tatsachen wiedergeben.
- `noindex`-Rechtseiten sollen nicht in die Sitemap aufgenommen werden, müssen aber
  für Nutzer unmittelbar und dauerhaft erreichbar sein.

## Noch benötigte Antworten und Unterlagen

Folgende Punkte bleiben vor einer Produktionsfreigabe offen:

1. Nachweise für Gründungsjahr, Gründer, Leitung, konkrete Meistertitel,
   Fachrichtungen und genannte Auszeichnungen.
2. Aktueller Registerauszug, Vertretungsberechtigte, Handwerksrolle/Kammer,
   Umsatzsteuer-ID und freigegebene Kontakt-/Adressdaten.
3. Beschäftigtenzahl am 31. Dezember 2025; Zahl der regelmäßig mit automatisierter
   personenbezogener Datenverarbeitung befassten Personen; Jahresumsatz oder
   Bilanzsumme ober-/unterhalb zwei Millionen Euro.
4. Verpflichtung oder Bereitschaft zur Verbraucherstreitbeilegung.
5. Finaler Hostinganbieter, Auftragsverarbeitungsvertrag, Logfile-Konfiguration und
   -frist, E-Mail-Anbieter und gegebenenfalls Datenschutzbeauftragte/r.
6. Ob Mitarbeitende oder Dienstleister KI für den Betrieb einsetzen und welche
    Systeme/Zwecke betroffen sind.
7. Pro-Datei-Nachweise für die bestätigten Medienrechte und die Freigaben des neuen
   Fotoshootings.

Bei unbekannten Punkten ist die sichere technische Voreinstellung: nicht
veröffentlichen, unbelegte Aussage entfernen, ungeklärtes Medium nicht verwenden,
Platzhalterlink entfernen und keine zusätzliche Datenverarbeitung aktivieren.

## Durchgeführter Reparatur- und Wiederholungscheck

Durchgeführt wurden:

1. Werbe-/Unternehmensbehauptungen geprüft; die zwischenzeitliche Neutralisierung
   der Gründungs-, Titel-, Auszeichnungs- und Leitungsangaben später auf Wunsch
   rückgängig gemacht und die erforderlichen Nachweise als Produktionspunkt belassen;
2. GitHub-Pages-Vorschau auf seitenweites `noindex` ohne Produktions-Canonical und
   JSON-LD umgestellt;
3. KI-Platzhalter sichtbar und in informativen Alternativtexten gekennzeichnet;
4. tote Zukunfts- und Social-Links deaktiviert;
5. Textauswahl, Tastaturverhalten, Fokusführung und 44-Pixel-Bedienziele korrigiert;
6. Schriftlizenz, neutrales Monogramm und Medienrechte-Register ergänzt;
7. Crawlerregeln, `llms.txt`, Sitemap, Open Graph und strukturierte Daten
   synchronisiert;
8. bekannte Abhängigkeitsschwachstellen beseitigt und Basis-Sicherheitsheader
   ergänzt;
9. Produktions- und GitHub-Pages-Build erfolgreich ausgeführt;
10. Desktop (1440 × 1000) und Mobil (390 × 844) im Browser geprüft, einschließlich
    Menü/Fokus, Vorschauhinweis, Links, 404, Rechteseiten, Text-/Medienschutz,
    Videoattribute, Überlauf, Metadaten und Konsolenfehler;
11. einen dabei gefundenen mobilen Überlappungsfehler behoben und erneut ohne
    Überlappung geprüft.

Nach Auswahl des echten Hosts verbleibt zwingend eine externe Staging-Prüfung von
TLS, Redirects, Cookies, Serverlogs und real ausgelieferten Sicherheitsheadern.

## Primärquellen

- [§ 5 Digitale-Dienste-Gesetz](https://www.gesetze-im-internet.de/ddg/__5.html)
- [§ 25 Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz](https://www.gesetze-im-internet.de/ttdsg/__25.html)
- [Datenschutz-Grundverordnung](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679)
- [§ 38 Bundesdatenschutzgesetz](https://www.gesetze-im-internet.de/bdsg_2018/__38.html)
- [§§ 36 und 37 Verbraucherstreitbeilegungsgesetz](https://www.gesetze-im-internet.de/vsbg/)
- [EU-Verordnung zur Einstellung der Online-Streitbeilegungsplattform](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R3228)
- [Barrierefreiheitsstärkungsgesetz](https://www.gesetze-im-internet.de/bfsg/)
- [Handwerksordnung, Anlage A](https://www.gesetze-im-internet.de/hwo/anlage_a.html)
- [§ 5 Gesetz gegen den unlauteren Wettbewerb](https://www.gesetze-im-internet.de/uwg_2004/__5.html)
- [§ 22 Kunsturhebergesetz](https://www.gesetze-im-internet.de/kunsturhg/__22.html)
- [§ 44b Urheberrechtsgesetz – Text und Data Mining](https://www.gesetze-im-internet.de/urhg/__44b.html)
- [EU-Richtlinie 2019/790, insbesondere Art. 4](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32019L0790)
- [EU-KI-Verordnung](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689)
- [EU-Kommissionsleitlinien zu Art. 50 der KI-Verordnung](https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems)
- [EU-Kommissionsauskunft zu Altbestand und freiwilligem Transparenzkodex](https://digital-strategy.ec.europa.eu/en/faqs/signing-code-practice-transparency-ai-generated-content)
- [EU-Kommissionsauskunft zur KI-Kompetenz](https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers)
- [SIL Open Font License FAQ](https://openfontlicense.org/ofl-faq/)
- [OpenAI-Crawlerdokumentation](https://developers.openai.com/api/docs/bots)
- [Google-Crawlerdokumentation zu Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
