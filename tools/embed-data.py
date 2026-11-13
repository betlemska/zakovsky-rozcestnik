"""Keep the file:// fallback in index.html in sync with assets/data.json."""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'public'
data=json.loads((root/'assets/data.json').read_text())
payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
script='<script type="application/json" id="school-data">'+payload+'</script>'
page=(root/'index.html').read_text()
if 'id="school-data"' in page:
 page=re.sub(r'<script type="application/json" id="school-data">.*?</script>',lambda _:script,page,flags=re.S)
else:page=page.replace('<script src="presence.js',script+'<script src="presence.js')
(root/'index.html').write_text(page)
print('Embedded data synchronized:',len(data['teachers']),'teachers')

lunch_path=root/'assets/lunch.json'
if lunch_path.exists():
 lunch=json.loads(lunch_path.read_text())
 payload=json.dumps(lunch,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
 tag='<script type="application/json" id="lunch-data">'+payload+'</script>'
 page=(root/'index.html').read_text()
 if 'id="lunch-data"' in page:page=re.sub(r'<script type="application/json" id="lunch-data">.*?</script>',lambda _:tag,page,flags=re.S)
 else:page=page.replace('<script src="presence.js',tag+'<script src="presence.js')
 (root/'index.html').write_text(page)

# Server and browser share calendar logic and the public school fallback.
repository=Path(__file__).resolve().parents[1]
if (repository/'public').is_dir() and (repository/'lib/calendar-core.mjs').exists():
 change=(repository/'lib/lesson-changes.mjs').read_text().replace('export const LessonChanges=api;','')
 (repository/'public/lesson-changes.js').write_text("(function(root){'use strict';\n"+change+"\nif(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaLessonChanges=api;\n})(typeof window!=='undefined'?window:globalThis);\n")
 core=(repository/'lib/calendar-core.mjs').read_text().replace("import {LessonChanges} from './lesson-changes.mjs';",'const LessonChanges=root.BetlemskaLessonChanges;').replace('export const Calendar=api;','')
 (repository/'public/calendar-core.js').write_text("(function(root){'use strict';\n"+core+"\nif(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaCalendar=api;\n})(typeof window!=='undefined'?window:globalThis);\n")
 weather=(repository/'lib/weather-core.mjs').read_text().replace('export const Weather=api;','')
 (repository/'public/weather-core.js').write_text("(function(root){'use strict';\n"+weather+"\nif(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BetlemskaWeatherCore=api;\n})(typeof window!=='undefined'?window:globalThis);\n")
 (repository/'lib/school-defaults.json').write_text(json.dumps({'teachers':data['teachers'],'events':data['events']},ensure_ascii=False,separators=(',',':'))+'\n')
