# Betlémská — rozcestník třídy 1.A

Veřejná verze: https://betlemska-studentsky-rozcestnik.woodsy-toast-3721.chatgpt.site

Rozcestník může otevřít každý bez přihlášení. Tento ZIP je kompletní záloha a alternativa pro vlastní GitHub Pages. Pro používání zveřejněné stránky není nahrávání na GitHub potřeba.

## Co je připravené

- Web se otevírá rovnou pro 1.A, bez výběru neúplných ostatních tříd. Rozvrhy jiných tříd zůstávají součástí týdenních rozvrhů učitelů, kde patří k původním podkladům.
- Sdílení odkazu nebo QR kódu přes tlačítko **Sdílet** v horní liště. QR je v `assets/qr-rozcestnik-1a.svg`, veřejný cíl v `assets/sdileni-1a.json`. Sdílení míří na hostovanou veřejnou adresu výše.
- Aktuální/příští zaznamenaná hodina, odpočet do zvonění a zohlednění školního volna.
- Oblíbení učitelé se zeleným/červeným stavem podle rozvrhu, kontakty a jejich dodané rozvrhy.
- Vyhledávání, školní akce a půdorys 2.NP. Sekce Učebny byla odstraněna; označení místností v rozvrzích zůstávají.
- Textový jídelníček s polévkou a dvěma standardními jídly. Fotografie jídel se nepoužívají.
- Přidání na plochu a offline základní rozvrhy po první online návštěvě.

## Soukromá nastavení

Oblíbené položky, poznámky a hodnocení zůstávají jen v prohlížeči uživatele. Na server se neposílají a nejsou společně veřejné. Vlastní vložené plány se ukládají místně v IndexedDB. Veřejná hostovaná verze má účet správce a společný obsah; osobní žákovské poznámky se na server neposílají. Neobsahuje seznam žáků ani osobní údaje žáků.

## Nahrání na GitHub Pages

1. Nahraj celý rozbalený obsah včetně složek `assets`, `tools`, `tests`, `lib` a skryté **`.github/workflows`**. `index.html` patří do kořene repozitáře.
2. V **Settings → Pages → Build and deployment → Source** vyber **GitHub Actions**.
3. V **Actions → Web a aktuální jídelníček** případně spusť **Run workflow**.

Workflow aktualizuje veřejný jídelníček a publikuje web po změnách i třikrát každý pracovní den v04:17,08:17 a10:17UTC. V zimě jde o05:17,09:17 a11:17 vPraze, v létě o hodinu později. GitHub může plánované běhy zpozdit; při dlouhé neaktivitě veřejného repozitáře je může pozastavit. Ruční spuštění je dostupné v Actions.

GitHub Pages nemá vlastní server pro načtení jídelny, proto používá snapshot z tohoto workflow. Hostovaná veřejná verze načítá jídelnu serverově s desetiminutovou cache. Na obou se vybírá přesně dnešní datum vPraze. Při chybě se použije pouze datovaná záloha pro odpovídající den; včerejší jídlo se nevydává za dnešní.

## Přesnost podkladů

Web vychází z 20 dodaných rozvrhů učitelů a neobsahuje úplné suplování. Rozvrh1.A i místností je proto označený jako částečný. Bez záznamu neznamená volnou hodinu nebo dostupnou učebnu. Přítomnost učitele je odhad od první do poslední hodiny, včetně přestávek; není to skutečná docházka. Platnost rozvrhů12.10.2026–30.6.2027.

Půdorys je orientační překreslení2.NP (1.patra). K dispozici je originální evakuační PDF a porovnání s obrysem ČÚZK/DKM. Čísla učeben v podkladu chybí. Rozdíly u dvorů a středního traktu jsou viditelné v překryvu a nejsou násilně odstraněné. Podrobnosti v `docs/pudorys.md`. Portréty byly upravené podle dodaných fotografií; popis v `docs/portrety.md`.

## Údržba a kontrola

Po změně `assets/data.json` spusť `python tools/update-data.py`. Ruční obnova jídelníčku: `python tools/update-lunch.py --output assets/lunch.json`, potom opět `python tools/update-data.py`. Půdorys lze obnovit příkazem `python tools/build-floorplan.py`.

Kontroly: `node tests/startup.cjs`, `node tests/new-teachers.cjs`, `node tests/daily-tools.cjs`, `node tests/offline.cjs`, `node tests/floorplan.cjs`.

Zdroj kalendáře a kontaktů byl pořízen22.10.2026, další rozvrhy a plán přidány27.10.2026. Veřejná verze pro1.A připravená30.10.2026. Závazné informace a změny vždy poskytuje škola.

## Správa webu (2. 11. 2026)

Odkaz **Správa webu** v patičce otevře přihlášení správce. Po přihlášení lze upravit úvod, přidávat a mazat příspěvky třídní nástěnky, odkazy a veřejné poznámky ke všem dodaným učitelům. Tlačítko **Uložit a zveřejnit** uloží společný obsah na server. Ostatní návštěvníci ho načtou při otevření stránky nebo do minuty. V sekci **Účet a heslo** lze změnit heslo; tím se zneplatní všechny relace. Hesla nejsou součástí této zálohy.

Kořen ZIPu je statická verze pro GitHub Pages. GitHub Pages nespouští serverové přihlášení ani databázi; její odkaz Správa webu proto vede na fungující veřejný hostovaný rozcestník. Vlastní GitHub Pages kopie nesynchronizuje sdílenou nástěnku. Pro současné používání všech funkcí používej veřejnou adresu uvedenou nahoře.

