'use strict';
const assert = require('node:assert/strict');
const {generate} = require('../scripts/generate_calendar');
const {spawnSync} = require('node:child_process');
const crypto = require('node:crypto');
const path = require('node:path');
const ref = require('./reference_dates.json');
const DAY=86400000;
const iso=t=>new Date(t).toISOString().slice(0,10);
const names='Visuvavasu Parabhava Pilavanga Keelaka Saumya Sadharana Virodhikrith Paridhabi Pramadheesa Ananda Rakshasa Nala Pingala Kalayukti Siddharthi Raudri Dunmathi Dundubhi Rudhirodgari Raktakshi Krodhana Akshaya Prabhava Vibhava Shukla Pramodoota'.split(' ');
const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function run(){
 const forward=new Map(), reverse=new Map(); let previous=null, count=0;
 for(let y=2025;y<=2050;y++){
  const a=generate(y); assert.equal(a.tamilYear.englishName,names[y-2025]); assert.equal(a.tamilYear.id,`${y}-${y+1}`); assert.equal(a.months.length,12);
  if(y===ref.year) assert.deepEqual(a.months.slice(0,8).map(m=>m.startDate),ref.monthStarts);
  for(const [i,m] of a.months.entries()){
   assert.equal(m.tamilMonth,i+1); assert.equal(m.days.length,m.totalDays); assert.ok(m.totalDays>=29&&m.totalDays<=32);
   assert.equal(m.startDate,m.days[0].gregorianDate); assert.equal(m.endDate,m.days.at(-1).gregorianDate);
   for(const [j,d] of m.days.entries()){
    const t=Date.parse(d.gregorianDate); assert.equal(iso(t),d.gregorianDate); if(previous!==null) assert.equal(t,previous+DAY); previous=t;
    assert.equal(d.tamilDate.day,j+1); assert.equal(d.tamilDate.monthNumber,i+1); assert.equal(d.tamilDate.yearId,a.tamilYear.id); assert.equal(d.tamilDate.year,a.tamilYear.name); assert.equal(d.dayOfWeek.english,weekdays[new Date(t).getUTCDay()]);
    const key=`${y}/${i+1}/${j+1}`; assert.ok(!forward.has(key)&&!reverse.has(d.gregorianDate)); forward.set(key,d.gregorianDate); reverse.set(d.gregorianDate,key); count++;
   }
  }
  assert.equal(a.nextYearStart,iso(previous+DAY)); assert.deepEqual(generate(y),a);
 }
 for(const [key,date] of forward) assert.equal(reverse.get(date),key);
 for(let y=2026;y<=2050;y++) assert.equal(reverse.has(`${y}-02-29`),y%4===0);
 assert.equal(forward.get('2026/7/30'),'2026-11-16'); assert.equal(forward.get('2026/8/1'),'2026-11-17');
 return count;
}
function digest(){const h=crypto.createHash('sha256');for(let y=2025;y<=2050;y++)h.update(JSON.stringify(generate(y)));return h.digest('hex');}
if(process.argv[2]==='--digest'){console.log(digest());}else{
 const count=run(); const expected=digest();
 for(const TZ of ['Asia/Kolkata','America/Chicago','UTC']){const p=spawnSync(process.execPath,[__filename,'--digest'],{env:{...process.env,TZ},encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.equal(p.stdout.trim(),expected,TZ);}
 console.log(`PASS: 26 years, 312 months, ${count} daily mappings, leap days, year names, 8 regression fixtures, reproducibility and 3 timezones`);
 console.log('NOTE: regression and consistency only; independent astronomical accuracy not established.');
}
