const assert = require('node:assert/strict');
const {monthStarts} = require('../engine/vakya_engine');
const expected=['2026-04-14','2026-05-15','2026-06-15','2026-07-17','2026-08-18','2026-09-18','2026-10-18','2026-11-17'];
assert.deepEqual(monthStarts(2026).slice(0,8).map(x=>x.gregorianDate),expected);
for(let y=2025;y<=2050;y++) {
 const a=monthStarts(y); assert.equal(a.length,13);
 for(let i=0;i<12;i++){const days=(Date.parse(a[i+1].gregorianDate)-Date.parse(a[i].gregorianDate))/86400000; assert.ok(days>=29&&days<=32,`${y}: ${days}`);}
 assert.deepEqual(a[12],monthStarts(y+1)[0]);
}
console.log('PASS: 26 yearly sequences, 312 month lengths, adjacent boundaries, 8 previously discussed reference dates');
