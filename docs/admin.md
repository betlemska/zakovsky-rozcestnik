# Správa školního webu Betlémská

Administraci otevřeš přes zámeček **Správa** v horní liště nebo přes **Správa webu** v patičce. Hlavní administrátor je účet `kubicek`. Původní heslo i dříve uložený obsah zůstaly při rozšíření zachované. Hesla nejsou ve zdrojovém kódu ani v ZIPu.

## Pracovní prostředí

| Sekce | Co se zde spravuje |
| --- | --- |
| Přehled | Počty článků, konceptů, učitelů a stránek; poslední články a rychlé úpravy. |
| Aktuality | Nadpis, perex, rubrika, datum, úvodní fotografie, text, náhled, koncept a zveřejnění. |
| Učitelé a rozvrhy | Nové a existující profily, fotografie, kontakty, tituly, předměty, kabinety, třídnictví, hodiny rozvrhu, podklady, dohledy a veřejná poznámka. |
| Stránky a sekce | Nadpisy, popisy, další text, názvy a pořadí v menu; vlastní stránky s adresami např. `#page-projekty`. |
| Kalendář | Akce, termíny a volné dny. Volný den ovlivní i výpočet školního dne a barev učitelů. |
| Učebny | Patro a popis místnosti. Rozvrhy místností vycházejí z hodin jednotlivých učitelů. |
| Dokumenty | PDF nebo fotografie přiřazené k libovolné vestavěné sekci. |
| Mediatéka | Trvalé nahrávání, opětovný výběr souborů a kopírování jejich odkazů. |
| Vzhled a nastavení | Název webu, logo, hlavní fotografie, barva akcentu, banner, popisek, adresa, patička, odkazy a zobrazení panelů školního dne, oběda a oblíbených. |
| Redakce a účty | Vytvoření redaktorů, zobrazované jméno, změna hesla a deaktivace účtu. |
| Historie a záloha | Posledních 30 verzí, návrat ke starší verzi, záznam správy, export a import obsahu. |
| Můj účet | Změna vlastního hesla a odhlášení. |

## Ukládání a zveřejnění

Změny se potvrzují tlačítkem ve formuláři. Rozepsané úpravy se samy nezveřejňují; při opuštění formuláře se web zeptá na jejich zahození. Veřejný web obnovuje sdílený obsah po minutě a při návratu do okna. Současná editace v jiném okně nebo jiným uživatelem vyvolá upozornění místo přepsání novější verze.

Aktualitu lze uložit jako **koncept** nebo zveřejnit. Koncepty se do veřejného API neposílají. Text je prostý text; prázdný řádek vytvoří nový odstavec. HTML se nezpracovává.

V každé vestavěné sekci lze upravit doplňující obsah. Vypnutím **Zobrazovat vestavěný obsah sekce** se původní funkční část nahradí vlastním nadpisem, textem a dokumenty. Zaškrtnutím ji vrátíš. **Zobrazovat sekci v menu** ovládá její odkaz v navigaci. Hlavní stránka z menu nezmizí. Vlastní stránka se do menu přidá po zveřejnění.

## Učitelé a fotografie

Při nahrání portrétu nastav obličej pomocí přiblížení a vodorovného/svislého posunu. Výřez se uloží jako kruhový WebP o rozměru 512 × 512 pixelů. Nejde o generativní změnu tváře. Po nahrání ještě potvrď uložení profilu.

Každá hodina má den, pořadí hodiny, třídy, skupinu, předmět a učebnu. Více tříd odděl čárkou. Hodiny se používají i pro sestavení rozvrhu 1.A a místností. Učitel bez rozvrhu má stav **Bez rozvrhu**. Zelená a červená vycházejí ze stálého rozvrhu; skutečná docházka ani suplování nejsou napojené.

Poznámka správce je veřejná. Soukromé žákovské poznámky, hodnocení a oblíbené zůstávají v jeho prohlížeči.

## Média a dokumenty

Podporované jsou JPG, PNG, WebP, PDF a MP4 do 8 MiB. Server kontroluje typ podle obsahu souboru. SVG ani HTML nejsou povolené. Soubor je po nahrání dostupný veřejným odkazem; do stránky nebo profilu se připojí uložením formuláře. Tlačítkem **Z mediatéky** lze soubor použít znovu.

Odebrání odkazu nebo portrétu nemaže fyzický soubor, aby zůstala možná obnova verzí. Původní dodané podklady zůstávají součástí webu. Nahrání nového půdorysu nevytváří automaticky nové geometrické porovnání s katastrem ani nenahrazuje ověřený vektorový model.

