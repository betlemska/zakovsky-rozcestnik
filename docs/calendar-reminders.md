# Kalendář, písemky a připomínky

Svátky se odvozují z křestních jmen aktuálního seznamu vyučujících každý rok. Mapování pro všech 20 současných profilů je v `public/calendar-core.js`, ověřené 4. 11. 2026 podle https://kalendar365.cz/jmeniny/ a https://www.penize.cz/kalendar/svatky . Svátek není informace o narozeninách ani skutečné přítomnosti. Školní akce zůstávají založené na dodaném školním plánu; redakční písemky jsou označené samostatně.

Redaktor se přihlásí do Správy → Rozvrh a písemky 1.A (Kalendář). Týden přepne šipkami nebo výběrem data. Kliknutím na předmět předvyplní datum, konkrétní hodinu, učitele a skupinu; doplní téma a uloží. Písemky jsou vidět u předmětů i ve veřejném kalendáři. Ruční formulář a seznam všech písemek zůstávají dostupné. Redaktor upravuje a maže jen vlastní záznamy, hlavní administrátor všechny.

Přes **Přidat volno**, tlačítko u dne nebo **Nová událost → Volno / ředitelské volno / prázdniny** může i redaktor zapsat volný den. `kind=volno` nahradí celý den týdenního rozvrhu pruhem VOLNO, zruší jeho živé zvýraznění výuky a ovlivní dostupnost učitelů. Běžné školní akce výuku neruší. Stávající písemky ve volném dni zůstanou uložené a lze je přesunout ze seznamu; v rozvrhu, veřejném kalendáři ani připomínkách se nekonající písemky nezobrazují. Novou písemku na volný den odmítá také server. Odebrání volna obnoví původní hodiny i zachované písemky.

Serverové akce `event_save`/`event_delete` a `exam_save`/`exam_delete` vynucují autorství, oprávnění a kontrolu souběžných změn. Při prvním uložení školní akce se zachovají všechny dodané školní události; ty patří hlavnímu administrátorovi. Písemky a akce se ukládají do sdíleného CMS a jeho historie.

Telefon: zvonek Upozornění → vybrat aktuality / svátky / školní akce / písemky → Zapnout nebo Uložit výběr. Starší odběry zůstávají pouze pro aktuality, dokud návštěvník svůj výběr neuloží. Na iOS je nutné přidání na plochu a povolení oznámení. Oznámení na zamčeném telefonu závisí na podpoře prohlížeče, jeho push službě a nastavení zařízení.

Připomínky se spouštějí automatickou úlohou od 18:00 Europe/Prague. Jedno zařízení dostane nejvýše jeden souhrn pro daný zítřek; souhrn obsahuje jen vybrané kategorie. Prázdný den ani vypnuté kategorie se neodesílají. Opakovaný nebo souběžný běh téhož dne je potlačen atomickým zápisem v D1. Po částečném neúspěchu se totéž denní odesílání automaticky neopakuje, aby se předešlo duplicitám. Jde o doručení podle možností push služby, ne o zaručenou doručenku na telefon.

Push zprávy nových a znovu uložených odběrů obsahují šifrovaný payload podle RFC 8291 / RFC 8188, takže souběžná aktualita a kalendářní připomínka zachovají vlastní text i odkaz. Starší odběry bez uložených veřejných šifrovacích klíčů nadále používají původní zpracování aktualit. Endpointy odběrů, jejich klíče a nastavení nejsou součástí veřejného CMS ani ZIP exportu. Veřejné klíče příjemce nejsou přihlašovací údaje; soukromé klíče zařízení zůstávají v prohlížeči.

## Automatická úloha a oprávnění

`POST /mcp` nabízí `preview_tomorrow_reminders`, `send_tomorrow_reminders` a `calendar_reminder_status`. Volání vyžaduje platformou ověřenou identitu vlastníka, jejíž e-mail odpovídá serverové proměnné `PORTAL_SCHEDULER_OWNER_EMAIL`. Nejde o veřejně spustitelný rozesílač ani o editorům přístupné tlačítko. Zdrojový kód ani prompt úlohy neobsahuje hesla, tokeny nebo e-mail vlastníka.

Běh před 18:00 uloží kontrolu dostupnosti a neodesílá oznámení. Náhled a stav slouží k ověření připojení bez falešného oznámení. Úloha má být propojena s tímto Site a jeho osobním pluginem; při přenosu projektu na vlastní hosting je nutné znovu nastavit důvěryhodné ověřování identity a plánovač. Samotný GitHub Pages serverové připomínky, redakční úpravy ani přihlášení nespustí.

