import { Filter } from 'bad-words';

const f = new Filter();
console.log('Total bad words:', f.list.length);
console.log('---');
f.list.forEach((w, i) => console.log(`${i + 1}. ${w}`));