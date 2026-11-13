from pathlib import Path
import json,math,html,shutil,hashlib
repo=Path(__file__).resolve().parents[1];root=repo/'tools/floorplan-inputs';public=repo/'public' if (repo/'public').exists() else repo;dest=public/'assets/plans';dest.mkdir(parents=True,exist_ok=True)
local=json.loads((root/'local-geometry.json').read_text());outer,hole=local['rings'];H=json.loads((root/'homography.json').read_text())['matrix']
def T(xy):
 p=[sum(row[i]*([*xy,1][i])for i in range(3))for row in H];return [round(p[0]/p[2],2),round(p[1]/p[2],2)]
def path(points,transform=True,close=True):
 pts=[T(p)for p in points]if transform else points
 return 'M '+' L '.join(f'{x} {y}'for x,y in pts)+(' Z'if close else '')
outline=[[38,254],[843,66],[864,82],[831,687],[807,713],[74,719],[64,627],[91,625],[91,600],[62,598],[54,506],[171,502],[168,587],[313,585],[325,310],[150,352],[164,418],[49,444]]
court=[[514,270],[695,227],[726,252],[708,505],[621,507],[617,582],[500,582]]
rooms=[
 [[41,262],[133,240],[143,313],[47,336]],[[140,239],[199,225],[211,299],[146,314]],[[205,225],[261,211],[271,284],[215,298]],[[266,210],[288,205],[300,277],[274,282]],[[294,203],[444,168],[456,240],[303,276]],[[449,166],[538,146],[551,217],[461,239]],[[544,145],[599,132],[614,202],[555,216]],[[606,130],[705,107],[718,177],[619,201]],[[711,106],[771,91],[765,169],[723,178]],
 [[778,90],[842,74],[857,87],[853,144],[776,147]],[[776,151],[853,148],[848,248],[767,247]],[[766,252],[846,253],[844,306],[761,307]],[[761,312],[842,311],[838,408],[752,406]],[[752,411],[838,414],[832,541],[748,538]],[[749,545],[831,548],[828,579],[745,577]],[[745,583],[827,585],[824,623],[745,620]],[[745,627],[825,628],[821,680],[800,699],[744,699],[744,684],[754,684],[755,640],[743,637]],
 [[72,633],[208,630],[202,707],[82,711]],[[212,630],[241,628],[237,705],[207,706]],[[245,628],[329,627],[325,704],[241,704]],[[334,626],[391,625],[389,703],[330,705]],[[396,625],[507,624],[506,701],[394,703]],[[511,624],[573,623],[573,701],[511,702]],[[579,622],[641,621],[641,702],[578,702]],[[646,621],[699,620],[700,701],[646,701]],[[704,620],[735,620],[736,701],[704,701]],
 [[332,311],[415,292],[413,346],[331,349]],[[331,353],[412,351],[410,412],[329,413]],[[329,419],[410,417],[404,582],[320,583]],[[420,319],[506,317],[499,582],[409,583]],[[423,289],[461,280],[463,314],[422,316]],[[466,280],[506,271],[506,311],[467,313]],[[59,510],[120,508],[119,590],[65,592]]]
corridor=[[118,326],[760,174],[766,180],[736,616],[167,625],[167,592],[712,585],[728,252],[695,226],[148,354],[158,413],[136,420],[126,382],[125,354]]
stairs1=[[47,343],[115,326],[128,385],[51,395]];stairs2=[[621,511],[705,510],[703,582],[618,582]]
wc1=[[51,400],[122,382],[135,421],[55,437]];wc2=[[126,508],[165,508],[163,589],[125,591]]
regions=[];shapes=[]
def region(id,label,kind,points,desc):
 regions.append({'id':id,'label':label,'kind':kind,'description':desc})
 title=html.escape(label);d=path(points);fills={'room':'#f4f6f7','corridor':'#e9f3f9','stairs':'#d3eafa','wc':'#dfe8f1'}
 shapes.append(f'<path class="fp-zone fp-{kind}" fill="{fills[kind]}" stroke="#50616d" stroke-width="1.6" stroke-linejoin="round" d="{d}" data-floor-zone="{id}" tabindex="0" role="button" aria-label="{title}"><title>{title}</title></path>')
region('corridor','Chodby a spojovací trakt','corridor',corridor,'Hlavní komunikační prostory v dodaném plánu 2. NP. Směr evakuace je dostupný v původním dokumentu.')
for i,points in enumerate(rooms):
 wing='horní křídlo'if i<9 else 'pravé křídlo'if i<17 else 'dolní křídlo'if i<26 else 'střední trakt'if i<32 else 'levá část'
 region('room-'+str(i+1),'Místnost · '+wing,'room',points,'Místnost překreslená z dodaného plánu. Číslo ani účel místnosti nejsou v podkladu uvedeny; nelze ji spolehlivě přiřadit ke konkrétní učebně.')
