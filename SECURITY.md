# Zabezpečení a publikace na GitHub

Odkaz se zámečkem pouze otevírá administraci. Každý zápis na serveru vyžaduje platnou relaci a oprávnění. Skrytí, odstranění nebo obejití odkazu žádná oprávnění nedává.

## Hesla a přihlášení

Nová hesla používají scrypt (N=16384, r=8, p=5, náhodná sůl 16 bajtů, výstup 32 bajtů). Jde o jednu z konfigurací doporučených OWASP s pracovním prostorem přibližně 16 MiB. Starší záznamy PBKDF2-SHA256 se po úspěšném přihlášení převedou na scrypt bez změny hesla. Bootstrap hodnota zůstává pouze jako tajná runtime proměnná a není v repozitáři.

Hesla se neukládají otevřeně a nejdou z administrace vyčíst. Relace používá náhodný 256bitový token v cookie Secure, HttpOnly, SameSite=Strict; v databázi je pouze SHA-256 tokenu. Platnost je 12 hodin. Odhlášení token zneplatní, změna hesla zneplatní všechny relace daného účtu. Kontroluje se původ zápisů i typ JSON, počet přihlašovacích pokusů se omezuje. Oprávnění redaktorů a vlastnictví článků se kontrolují na serveru.

Původní dočasné heslo před běžným používáním změň v **Můj účet** na dlouhé unikátní heslo. Hashování neochrání účet, když někdo zná jeho skutečné heslo. Dvoufaktorové přihlášení není součástí této verze.

## Co patří na GitHub

Publikovat lze zdrojové soubory, veřejné podklady, schéma databáze, migrace a testy s demonstračními údaji. Algoritmus ani názvy API nejsou tajné; bezpečnost stojí na serverových kontrolách a tajných přihlašovacích údajích.

Do veřejného repozitáře nepatří skutečné `.env`, `.dev.vars`, databáze/dumpy s účty, heslové hashe, session tokeny, privátní klíče ani obsah `.wrangler`. Dodaný `.gitignore` je vylučuje a test exportu zakázané soubory kontroluje. `.env.example` je pouze prázdný příklad názvů proměnných.

Ochrana `.gitignore` neodstraní tajemství už dříve commitnutá. Pokud někdy unikne heslo nebo klíč do historie repozitáře, změň/odvolej ho; nestačí soubor smazat v posledním commitu. Přístup k úpravám repozitáře a jeho nasazení má samostatně nastavený GitHub účet.

GitHub Pages spouští jen statickou část. Bezpečná společná administrace vyžaduje server, databázi a runtime secrets. Statický export proto odkazuje na živý hostovaný web; hesla se nesmějí přidat do HTML/JavaScriptu, aby přihlášení fungovalo jen v prohlížeči.

## Rozsah ověření

`npm test` ověřuje nepřihlášené a podvržené relace, role, cizí články, koncepty, odmítnutí zápisu z jiného původu, změnu hesla, zneplatnění relací, limity pokusů, migraci heslových hashů, validaci a export bez tajných souborů. Jde o kontrolu kódu a automatické testy; není to záruka neprolomitelnosti ani nezávislý penetrační audit.

Reference: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
