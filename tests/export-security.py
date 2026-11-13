from pathlib import Path
import importlib.util,tempfile
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('security_check',root/'tools/security-check.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
with tempfile.TemporaryDirectory() as tmp:
 base=Path(tmp);safe=base/'README.md';safe.write_text('Veřejný zdrojový kód.')
 example=base/'.env.example';example.write_text('ADMIN_BOOTSTRAP_VERIFIER=\n')
 assert mod.inspect([safe,example],base)==[]
 for name in ['.env','.env.local','.dev.vars','secret.key','database.sqlite','server/.wrangler/data.json']:
  p=base/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('fixture')
  assert mod.inspect([p],base),name
 p=base/'config.json';p.write_text('pbkdf2'+'$100000$'+'a'*32+'$'+'b'*64)
 assert mod.inspect([p],base),'Concrete password verifier must be rejected'
 example.write_text('ADMIN_BOOTSTRAP_VERIFIER=not-empty\n');assert mod.inspect([example],base)
print('Security export guard rejects nested environment files, database copies, private keys and concrete password verifiers; blank examples allowed.')