## Sváteční přání a ruční test

Při otevření webu v den českých jmenin vyučujícího se zobrazí velké přání s jeho aktuální profilovkou, univerzální SVG čepičkou a krátkými konfetami. Všichni vyučující stejného jména jsou zahrnuti. Po zavření zůstane proužek s možností znovu otevřít přání. Automatické přání se v rámci jedné otevřené stránky neopakuje při přepnutí sekce nebo minutové aktualizaci. Nové načtení stránky je nová návštěva. Datum používá Prahu; změna dne odstraní včerejší přání. Respektuje se systémové omezení pohybu. Přání nepřekryje již otevřený formulář či profil.

Ve Správě → Vzhled a nastavení má pouze hlavní účet kubicek náhled přání a tlačítko Testovat notifikace všem. Dialog ukáže počet aktivních zařízení a výslovné potvrzení odeslání. Požadavek je chráněný serverovou relací, kontrolou hlavního účtu a Origin/CSRF hlavičkou; redaktor ani anonymní návštěvník test spustit nemůže.

Test má trvalé ID pro opakované požadavky, atomickou rezervaci úlohy a minutový odstup mezi rozesíláním. Odesílání běží na serveru i po zavření dialogu. Výsledek uvádí počet přijetí push službou a neúspěchů, nikoli zaručené zobrazení na telefonu. Poslední výsledek lze obnovit. Záznamy jsou v oddělené neveřejné tabulce a neovlivňují novinky ani CMS revizi. Zařízení se všemi kategoriemi vypnutými test nedostanou.

Starší odběry bez uložených šifrovacích klíčů dostanou prázdný wakeup a krátkodobou veřejnou zprávu TEST přes původní fallback. Nové odběry dostanou vlastní šifrovaný obsah. U již povoleného odběru běžná návštěva webu aktualizuje veřejné šifrovací klíče se zachováním jeho kategorií a bez nové žádosti o povolení. U fallbacku starých odběrů při současném jiném oznámení může být zobrazen poslední dostupný obsah; další návštěva tento starý režim aktualizuje.

## Oprava odběru a diagnostika iPhonu (4. 11. 2026)

Na iOS/iPadOS 16.4 a novějších se rozcestník přidá ze Safari na plochu a otevře ikonou jako webová aplikace. Povolení a přihlášení se spouští přímo z klepnutí na Zapnout upozornění; worker i veřejný aplikační klíč jsou připravené předem. Není mezi klepnutím a voláním subscribe žádné čekání na síť nebo registraci. Používá se standardní Web Push, nikoli Firebase SDK. Serializace přednostně získá šifrovací klíče přes getKey, pokud Safari vrátí neúplné toJSON.

Zvonek nyní potvrzuje nejen místní odběr, ale také záznam na serveru a shodu aplikačního klíče. Osiřelý záznam, ztracený místní klíč nebo konflikt odběru už neznamená úspěšné zapnutí. Opravit připojení buď bezpečně obnoví záznam s původním klíčem a zvolenými kategoriemi, nebo odpojí místní starý odběr a vyžádá nové klepnutí na Zapnout upozornění (kvůli aktivaci uživatelem v Safari). Nelze převzít cizí serverový odběr bez jeho tokenu.

Vyzkoušet na tomto telefonu zavolá tokenem chráněnou akci test na /api/push. Zašifrovaná zpráva se odešle pouze tomuto odběru, i když jsou běžné kategorie pozastavené; limit je jeden test za 30 sekund. Výsledek rozlišuje přijetí Apple/Google/Mozilla/Windows a bezpečný chybový kód bez endpointů nebo klíčů. Přijetí poskytovatelem není důkaz zobrazení na telefonu. Uživatel zkontroluje Oznámení, Soustředění a naplánovaný souhrn.

Odesílání má limit osm sekund místo dvou a u testů krátkou životnost 120 sekund a vysokou naléhavost. Délku přenosu určuje HTTP klient. Poslední výsledek každého odběru se uchovává soukromě v portal_push_delivery; správce a vlastník přes calendar_reminder_status vidí pouze souhrny služeb a bezpečné stavové kódy. Veřejný endpoint status vrací jen diagnostiku vlastního tokenem ověřeného odběru.

