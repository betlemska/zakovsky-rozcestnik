"""Compile the reviewed, source-linked class transcription into one shared school model."""
import json, re, unicodedata
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def plain(s):return ''.join(c for c in unicodedata.normalize('NFD',s) if not unicodedata.combining(c))
def slug(s):return re.sub(r'[^a-z0-9]+','-',plain(s).lower()).strip('-')
data=json.loads((ROOT/'public/assets/data.json').read_text())
old={t['code']:t for t in data['teachers']}
for line in (ROOT/'docs/timetables/new-teachers.tsv').read_text().splitlines():
 code,first,last,title,role,room,phone,cls=line.split('|')
 if code not in old:
  old[code]=dict(id=slug(first+' '+last),name=first+' '+last,first=first,last=last,title=title,suffix='Ph.D.' if code in ['KŘ','RL'] else '',code=code,role=role,room=room,phone='251092'+phone,classroom=cls,email='' if code=='ZP' else plain(first+'.'+last).lower(),emailSource='Adresa odvozena z formátu ve školním telefonním seznamu; doručitelnost nebyla ověřena.',schedule=[],subjects=[],duties='',fallbackAvatar='female' if role.startswith('učitelka') else 'male',photo='',externalLinks=[])
  if old[code]['email']:old[code]['email']+='@betlemska.cz'
classes={};current=None
for number,line in enumerate((ROOT/'docs/timetables/classes-2026-11-13.txt').read_text().splitlines(),1):
 line=line.strip()
 if not line or line.startswith('#'):continue
 if line.startswith('['):current=line[1:-1];classes[current]=[];continue
 assert current and len(classes[current])<5,(number,'day count')
 cells=line.split();assert len(cells)<=10,(number,'hour count',len(cells))
 expanded=[]
 for i,token in enumerate(cells):
  if token=='*':assert expanded;token=expanded[-1]
  expanded.append(token)
 classes[current].append(expanded+['_']*(10-len(expanded)))
assert len(classes)==20 and all(len(rows)==5 for rows in classes.values())
lessons=defaultdict(dict);class_lessons=defaultdict(list)
for cls,rows in classes.items():
 for day,row in enumerate(rows):
  for hour,cell in enumerate(row):
   if cell=='_':continue
   for token in cell.split('&'):
    values=token.split(':');assert 3<=len(values)<=5,(cls,day,hour,token)
    subject,codes,room=values[:3];group=values[3] if len(values)>3 else '';pattern=values[4] if len(values)>4 else '';team=codes.split('+');assert all(t in old for t in team),(cls,token)
    primary=team[0];key=(day,hour,subject,room,group,pattern,codes)
    if key not in lessons[primary]:lessons[primary][key]=dict(day=day,hour=hour,subject=subject,room=room,group=group,classes=[],coTeacherIds=[old[t]['id'] for t in team[1:]],weekPattern=pattern,sourceClasses=[])
    lesson=lessons[primary][key];lesson['classes'].append(cls);lesson['sourceClasses'].append(cls)
    class_lessons[cls].append(dict(day=day,hour=hour,subject=subject,teacherId=old[primary]['id'],teacherCodes=codes,room=room,group=group,weekPattern=pattern))
for code,t in old.items():
 if code not in ['AL','BK','CO','GJ','HU','KZ','LV','PA','PJ','PH','PB','PP','PR','RO','SR','TR','VY','ML','TM','BA']:
  t['email']='';t['emailSource']='E-mail nebyl v dodaných podkladech ověřen.'
 t['schedule']=sorted(lessons[code].values(),key=lambda l:(l['day'],l['hour'],l['group'],l['weekPattern']))
 for l in t['schedule']:
  if l['day']==4 and l['hour'] in [0,1] and l['subject']=='TEV' and any(c in ['1.A','1.C'] for c in l['classes']) and code in ['PJ','LV']:l['jointTeaching']='Společný tělocvik: 1.A (2/2) a 1.C (1/2), Jakub Petrák a Vladislav Liszok.'
 for l in t['schedule']:l['cls']=', '.join(l['classes']);l['raw']=l['cls']+' '+l['subject']+' ('+l['room']+')'+(' · '+l['group'] if l['group'] else '')+(' · '+l['weekPattern'] if l['weekPattern'] else '')
 t['subjects']=sorted(set(l['subject'] for l in t['schedule']))
 t['scheduleValidFrom']='2026-10-12';t['scheduleValidTo']='2027-06-30';t['scheduleUpdated']='2026-11-13'
 t['scheduleProvenance']='Sjednoceno podle fotografií třídních a učitelských rozvrhů dodaných 13. 11. 2026; novější třídní podklady mají přednost.'
 if t['id']=='martin-theimer':t['video']='';t['videoEnabled']=False
 if 'Rozvrh zatím nebyl dodán' in t.get('bio',''):t['bio']=''
