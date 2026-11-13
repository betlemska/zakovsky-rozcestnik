# Žákovský rozcestník Betlémská

**Celá škola pohromadě.** Rozvrhy 20 tříd, 56 učitelských profilů, vyhledávání, propojené hodiny, písemky, školní kalendář, jídelna a 360° prohlídka SPŠS Betlémská.

Každá třída má vlastní rozklikávací rozvrh; volba Moje třída se ukládá v prohlížeči. Vyučující mají samostatné datové složky a profily. Výuka zachovává skupiny, společné semináře a sudé/liché týdny. Přítomnost je odhad podle rozvrhu.

Provozní aplikace v `public/` a `app/` používá server Vinext/Cloudflare a databázi D1. Administrace ukládá sdílené písemky a změny výuky. Redaktor smí zapisovat jen do přidělených tříd; hlavní administrátor spravuje všechny. Samotné GitHub Pages je statické, čte veřejný obsah z provozního backendu a Správa otevírá jeho administraci. Přihlašovací údaje a databáze v repozitáři nejsou.

```sh
bash scripts/install-pnpm.sh
npm test
npm run build
```

Import fotografií a známý rozpor u spoluvýuky tělocviku jsou popsány v [podkladech rozvrhů](docs/timetables/README.md). Rozvrhy jednotlivých tříd jsou v `public/assets/classes/`, učitelské profily v `public/assets/teachers/`. Původní fotografie rozvrhů a učitelů nejsou součástí veřejného vydání; profilové portréty zůstávají.

GitHub Pages se sestavuje z veřejného exportu. Provozní administrace, push a soukromá hlášení běží na serveru; GitHub neuchovává hesla, koncepty ani soukromé podněty. Podrobnosti jsou v `docs/admin.md`, `docs/calendar-reminders.md` a `SECURITY.md`.

Třídní předsedové a zástupci mají vlastní redakční účet pro svoji třídu a mohou přidávat vlastní celoškolní události. Přihlašovací údaje nejsou ve veřejném repozitáři. Redakční články jsou zrušené; na úvodu zůstává automatická zpráva z webu školy.