Ověření: automatické modelované scénáře iPhonu (nejde o emulaci skutečného Safari), synchronní aktivace z klepnutí, neúplné Safari toJSON, obnova osiřelého odběru, ztracený token, vlastnictví/CSRF, zachování kategorií, příjem šifrované zprávy simulovaným APNs a výpis odmítnutí. Skutečné doručení přes APNs na fyzický iPhone vyžaduje test z daného zařízení.

Primární podklady: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ a https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers .


Hlavní administrátor kubicek má v týdenním rozvrhu přímou správu hodin. Kliknutí na hodinu otevře písemky, úpravu nebo přesun hodiny, přidání skupiny a odebrání. Tlačítko + v prázdném poli přidá novou hodinu. Úprava předmětu, dne, pořadí hodiny, vyučujícího, skupiny a učebny mění stálý rozvrh pro všechny týdny. Odebrání hodiny ze společného záznamu více tříd zachová ostatní třídy. Oprávnění zůstává vázané na účet kubicek a serverovou kontrolu hlavního administrátora.

Písemka se zobrazuje fialovým pozadím přímo uvnitř původního políčka předmětu. Dělené hodiny barví jen příslušnou skupinu. Téma a podrobnosti otevře kliknutí; samostatný řádek pod hodinou se nevkládá. Písemky bez jednoznačného přiřazení k hodině mají tlačítko u data dne.


V seznamu akcí je volba **Celodenní školní akce – výuka se nekoná** a samostatné tlačítko pro její přidání. Ukládá se jako školní akce (`kind=akce`) s `allDay=true`; nahrazuje běžné hodiny pruhem ŠKOLNÍ AKCE. Server odmítá nové písemky na takový den a do veřejného kalendáře ani večerní připomínky neposílá původní písemky. Dostupnost učitele v den akce je neověřená, protože ji nelze odvodit ze stálého rozvrhu.

Existující událost nebo písemku lze odebrat přímo z jejího editačního formuláře. Oprávnění k odstranění platí stejně jako k úpravám: kubicek všechny záznamy, redaktor vlastní. Odstranění celodenní akce či volna obnoví zobrazení stálých hodin a případných zachovaných písemek; změna je v historii CMS.


## Svátky a narozeniny před volnem

Datum narození je nepovinné ověřené pole profilu `birthDate`; u Hynka Petroše bylo na výslovný pokyn správce doplněno 21. 2. 2002. Samostatná jednorázová migrace data nemění uložené portréty ani rozvrhy. Pozdější změny správce se zachovají.

Skutečné výročí zůstává v kalendáři. Připadne-li na víkend, volno, celodenní akci nebo den bez jakékoli výuky učitele, kalendář vyhledá poslední předchozí běžný školní den, kdy učitel učí 1.A. Na něm zobrazí připomenutí „Popřej předem“ s původním datem výročí. Večerní souhrn na tento školní den použije stejný výpočet; pozdější připomínku skutečného dne už neposílá znovu. Datum se přepočítává z aktuálních školních akcí a rozvrhů, včetně ředitelského volna a celodenních akcí.

Výpočet využívá pouze platnost dodaného rozvrhu (12. 10. 2026 až 30. 6. 2027), s možností popřát před navazujícími letními prázdninami do konce srpna; hledá nejvýše 120 dní zpět. Nemá-li učitel žádnou předchozí zaznamenanou výuku v 1.A nebo chybí platný podklad, datum společné hodiny se neodhaduje a ponechá se původní kalendářní datum. Přítomnost je odhad podle rozvrhu, nikoli potvrzení docházky.

Stávající odběr `namedays` zahrnuje svátky, narozeniny i jejich včasné připomenutí; volba v telefonu má odpovídající nový název. Nevzniká nová automatická úloha ani dodatečná rozesílka. V ukázce z dodaných podkladů má Petroš narozeniny 21. 2. 2027 (25 let), připomenutí 19. 2. 2027 a svátek 1. 2. 2027 s připomenutím 26. 1. 2027.

Narozeninová animace používá samostatnou modrozlatou scénu, korunku, věk, dort se svíčkami, balónky a 96 konfet; sváteční přání zachovává svou původní podobu. Respektuje omezení pohybu, nemá zvuk ani blikání a lze ji zavřít. Náhled je ve správě a na `celebration-preview.html`; náhled nemění datum ani kalendář.
