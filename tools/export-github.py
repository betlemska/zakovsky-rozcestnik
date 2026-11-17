"""Export the current public frontend and a reviewed public payload for Pages."""
import argparse,json,re,shutil,subprocess,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://betlemska-studentsky-rozcestnik.woodsy-toast-3721.chatgpt.site'
def replace_once(text,old,new):
    if text.count(old)!=1:
        raise ValueError('Review the Pages adapter for the changed frontend: '+old[:70])
    return text.replace(old,new,1)
def export(output,snapshot,archive=None,refresh=True):
    output=output.resolve()
    if output==ROOT or output.is_relative_to(ROOT) or ROOT.is_relative_to(output):
        raise ValueError('Use an output directory outside the source checkout')
    content=json.loads(snapshot.read_text())
    body=content['content']
    if not isinstance(body.get('teachers'),list) or not isinstance(body.get('posts'),list):
        raise ValueError('Expected the unauthenticated public content payload')
    if any(p.get('status')=='draft' for p in body['posts']) or any(p.get('published') is False for p in body.get('pages',[])):
        raise ValueError('Unpublished content must not be exported')
    # Fail closed rather than leaving links to server-only media in a static copy.
    if re.search(r'/?api/media/',json.dumps(content)):
        raise ValueError('Download and localize referenced public media before exporting')
    if output.exists():shutil.rmtree(output)
    shutil.copytree(ROOT/'public',output)
    for name in ['admin.html','admin.js','admin.css','reports.js']:
        (output/name).unlink(missing_ok=True)
    (output/'assets/content.json').write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')
    for directory in ['tools','tests','lib']:(output/directory).mkdir()
    for file in (ROOT/'tools/pages').iterdir():
        if file.is_file():shutil.copy2(file,output/'tools'/file.name)
    for name in ['update-lunch.py','security-check.py']:shutil.copy2(ROOT/'tools'/name,output/'tools'/name)
    for file in (ROOT/'tests/pages').iterdir():
        if file.is_file():shutil.copy2(file,output/'tests'/file.name)
    for name in ['offline.cjs','daily-tools.cjs','menu-parser.test.mjs']:
        shutil.copy2(ROOT/'tests'/name,output/'tests'/name)
    shutil.copytree(ROOT/'tests/fixtures',output/'tests/fixtures')
    shutil.copy2(ROOT/'lib/menu-parser.mjs',output/'lib/menu-parser.mjs')
    (output/'.github/workflows').mkdir(parents=True)
    shutil.copy2(ROOT/'docs/pages-workflow.yml',output/'.github/workflows/pages.yml')
    (output/'.nojekyll').touch()
    (output/'.gitignore').write_text('_site/\n__pycache__/\nnode_modules/\n')
    shutil.copy2(ROOT/'docs/pages-readme.md',output/'README.md')
    # These sharing assets always refer to the public Pages copy.
    shutil.copy2(ROOT/'tools/pages-qr.svg',output/'assets/qr-rozcestnik-1a.svg')
    (output/'assets/sdileni-1a.json').write_text(json.dumps({'url':'https://betlemska.github.io/zakovsky-rozcestnik/','title':'Betlémská — Žákovský rozcestník'},ensure_ascii=False,indent=2)+'\n')
    example=output/'celebration-preview.js'
    if example.exists():
        example.write_text(example.read_text().replace("new URL('api/content',document.baseURI)","new URL('"+ORIGIN+"/api/content')"))
    app=(output/'app.js').read_text()
    app=app.replace('href="admin.html"','href="'+ORIGIN+'/admin.html" target="_blank" rel="noopener noreferrer"')
    app=app.replace('Příspěvky, odkazy a poznámky označené jako poznámky správce jsou společné pro všechny a ukládají se na serveru.','Příspěvky, odkazy a poznámky správce jsou společné pro všechny. Jejich novou verzi zveřejňuje správce rozcestníku.')
    app=app.replace('Jídelníček na hostovaném webu načítá veřejnou nabídku jídelny přes server s desetiminutovou mezipamětí.','Jídelníček a oficiální školní aktuality se obnovují přibližně každých deset minut během pracovního dne. Obnovení se může zpozdit. Tlačítko Obnovit načte poslední zveřejněnou nabídku.')
    app=replace_once(app,'const publicURL="'+ORIGIN+'";',"const publicURL=new URL('index.html',document.baseURI).href;")
    app=replace_once(app,"let sharedContent=null,sharedLoading=false,sharedFingerprint='',sourceData=null;",
        "let sharedContent=null,sharedLoading=false,sharedFingerprint='',sourceData=null;\ntry{sharedContent=JSON.parse(document.querySelector('#content-data')?.textContent||'null')?.content||null}catch{}")
    app=replace_once(app,'sourceData=JSON.parse(JSON.stringify(data))','sourceData=JSON.parse(JSON.stringify(data));applyShared()')
    app=app.replace("new URL('api/content',document.baseURI)","new URL('"+ORIGIN+"/api/content')")
    app=app.replace("new URL('api/menu',document.baseURI)","new URL('assets/lunch.json',document.baseURI)")
    app=replace_once(app,"fetch('api/school-news')","fetch(new URL('assets/school-news.json',document.baseURI),{cache:'no-store'})")
    app=re.sub(r'let schoolArticle = .*?;\n',"let schoolArticle;\ntry{schoolArticle=JSON.parse(document.querySelector('#official-news-data').textContent)}catch{}\n",app,count=1)
    (output/'app.js').write_text(app)
    page=(output/'index.html').read_text().replace('</head>',f'<meta name="push-api" content="{ORIGIN}/api/push"></head>')
    page=re.sub(r'<button\b[^>]*data-action="report"[^>]*>.*?</button>','',page,flags=re.S)
    page=re.sub(r'<script src="reports\.js[^"]*"[^>]*></script>','',page)
    page=page.replace('href="admin.html"','href="'+ORIGIN+'/admin.html" target="_blank" rel="noopener noreferrer"')
    (output/'index.html').write_text(page)
    worker=(output/'sw.js').read_text()
    worker=re.sub(r",?'reports\.js[^']*'",'',worker)
    (output/'sw.js').write_text(worker)
    seed=re.search(r'let schoolArticle = (.*?);\n',(ROOT/'public/app.js').read_text())
    (output/'assets/school-news.json').write_text(json.dumps(json.loads(seed[1]),ensure_ascii=False,indent=2)+'\n')
    if refresh:
        for script,name in [('update-lunch.py','lunch'),('update-school-news.py','school-news')]:
            result=subprocess.run([sys.executable,str(output/'tools'/script),'--output',str(output/'assets'/f'{name}.json')],capture_output=True,text=True)
            if result.returncode:print(f'Public {name} feed unavailable; keeping the dated included snapshot.',file=sys.stderr)
            else:print(result.stdout.strip())
    subprocess.run([sys.executable,str(output/'tools/prepare-pages.py')],check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/security-check.py'),'--export',str(output)],check=True)
    if archive:
        archive.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as zipped:
            for file in sorted(output.rglob('*')):
                if file.is_file() and file.relative_to(output).parts[0]!='_site':
                    zipped.write(file,file.relative_to(output).as_posix())
    print('GitHub Pages source exported:',output)
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--output-dir',type=Path,required=True)
    parser.add_argument('--content',type=Path,required=True)
    parser.add_argument('--zip',type=Path)
    parser.add_argument('--offline',action='store_true',help='Use reviewed included menu/news snapshots without requesting upstream feeds')
    args=parser.parse_args()
    export(args.output_dir,args.content,args.zip,refresh=not args.offline)
