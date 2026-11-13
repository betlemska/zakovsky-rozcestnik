# Betlémská · veřejná verze 2

Žákovský rozcestník na https://betlemska.github.io/zakovsky-rozcestnik/.

Obsahuje aktuální veřejný obsah provozního rozcestníku, rozklikávací rozvrhy 20 tříd, zapsané změny výuky, písemky, školní akce, učitele, kabinetní kontakty, jídelnu, pravidla tělocviku, oblíbené a 360° prohlídku. Mezi navazujícími hodinami přehled ukazuje Přestávka.

Oficiální školní zpráva má vlastní označení a odkaz přímo na článek školy. GitHub Actions obnovuje RSS a jídelníček přibližně každých deset minut během pracovního dne a jednou denně. Běhy se mohou zpozdit. Při výpadku zdroje se použije poslední ověřená kopie s datem zprávy nebo jídelníčku.

Redakční obsah a písemky se za připojení načítají z veřejného rozhraní provozního webu. Při výpadku zůstává poslední vložená kopie. Správa otevírá provozní administraci, kde se spravují účty a jejich oprávnění. Upozornění push a hlášení chyb jsou dostupné na provozním webu. Samostatné GitHub Pages používá místní oblíbené, poznámky a offline úložiště pro tuto doménu.

## Sestavení a kontroly

Potřebuješ Python 3.12+, Node 24 a curl. Pro statickou verzi nejsou potřeba další balíčky.

```sh
python tools/update-lunch.py --output assets/lunch.json
python tools/update-school-news.py --output assets/school-news.json
python tools/prepare-pages.py
python tools/security-check.py --export _site
python -m unittest discover -s tests -p 'test_*.py'
node tests/static-export.cjs
node tests/offline.cjs
node tests/daily-tools.cjs
node tests/menu-parser.test.mjs
```

Výstup pro Pages vznikne v `_site/`. Data v `assets/content.json` pocházejí výhradně z veřejného rozhraní. Soukromé účty, hesla, přihlášení a koncepty se neexportují.

Po každém sestavení se změní otisk offline verze podle veřejných souborů a dat. Starší návštěvníci tak obdrží aktualizovaný rozcestník. Manifest a cesty podporují projektový adresář `/zakovsky-rozcestnik/`.
