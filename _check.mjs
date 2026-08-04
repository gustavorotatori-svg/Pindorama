import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const l = require('./leads-qualificados.json');
['Pullman','The World','Taco'].forEach(s => {
  const f = l.filter(x => x.name.includes(s));
  f.forEach(x => console.log('Found: "' + x.name + '" email2=' + x.email2 + ' email1=' + x.email1));
});
