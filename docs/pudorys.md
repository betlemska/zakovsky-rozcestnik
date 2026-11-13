# Zpracování půdorysu 2. NP

## Podklad

Uživatelem dodaný soubor 445829771918276.pdf: jedna fotografie evakuačního plánu s titulkem „2. NADZEMNÍ PODLAŽÍ“. To odpovídá 1. patru. Dokument neobsahuje čísla učeben ani číselné měřítko. Původní PDF je zachované beze změny v assets/plans/evakuacni-plan-2np-original.pdf; kontrolní SHA256 je v zpracovani-planu.json. JPEG je původní vložený obrázek extrahovaný z PDF bez překódování.

## Čistá verze

Jde o ruční vektorové překreslení stěn a prostorů podle fotografie. Není použita generativní AI pro doplňování geometrie. Výkres rozlišuje místnosti, chodby, dvě schodiště a sanitární prostory. Neoznačené prostory nejsou propojené s čísly učeben z rozvrhů. Čísla v interních identifikátorech room-1 apod. jsou pouze technické identifikátory, nejsou čísly školních místností.

Čistá verze je určená pro orientaci: drobné stavební detaily, okna, dveřní křídla a požární značení nejsou úplným stavebním výkresem. Požární symboly a směry evakuace zůstávají v originálu; orientační schéma je nenahrazuje.

## ČÚZK a geometrie

Ověřená adresa: Betlémská 287/4, Praha 1 – Staré Město, adresní místo21717940. Stavební objekt21644071, parcela220, katastrální území727024. ČÚZK RÚIAN dodává obrys s kódem zdroje1 = DKM. Souřadnice EPSG:5514, data stažená27.10.2026.

Směr severní dlouhé fasády:6.3743327083°, směr druhé dlouhé fasády:17.3642693547° v osách S-JTSK. Rozdíl10.9899366464°. Fasády nejsou rovnoběžné. Body ani úhly registrovaného obrysu nebyly deformované: pro společné zobrazení se používá pouze rotace, posun a jednotné měřítko.

Fotografovaný půdorys je orientačně projektivně vyrovnaný podle čtyř odpovídajících konců hlavních fasád. Souřadnice bodů a transformační matice jsou v assets/plans/zpracovani-planu.json a tools/floorplan-inputs. Další kontrolní body u schodišť/dvorů sloužily k porovnání; nejde o deklarovanou metrickou přesnost.

Většina hlavních vnějších linií odpovídá, ale kolem otevřeného dvora a středního traktu se půdorys2.NP od registrovaného obrysu místy liší. Obrys DKM není výkres konkrétního podlaží. Příčinu nelze pouze z těchto podkladů rozhodnout; může jít o různé půdorysy podlaží, zjednodušení zdroje nebo jiné odchylky. Rozdíly proto nejsou násilně odstraněné a vnitřní členění zůstává podle dodaného plánu.

## Výstupy

- pudorys-2np.svg – čisté orientační schéma.
- porovnani-cuzk.svg – stejné schéma s oranžovým obrysem DKM.
- evakuacni-plan-2np-original.pdf – nezměněný zdroj.
- evakuacni-plan-2np-sken.jpg – původní vložený obrázek.
- obrys-cuzk-5514.geojson – stažené geodetické body.
- overeni-cuzk.json – identita a výpočet fasád.
- mapa-cuzk.png – skutečný mapový export okolí školy.

## Primární zdroje

© ČÚZK, RÚIAN / DKM:

https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer/3
https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer/3/query?where=kod%3D21644071&outFields=*&returnGeometry=true&f=json
https://vdp.cuzk.gov.cz/vdp/ruian/stavebniobjekty/21644071