Složka **server-source/** obsahuje také úplné zdrojové soubory hostované serverové verze (Vinext/Cloudflare Workers, databázové schéma, migrace, testy a veřejné soubory). Neobsahuje produkční databázi, přihlášené relace ani tajné hodnoty. Návod k serverové části: `server-source/docs/admin.md`.

## Redakční systém PRO

Nová správa umí učitele a kruhové portréty, editaci rozvrhů, účty redaktorů, aktuality s koncepty a náhledem, vlastní stránky, obsah všech sekcí, kalendář, dokumenty, mediatéku, vzhled, historii verzí a export/import obsahu. Zámeček **Správa** je také v horní liště. Původní přihlášení je zachované.

Redaktor upravuje vlastní aktuality a nahrává média. Administrátor `kubicek` spravuje celý obsah a účty. Role jsou vynucené serverově. Fotografie, PDF a nahraná videa jsou uložené v R2 (`BUCKET`), obsah a účty v D1 (`DB`). Zdrojová záloha neobsahuje živou databázi ani nahrané R2 soubory. Veřejný hostovaný web všechny funkce podporuje; statický GitHub Pages export zůstává alternativou základního rozcestníku a odkazuje na živou správu.

Testy celé serverové verze: ve složce `server-source/` nainstaluj závislosti a spusť `npm test`. Podrobnosti v `server-source/docs/admin.md`.

## Bezpečné zveřejnění

Pravidla pro hesla, serverová oprávnění a tajné soubory najdeš v `SECURITY.md`. Export a sestavení zastaví automatická kontrola při nálezu zakázaných souborů nebo rozpoznatelných přihlašovacích údajů. Nové heslové záznamy používají scrypt; starší PBKDF2 se při úspěšném přihlášení automaticky převedou. Skutečná hesla, jejich hashe, relace a runtime secrets nejsou součástí zdrojové zálohy.

## Poslední doplnění · 3. 11. 2026

Všech 20 profilů má dodaný rozvrh, 19 učitelů fotografický kruhový portrét; ostatní mají náhradní ilustraci. Bálkův rozvrh zahrnuje 18 hodin TEV a dohledy. Pod jídelníčkem je tlačítko Objednat si. Theimerovo video se spouští pouze v profilu, třikrát se zvukem; poté se zastaví. Návštěvník může přehrávání zastavit i upravit hlasitost.

## Ikona, aktuality a notifikace · 3. 11. 2026

Aplikace má novou ikonu B v PNG 192/512 px a apple-touch-icon 180 px, včetně maskovatelné varianty. Po změně staré instalace může být potřeba ikonu odebrat z plochy a web znovu přidat. Aktuality mají jednotný náhled 4:3 vedle textu; velikost uploadu nemění rozvržení stránky.

Tlačítko Upozornění umožňuje dobrovolný odběr nových zveřejněných aktualit na hostovaném webu. Povolení se vyžádá až po vlastním stisknutí Zapnout upozornění. Na iPhonu/iPadu se web nejprve přidává na plochu. Statický GitHub Pages export nemá server odběrů: pro notifikace používej veřejnou hostovanou adresu nahoře. Živý widget na ploše telefonu není součástí webu a vyžadoval by nativní mobilní aplikaci.

Push používá standard VAPID a prázdnou zprávu, při jejímž doručení service worker načte poslední nově publikovanou aktualitu. I při výpadku zobrazí obecné upozornění. Formuláře odběru chrání kontrola původu, omezení počtu pokusů, klíč pro zrušení odběru a povolený seznam push služeb. Podpisové klíče a adresy odběrů vznikají pouze v produkční databázi a nejsou v ZIPu.

## Hlášení chyb a další portréty

V patičce všech stránek je Nahlásit chybu. Návštěvník vybere oblast, popíše problém a odešle formulář. Hlášení obsahuje sekci webu; nevyžaduje jméno, e-mail ani přihlášení. Zobrazuje se pouze hlavnímu administrátorovi v Podněty a chyby. Ten může měnit stav Nové / Řeší se / Vyřešené a přidat interní poznámku. Data nejsou veřejná a nejsou součástí tohoto ZIPu. Stejně jako přihlášení a push vyžaduje tato funkce hostovaný server, nikoli samotné GitHub Pages.

Miriam Humeová a Hynek Petroš mají nové kruhové portréty 1024 × 1024 px; doplněný Facebook Hynka Petroše je odkaz dodaný uživatelem.

Kalendář obsahuje svátky aktuálních vyučujících podle českého kalendáře a samostatné písemky 1.A. Redaktoři přidávají a upravují vlastní písemky ve Správě → Kalendář; hlavní administrátor může spravovat všechny. Ve zvonku Upozornění lze samostatně vybrat aktuality, svátky, školní události a písemky. Starší odběry si nové kategorie zapnou uložením výběru. Server je připravený na automatický souhrn na zítřek od 18:00 Europe/Prague přes propojenou úlohu; podrobnosti a přenos na jiný hosting jsou v `docs/calendar-reminders.md`.

V den jmenin vyučujícího se při otevření stránky ukáže animované přání s aktuálním portrétem a SVG čepičkou. Po zavření zůstává sváteční proužek. Snížený pohyb systému se respektuje. Hlavní správce má v nastavení náhled přání a testovací rozeslání upozornění všem aktivním zařízením s přehledem přijetí push službou. Detaily jsou v `docs/calendar-reminders.md`.

### Když nechodí upozornění na iPhone

V Safari přidej web přes Sdílet na plochu a otevři jej novou ikonou. Ve zvonku Upozornění klepni na Zkontrolovat připojení, případně Opravit připojení a pak Zapnout upozornění. Použij Vyzkoušet na tomto telefonu; test se odešle jen na dané zařízení a ukáže, zda ho služba Apple přijala. V Nastavení iPhonu zkontroluj oznámení pro název své ikony a režim Soustředění. Je potřeba iOS/iPadOS 16.4 nebo novější a hostovaná serverová verze webu.