## Redakční oprávnění

| Možnost | Hlavní administrátor `kubicek` | Redaktor |
| --- | --- | --- |
| Aktuality | Všechny články a koncepty | Vlastní články a koncepty |
| Nahrávání médií | Ano | Ano |
| Písemky 1.A, školní akce a volné dny | Všechny záznamy | Přidání a správa vlastních záznamů |
| Učitelé, rozvrhy, stránky a další obsah | Ano | Ne |
| Vzhled, účty, historie a obnova | Ano | Ne |
| Změna vlastního hesla | Ano | Ano |

Oprávnění se kontrolují serverově při každé operaci. Pouhé odeslání jiného ID nebo názvu autora redaktorovi práva nezvýší.

Administrátor založí redaktorovi uživatelské jméno a počáteční heslo alespoň 12 znaků. Údaje mu předá sám; web neposílá pozvánky ani hesla. Změna přístupu, reset hesla nebo deaktivace zneplatní relace účtu. Hlavní účet nelze formulářem pro redaktory deaktivovat. Změna vlastního hesla odhlásí všechna vlastní zařízení; běžná relace platí 12 hodin.

## Historie a zálohy

Obnova staršího obsahu vytvoří novou verzi a zachová možnost návratu. Účty ani hesla se obnovou obsahu nemění. Export JSON obsahuje texty, profily, rozvrhy, odkazy a nastavení. Neobsahuje hesla, relace ani binární soubory; odkazy na média zůstávají spojené se současným webem. Jde o zálohu obsahu, nikoliv úplnou databázovou a souborovou zálohu.

## Server a zdrojová záloha

Serverová verze běží na Vinext/Cloudflare Workers a používá D1 binding `DB` a R2 binding `BUCKET`. GitHub Pages serverové API nespouští. Statický export proto odkazuje na živou hostovanou administraci.

Při nezávislém provozu nainstaluj závislosti z `package.json` a lockfile, připoj vlastní D1/R2 a aplikuj soubory z `drizzle/`. Další změny schématu generuj přes `npm run db:generate`; aplikované migrace neupravuj. Sites aplikuje nové migrace při nasazení automaticky.

Tajná runtime proměnná `ADMIN_BOOTSTRAP_VERIFIER` obsahuje PBKDF2-SHA256 ověřovací řetězec (`pbkdf2$100000$<32 hex znaků soli>$<64 hex znaků hashe>`). Nepatří do veřejného repozitáře. Pro lokální vývoj lze použít ignorovaný `.dev.vars`; `.env.example` obsahuje pouze název klíče. Účet vznikne po prvním úspěšném ověření bootstrap hesla. U existujícího účtu má přednost databázový hash; změna bootstrap proměnné existující heslo neobnoví.

Nová hesla se ukládají pomocí scrypt (N=16384, r=8, p=5) s náhodnou solí. Starší PBKDF2 hashe se automaticky převedou po úspěšném přihlášení. Podrobnosti k publikaci na GitHub a omezením ověření jsou v `SECURITY.md`.

Relace používají náhodné tokeny (v databázi pouze SHA-256), cookies Secure/HttpOnly/SameSite=Strict a platnost 12 hodin. Zápisy kontrolují původ požadavku. Přihlašování je omezené proti opakovaným pokusům. HTTPS je potřebné pro přihlašovací cookie.

Sestavení: `npm run build`. Kompletní kontroly: `npm test`. Testy zahrnují autentizaci, role, vlastnictví článků, soukromí konceptů, zachování dat při migraci, média, historii a integraci formulářů se serverovými handlery nad SQLite. Testy DOM používají vývojovou závislost `linkedom`; nenahrazují vizuální kontrolu v prohlížeči.

## Video a další informace učitele

V profilu učitele lze nahrát MP4 nebo zadat odkaz na video, přehrávání vypnout, vybrat náhradní avatar a upravit medailonek i veřejné odkazy. Karty učitelů zobrazují stálý portrét. Video se spouští až v otevřeném profilu a má ovládání; u Martina Theimera se přehraje třikrát se zvukem a hlasitostí přehrávače 100 %, ostatní videa jednou bez zvuku. Hlasitost zařízení ovládá návštěvník. Některé prohlížeče mohou automatické přehrávání blokovat, proto zůstává dostupné ruční spuštění.

