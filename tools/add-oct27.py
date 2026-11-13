"""Add the two user-supplied timetables and eight restored headshots."""
from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parents[1];assets=root/'public/assets';source=Path('/workspace/scratch/ef347174117d')
d=json.loads((assets/'data.json').read_text())
def lesson(day,hour,cls,subject,room,group=''):
 return dict(day=day,hour=hour-1,cls=cls,classes=[cls],subject=subject,room=room,group=group,raw=' '.join(x for x in [group,cls,subject,'('+room+')'] if x))
martinec=[lesson(0,4,'1.L','MAT','U1'),lesson(0,7,'2.L','MAT','U16'),lesson(0,8,'4.B','MAT','U20'),lesson(0,9,'4.B','MAT','U20'),lesson(1,1,'1.L','MAT','U1'),lesson(1,2,'1.L','MAT','U1'),lesson(1,5,'4.B','MAT','U12'),lesson(1,8,'2.L','MAT','U16'),lesson(1,9,'2.L','MAT','U16'),lesson(4,1,'2.L','MAT','U16'),lesson(4,3,'1.L','MAT','U1'),lesson(4,5,'4.B','MAT','U12')]
theimer=[lesson(0,3,'3.I','HRW','HRW','1/2'),lesson(0,4,'3.I','HRW','HRW','1/2'),lesson(0,7,'2.I','HRW','HRW','2/2'),lesson(0,8,'2.I','HRW','HRW','2/2'),lesson(1,1,'3.I','HRW','HRW','2/2'),lesson(1,2,'3.I','HRW','HRW','2/2'),lesson(1,3,'2.I','HRW','HRW','1/2'),lesson(1,4,'2.I','HRW','HRW','1/2'),lesson(1,5,'4.I','HRW','HRW','2/2'),lesson(1,6,'4.I','HRW','HRW','2/2'),lesson(2,8,'4.I','HRW','HRW','1/2'),lesson(2,9,'4.I','HRW','HRW','1/2')]
for id,name,first,last,title,code,role,phone,email,schedule,filename in [
 ('lubomir-martinec','Lubomír Martinec','Lubomír','Martinec','Mgr.','ML','zástupce ředitele','251092101','lubomir.martinec@betlemska.cz',martinec,'WhatsApp Image 2026-10-27 at 09.45.56.jpeg'),
 ('martin-theimer','Martin Theimer','Martin','Theimer','Ing.','TM','statutární zástupce ředitele','251092104','martin.theimer@betlemska.cz',theimer,'WhatsApp Image 2026-10-27 at 09.45.57.jpeg')]:
  t=dict(id=id,name=name,first=first,last=last,title=title,suffix='',code=code,role=role,room='kancelář zástupců',phone=phone,email=email,emailSource='Kontakt ověřen ve školních podkladech.',classroom='',schedule=schedule,subjects=sorted(set(l['subject'] for l in schedule)),duties='',scheduleSource='assets/'+id+'-rozvrh.jpeg',scheduleSourceType='image',scheduleValidFrom='2026-10-12',scheduleAdded='2026-10-27')
  d['teachers']=[old for old in d['teachers'] if old['id']!=id]+[t]
  shutil.copyfile(source/'upload'/filename,assets/(id+'-rozvrh.jpeg'))
paths=json.loads((source/'portrait-map-oct27.json').read_text())
for id,path in paths.items():
 t=next(t for t in d['teachers'] if t['id']==id)
 dest=assets/'portraits'/(id+'.png');dest.parent.mkdir(exist_ok=True)
 shutil.copyfile(path,dest)
 t['photo']='assets/portraits/'+id+'.png';t['photoKind']='circular-restored';t['photoUpdated']='2026-10-27'
d['updated']='2026-10-27';d['teacherCount']=len(d['teachers']);d['photoCount']=len(paths)
assert len(d['teachers'])==19
assert sum(len(t['schedule']) for t in d['teachers'])==362
(assets/'data.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
print('Updated:',len(d['teachers']),'teachers,',len(paths),'portraits, 362 lesson cells.')