region('stairs-left','Schodiště · levá část','stairs',stairs1,'Schodiště je v podkladu u levého konce horní chodby. Jde o polohu ve 2. NP, nikoli potvrzení konkrétní únikové trasy.')
region('stairs-court','Schodiště · u vnitřního dvora','stairs',stairs2,'Schodišťový prostor u vnitřního dvora a dolní chodby podle dodaného plánu.')
region('wc-upper','WC · levá horní část','wc',wc1,'Sanitární prostor s vyznačenými kabinami podle původního plánu.')
region('wc-lower','WC · levá dolní část','wc',wc2,'Sanitární prostor s vyznačenými kabinami podle původního plánu.')
style='''svg{font-family:Arial,sans-serif}.fp-zone{stroke:#50616d;stroke-width:1.6;stroke-linejoin:round;cursor:pointer;transition:fill .15s}.fp-room{fill:#f4f6f7}.fp-corridor{fill:#e9f3f9;stroke:#87acc1}.fp-stairs{fill:#d3eafa;stroke:#2c86b8}.fp-wc{fill:#dfe8f1;stroke:#7095ae}.fp-zone:hover,.fp-zone:focus,.fp-zone.fp-selected{fill:#b9ddf2;stroke:#167cb4;stroke-width:2.5;outline:none}.fp-zone:focus{filter:drop-shadow(0 0 2px #167cb4)}.fp-label{fill:#3f647c;font-size:12px;letter-spacing:1px;font-weight:600;pointer-events:none}.fp-muted{fill:#8b969e;font-size:12px;letter-spacing:1.5px;pointer-events:none}.fp-step{fill:none;stroke:#37799e;stroke-width:1;pointer-events:none}'''
base=f'<rect width="1000" height="780" fill="#fff"/><path d="{path(outline)} {path(court)}" fill="#fafbfc" fill-rule="evenodd" stroke="#344954" stroke-width="3.2" stroke-linejoin="round"/>'+''.join(shapes)
# Stairs and toilet fixture marks are geometric redraws, no generative reconstruction.
for k in range(1,11):
 y=343+k*4;x1=51+(y-343)*.06;x2=118+(y-343)*.15
 base+=f'<path class="fp-step" fill="none" stroke="#37799e" stroke-width="1" d="{path([[x1,y],[x2,y-17]],close=False)}"/>'
for k in range(1,8):
 for a,b in [([622,518+k*7],[646,518+k*7]),([681,518+k*7],[702,518+k*7]),([651+k*6,514],[651+k*6,538])]:base+=f'<path class="fp-step" fill="none" stroke="#37799e" stroke-width="1" d="{path([a,b],close=False)}"/>'
for k in range(1,7):base+=f'<path class="fp-step" fill="none" stroke="#37799e" stroke-width="1" d="{path([[128,510+k*11],[143,510+k*11]],close=False)}"/>'
for k in range(1,7):base+=f'<path class="fp-step" fill="none" stroke="#37799e" stroke-width="1" d="{path([[54+k*10,399-k*2.3],[56+k*10,420-k*2.3]],close=False)}"/>'
for text,point,cls in [('SCHODIŠTĚ',[90,365],'fp-label'),('SCHODIŠTĚ',[663,559],'fp-label'),('WC',[91,413],'fp-label'),('WC',[147,553],'fp-label'),('OTEVŘENÝ DVŮR',[212,464],'fp-muted'),('VNITŘNÍ DVŮR',[613,395],'fp-muted')]:
 x,y=T(point);base+=f'<text class="{cls}" fill="#486b80" font-family="Arial,sans-serif" font-size="11" letter-spacing="0.8" x="{x}" y="{y}" text-anchor="middle">{text}</text>'
# Keep room numbering intentionally absent; original does not identify rooms.
def svg(body,title):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 780" role="group" aria-label="{title}"><title>{title}</title><style>{style}</style>{body}</svg>'
clean=svg(base,'Orientační půdorys 2. NP, 1. patro, SPŠS Betlémská')
cadastral_d=' '.join(path(ring,False)for ring in local['rings'])
comparison=svg(base+f'<path d="{cadastral_d}" fill="none" stroke="#c17c25" stroke-width="2.7" stroke-dasharray="8 5" pointer-events="none"/>','Porovnání půdorysu 2. NP s obrysem DKM ČÚZK')
(dest/'pudorys-2np.svg').write_text(clean);(dest/'porovnani-cuzk.svg').write_text(comparison)
source_anchors=[[38,254],[843,66],[807,713],[74,719]];target_anchors=[outer[40],outer[58],outer[4],outer[19]]
verification={'buildingCode':21644071,'parcel':'220','cadastralArea':'Staré Město 727024','floor':'2. NP (1. patro)','sourceType':'User-supplied scanned evacuation plan; no room numbers','cadastralSource':'ČÚZK RÚIAN, geometry source DKM, EPSG:5514','date':'2026-10-27','angularDifference':10.989936646388069,'transform':'Projective alignment of four main-facade endpoints. Manual vector tracing of original scan, no generated wall or room data.','sourceAnchors':source_anchors,'targetAnchors':target_anchors,'homography':H,'originalSHA256':hashlib.sha256((dest/'evakuacni-plan-2np-original.pdf').read_bytes()).hexdigest(),'limitations':['The scan has no scale or room numbers.','Registered footprint is not a survey of 2. NP.','Open courtyard and central tract differ; retain the supplied floor layout.','This orientation drawing does not replace the original evacuation plan.'],'sources':['https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer/3','https://vdp.cuzk.gov.cz/vdp/ruian/stavebniobjekty/21644071']}
(dest/'zpracovani-planu.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2))
config={'clean':clean,'comparison':comparison,'regions':regions,'floor':'2. NP · 1. patro','angularDifference':10.989936646388069}
(public/'floorplan.js').write_text('(function(root){\nconst plan='+json.dumps(config,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\nif(typeof module!=="undefined"&&module.exports)module.exports=plan;else root.BetlemskaFloorPlan=plan;\n})(typeof window!=="undefined"?window:globalThis);\n')
print('Clean floor plan:',len(rooms),'unlabeled room shapes;',len(regions),'interactive regions.')
