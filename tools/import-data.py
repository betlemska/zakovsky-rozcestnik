import re,json,pathlib,shutil,unicodedata,fitz,sys
source=pathlib.Path(sys.argv[1]).resolve() if len(sys.argv)>1 else pathlib.Path.cwd()
out=pathlib.Path(__file__).resolve().parents[1]/'public/assets'
def norm(s):return ''.join(c for c in unicodedata.normalize('NFKD',s) if not unicodedata.combining(c)).lower()
def slug(s):return re.sub('[^a-z0-9]+','-',norm(s)).strip('-')
existing_path=out/'data.json'
existing=json.loads(existing_path.read_text()) if existing_path.exists() else {}
teachers=[]
for l in (source/'sources/contacts.txt').read_text().splitlines():
 if not re.match(r'^\s*\d+\.',l):continue
 a=re.split(r'\s{2,}',l.strip())
 if not any(v in a[4] for v in ['učitel','ředitel']):continue
 titlelast=a[2].split();last=titlelast[-1];title=' '.join(titlelast[:-1]);first=a[3]
 if last=='Persidský':last='Záhon Persidský';title='RNDr.'
 if first=='Jří':first='Jiří';last='Götz'
 name=first+' '+last
 rest=a[5:]
 room=rest[-1];line=rest[-2] if len(rest)>1 else ''
 classroom=rest[0] if len(rest)==3 else ''
 if a[1]=='TE':line='128';classroom='3. a 4. L'
 if a[1]=='TM':line='104';room='kancelář zástupců'
 t=dict(id=slug(name),name=name,first=first,last=last,title=title.replace('Mgr., MBA','Mgr.'),suffix='MBA' if 'MBA' in title else '',code=a[1],role=a[4],room=room,phone='251092'+line if re.fullmatch(r'\d{3}',line) else '',classroom=classroom,email=norm(first)+'.'+norm(last).replace(' ','')+'@betlemska.cz',emailSource='Adresa odvozena z formátu jméno.příjmení v telefonním seznamu.',schedule=[],subjects=[])
 teachers.append(t)
for file in (source/'sources/timetables').glob('*.pdf'):
 n=norm(file.stem).replace('stefanakova','stefanakova')
 t=next((t for t in teachers if norm(t['name'])==n),None)
 if not t:print('UNMATCHED',file);continue
 p=fitz.open(file)[0]
 words=p.get_text('words')
 for day in range(5):
  for hour in range(10):
   x0=42+58.4*hour;y0=85+94*day
   ws=[w for w in words if x0<=(w[0]+w[2])/2<x0+58.4 and y0<=(w[1]+w[3])/2<y0+94]
   texts=[w[4] for w in sorted(ws,key=lambda w:(round(w[1]/3),w[0]))]
   clses=[w for w in texts if re.fullmatch(r'[1-4]\.[ABCIL]',w)]
   if not clses:continue
   cl=', '.join(clses)
   group=next((w for w in texts if re.fullmatch(r'[12]/2',w)),'')
   remain=[w for w in texts if w not in clses+[group,'1.P','2.P','PŘ','SP','JD']]
   raw=' '.join(remain)
   candidates=[w for w in remain if re.match(r'^[A-ZČĚŘŠŤÚŮŽ]{2,}',w)]
   subjectword=candidates[-1] if candidates else ''
   m=re.match(r'([A-ZČĚŘŠŤÚŮŽ][A-Za-zČĚŘŠŤÚŮŽ]+)(.*)',subjectword)
   if not m:print('NO SUBJECT',t['name'],texts);continue
   subject=m[1];rooms=re.findall(r'\(([^)]+)\)',raw);room=rooms[-1] if rooms else ''
   t['schedule'].append(dict(day=day,hour=hour,cls=cl,classes=clses,group=group,subject=subject,room=room,raw=' '.join(texts)))
 t['duties']='\n'.join(b[4].strip() for b in p.get_text('blocks') if b[0]>=630 and b[1]>=85)
 t['subjects']=sorted(set(l['subject'] for l in t['schedule']))
 t['pdf']='assets/'+t['id']+'.pdf'
 shutil.copyfile(file,out/(t['id']+'.pdf'))
# Uploaded portraits are paired by the user's filenames.
for n,f in [('Ladislav Trnka','ladislav trnka.png'),('Pavel Pokorný','pavel pokorny.png'),('Karel Bernat','karel bernart(1).png'),('Lucie Asali','lucie asali.jpeg')]:
 t=next(t for t in teachers if t['name']==n);ext=pathlib.Path(f).suffix;t['photo']='assets/'+t['id']+ext;shutil.copyfile(source/'upload'/f,out/(t['id']+ext))
events=[]
for l in (source/'sources/calendar.txt').read_text().splitlines():
 m=re.match(r'^\s*(\d{1,2})\.(\d{1,2})\.(\d{2})\s+(?:PO|ÚT|ST|ČT|PÁ|SO|NE)\s+(.+?)\s*$',l)
 if not m:continue
 d,mo,y,text=m.groups();parts=re.split(r'\s{3,}',text);title=parts[0];time=' '.join(parts[1:]);date=f'20{y}-{int(mo):02}-{int(d):02}'
 if title=='DOD':title='Den otevřených dveří'
 kind='volno' if any(x in title.lower() for x in ['prázdniny','svátek','velký pátek','velikonoční pondělí']) else 'akce'
 events.append(dict(date=date,title=title,time=time,kind=kind))
# Wrap lines in the first August rows; retained original PDF is authoritative.
shutil.copyfile(source/'sources/calendar.pdf',out/'kalendarni-plan-2026-2027.pdf')
shutil.copyfile(source/'upload/Telefonn_seznam_pro_k_r_2026_-_2027_aktuln.pdf',out/'telefonni-seznam-2026-2027.pdf')
for t in teachers:
 if t['code']=='TK':t['role']='učitelka; metodička prevence';t['classroom']='1. B'
for e in events:
 if e['date']=='2026-08-26':e['title']='Doklasifikační a opravné zkoušky, předmětové komise, praktické MZ (VYT3)';e['time']='dle rozpisu'
 if e['date']=='2026-08-27':e['title']='Doklasifikační a opravné zkoušky, praktické MZ (2 žáci – 4. C, 4. I), předmětové komise, praktické MZ (CAM)';e['time']='dle rozpisu'
 if e['date']=='2026-08-25':e['time']='dle rozpisu'
teachers=[t for t in teachers if t['schedule']]
for previous in existing.get('teachers',[]):
 match=next((t for t in teachers if t['id']==previous['id']),None)
 if match:
  for key in ['photo','photoKind','photoUpdated']:
   if key in previous:match[key]=previous[key]
 elif previous.get('scheduleSource') and previous.get('schedule'):teachers.append(previous)
data=dict(teachers=teachers,events=events,updated='2026-10-22',validFrom='2026-10-12')
data['updated']=max(data['updated'],existing.get('updated',''))
if existing.get('assetSources'):data['assetSources']=existing['assetSources']
data['teacherCount']=len(teachers)
data['photoCount']=sum(t.get('photoKind')=='circular-restored' for t in teachers)
(out/'data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
print(len(teachers),'teachers;',sum(bool(t['schedule']) for t in teachers),'schedules;',len(events),'events;',sum(len(t['schedule']) for t in teachers),'lessons')
for t in teachers:
 if t['schedule']:print(t['name'],len(t['schedule']),t['subjects'])
