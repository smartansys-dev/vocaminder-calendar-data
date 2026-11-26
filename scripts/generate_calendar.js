'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {monthStarts} = require('../engine/vakya_engine');
const ROOT = path.resolve(__dirname, '..');
const DAY = 86400000;
const months = ['சித்திரை|Chithirai','வைகாசி|Vaikasi','ஆனி|Aani','ஆடி|Aadi','ஆவணி|Aavani','புரட்டாசி|Purattasi','ஐப்பசி|Aippasi','கார்த்திகை|Karthigai','மார்கழி|Margazhi','தை|Thai','மாசி|Maasi','பங்குனி|Panguni'].map(s=>s.split('|'));
const years = ['விசுவாவசு|Visuvavasu','பராபவ|Parabhava','பிலவங்க|Pilavanga','கீலக|Keelaka','சௌமிய|Saumya','சாதாரண|Sadharana','விரோதிகிருது|Virodhikrith','பரிதாபி|Paridhabi','பிரமாதீச|Pramadheesa','ஆனந்த|Ananda','ராட்சச|Rakshasa','நள|Nala','பிங்கள|Pingala','காளயுக்தி|Kalayukti','சித்தார்த்தி|Siddharthi','ரௌத்திரி|Raudri','துன்மதி|Dunmathi','துந்துபி|Dundubhi','ருத்ரோத்காரி|Rudhirodgari','ரக்தாட்சி|Raktakshi','குரோதன|Krodhana','அட்சய|Akshaya','பிரபவ|Prabhava','விபவ|Vibhava','சுக்ல|Shukla','பிரமோதூத|Pramodoota'].map(s=>s.split('|'));
const weekdays = ['ஞாயிற்றுக்கிழமை|Sunday','திங்கட்கிழமை|Monday','செவ்வாய்க்கிழமை|Tuesday','புதன்கிழமை|Wednesday','வியாழக்கிழமை|Thursday','வெள்ளிக்கிழமை|Friday','சனிக்கிழமை|Saturday'].map(s=>s.split('|'));
const iso = t=>new Date(t).toISOString().slice(0,10);
function generate(year) {
 if(!Number.isInteger(year)||year<2025||year>2050) throw Error('Experimental supported years: 2025–2050');
 const [name,englishName]=years[year-2025], id=`${year}-${year+1}`;
 const boundaries=monthStarts(year);
 const times=boundaries.map((b,i)=>{const t=Date.parse(b.gregorianDate); if(!Number.isFinite(t)||iso(t)!==b.gregorianDate||b.tamilMonth!==i%12+1) throw Error('Invalid boundary'); return t;});
 if(times.length!==13||boundaries[12].gregorianDate!==monthStarts(year+1)[0].gregorianDate) throw Error('Invalid year boundary');
 return {schemaVersion:2,dataVersion:1,calendarId:'tamil_solar_vakya_chennai',calendar:'Tamil Solar',timezone:'Asia/Kolkata',panchangamSystem:'Traditional Tamil Vakya',location:{name:'Chennai',state:'Tamil Nadu',country:'India',latitude:13.0827,longitude:80.2707},source:'EXPERIMENTAL: VocaMinder Step 3A Vakya engine, upstream Sankalpam Generator fd1f66c; fixed-latitude traditional cutoff; not independently verified',generatedAt:null,tamilYear:{id,name,englishName,startYear:year,endYear:year+1},nextYearStart:iso(times[12]),months:months.map(([tamilName,englishName],i)=>{
 const totalDays=(times[i+1]-times[i])/DAY; if(!Number.isInteger(totalDays)||totalDays<29||totalDays>32) throw Error('Invalid month length');
 return {tamilMonth:i+1,tamilName,englishName,startDate:iso(times[i]),endDate:iso(times[i+1]-DAY),totalDays,days:Array.from({length:totalDays},(_,j)=>{const t=times[i]+j*DAY;const [tamil,english]=weekdays[new Date(t).getUTCDay()];return {gregorianDate:iso(t),tamilDate:{day:j+1,monthNumber:i+1,month:tamilName,monthEnglish:englishName,year:name,yearId:id},dayOfWeek:{tamil,english},panchangam:null,timings:null,specialDays:null,vratham:null,lunarEvents:null};})};})};
}
function main(args){
 let from,to;
 if(args.length===2&&args[0]==='--year') from=to=Number(args[1]);
 else if(args.length===4&&args[0]==='--from'&&args[2]==='--to'){from=Number(args[1]);to=Number(args[3]);}
 else throw Error('Usage: --year 2026 OR --from 2025 --to 2027');
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<2025||to>2050||from>to) throw Error('Invalid year range (2025–2050)');
 const output=path.join(ROOT,'candidates');
 const files=[];for(let y=from;y<=to;y++){const x=generate(y);files.push([`tamil_calendar_${y}_${y+1}.json`,JSON.stringify(x,null,2)+'\n',x.months.reduce((n,m)=>n+m.totalDays,0)]);}
 fs.mkdirSync(output,{recursive:true});
 for(const [name,content,count] of files){const p=path.join(output,name);if(fs.existsSync(p)&&fs.readFileSync(p,'utf8')!==content) throw Error(`Refusing to overwrite changed candidate: ${p}`);}
 for(const [name,content,count] of files){const p=path.join(output,name);if(!fs.existsSync(p))fs.writeFileSync(p,content,{flag:'wx'});console.log(`${name}: ${count} days (candidate)`);}
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={generate};