# Every teacher in the photos has an independent profile, even the two without class teaching.
class_sources={'1.A':4041,'2.A':4041,'1.B':4041,'2.B':4041,'1.C':4042,'2.C':4042,'1.I':4043,'2.I':4043,'1.L':4043,'2.L':4043,'3.A':4046,'4.A':4046,'3.B':4046,'4.B':4046,'3.C':4045,'4.C':4045,'3.I':4044,'4.I':4044,'3.L':4044,'4.L':4044}
source_groups={4023:'AM BM AL CP',4024:'BA CO BE GJ',4025:'BK HU',4026:'KC KF KŠ KV',4027:'JP KR',4028:'HL KZ JB KL',4029:'KŘ LV KJ ML',4030:'KM MP',4031:'LE ME LX MU',4032:'PI PO PA PP',4033:'NV PB',4034:'NA PJ NJ PH',4035:'PR SA RO SR',4036:'RL ŠJ',4037:'ST TE SV TL',4038:'TK VY',4040:'TP ZP TM TR'}
for source,codes in source_groups.items():
 for code in codes.split():old[code]['schedulePhotoSource']='';old[code]['scheduleSource']='';old[code]['pdf']=''
# Empty lesson placeholders and blank posted sheets do not become invented teaching records.
for code in ['HL']:assert code in old
metadata=[]
for cls in sorted(classes):
 teacher=next((t for t in old.values() if cls in t.get('classroom','').replace(' ','').split(',')),None)
 metadata.append(dict(id=cls,label=cls,year=int(cls[0]),representatives=[{'role':'Předseda','name':'Předseda '+cls},{'role':'Zástupce','name':'Zástupce '+cls}],classTeacherId=teacher['id'] if teacher else '',validFrom='2026-11-02' if cls in ['1.L','2.B','3.L'] else '2026-10-12',source='',sourcePhoto='',lessons=class_lessons[cls]))
 folder=ROOT/'public/assets/classes'/slug(cls);folder.mkdir(parents=True,exist_ok=True);(folder/'schedule.json').write_text(json.dumps(metadata[-1],ensure_ascii=False,indent=2)+'\n')
for t in old.values():
 folder=ROOT/'public/assets/teachers'/t['id'];folder.mkdir(parents=True,exist_ok=True);(folder/'profile.json').write_text(json.dumps(t,ensure_ascii=False,indent=2)+'\n')
data.update(teachers=[old[c] for c in ['AL','BK','CO','GJ','HU','KZ','LV','PA','PJ','PH','PB','PP','PR','RO','SR','TR','VY','ML','TM','BA']]+[t for c,t in old.items() if c not in ['AL','BK','CO','GJ','HU','KZ','LV','PA','PJ','PH','PB','PP','PR','RO','SR','TR','VY','ML','TM','BA']],classes=metadata,updated='2026-11-13',teacherCount=len(old),schoolwideRevision='2026-11-13-schoolwide-v2',timetableSourceCount=24,photoCount=sum(bool(t.get('photo')) for t in old.values()))
(ROOT/'public/assets/data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(teachers=len(old),classes=len(classes),classRecords=sum(map(len,class_lessons.values())),teacherRecords=sum(len(t['schedule']) for t in old.values())),ensure_ascii=False))