Mobilní navigace obsahuje čtyři hlavní sekce a tlačítko Více se všemi dalšími sekcemi, včetně vlastních stránek.

## Upozornění na nové aktuality

První zveřejnění článku nebo změna konceptu na zveřejněný článek spustí odeslání upozornění přihlášeným odběratelům. Běžná úprava zveřejněného článku ho znovu nerozesílá. Obnova zálohy a import obsahu se nerozesílají. Počet odběrů je omezený na 500; odesílání běží na pozadí a nezdržuje uložení článku. Doručení závisí na prohlížeči, připojení a nastavení zařízení; nejde o zaručenou službu pro kritická oznámení.

Tabulky `portal_push_keys`, `portal_push_subscriptions`, `portal_push_attempts` a `portal_push_sent` se idempotentně vytvoří při prvním použití. VAPID soukromý klíč zůstává serverově v D1, nemění se mezi sestaveními. Nepřenášej jej do veřejného repozitáře. Export obsahu v administraci nezahrnuje odběry, privátní klíče ani účty. Endpointy a token pro zrušení odběru nejsou veřejně vypsané.

Aktuality používají stejný náhled 4:3 v seznamu a omezený obrázek vlevo v detailu i redakčním náhledu. Originální soubor zůstává v mediatéce.

## Podněty a chyby

Pouze hlavní administrátor kubicek vidí soukromou schránku v sekci Podněty a chyby. Redaktoři nemají přístup ani přes API. Filtry Nové / Řeší se / Vyřešené / Všechny obsahují počty; přehled zobrazuje 50 záznamů na stránku. Každé hlášení má oblast, text, původní sekci a datum. Stav a interní poznámku lze uložit; souběžnou změnu hlídá číslo verze podnětu.

Formulář v patičce nevyžaduje kontaktní údaje ani účet. Hlášení je neveřejné. Server omezuje délku těla požadavku a polí, kontroluje původ a vlastní hlavičku, má honeypot, deduplikaci opakovaného hlášení a limit 20 požadavků za 10 minut pro jednu sdílenou IP. IP se neukládá přímo; krátkodobé klíče pro omezení a deduplikaci jsou hashované. Tabulky portal_reports, portal_report_attempts a portal_report_dedupe vzniknou idempotentně při prvním použití. Úložiště má kapacitu 5000 hlášení.

Hlášení nepatří do veřejného obsahu, do push zpráv, do redakční historie článků ani do exportu veřejného obsahu. Jejich uložení a řešení probíhá zvlášť v databázi D1; zdrojový ZIP je neobsahuje. Změna stavu nic veřejně nepublikuje ani neodesílá e-mailem.

## Písemky 1.A

Kalendář nově obsahuje společný seznam písemek. Redaktor přidává vlastní záznamy (datum, předmět, téma, skupina, vyučující, podrobnosti), vidí i ostatní a měnit může jen své. Hlavní administrátor upravuje a odebírá všechny. Oprávnění a souběžné změny kontroluje server.

## Zkouška notifikací a přání

Účet kubicek: Vzhled a nastavení → Upozornění a sváteční přání. Náhled přání nic neodesílá. Testovat notifikace všem nejprve ukáže počet zařízení a potvrzovací tlačítko. Zapni odběr i na vlastním telefonu přes zvonek Upozornění na veřejném webu. Po odeslání ověř příjem na telefonech; čítač ve správě potvrzuje pouze přijetí push službou. Redaktoři k rozesílání testu přístup nemají.


## Třídní samospráva - listopad 2026

Každá z 20 tříd má předsedu a zástupce. Členské účty mají přidělenou jedinou třídu pro písemky a třídní akce a samostatně povolené vlastní celoškolní události. Cizí záznamy a správu účtů neupravují. Články jsou zrušené; redakční API odpovídá 410 a veřejný obsah obsahuje prázdný seznam příspěvků. Na úvodu zůstává oficiální RSS školy.

Jednorázové vytvoření účtů při nasazení může použít dva neveřejné runtime secrets `CLASS_REP_SEED_1` a `CLASS_REP_SEED_2`. Obsahují pouze validované role, třídy a solené scrypt verifikátory. Backend přijme jen úplnou sadu 40 předsedů/zástupců, existující přístupy nepřepisuje a při kolizi odmítne celou operaci. Po ověření účtů se secrets odstraní a znovu nasadí stejná uložená verze. Hesla a osobní PDF jsou předávána soukromě, nejsou součástí repozitáře.
