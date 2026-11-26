'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
for(const file of ['test_vakya_engine.js','test_calendar_accuracy.js']){
 const p=spawnSync(process.execPath,[path.join(__dirname,'../tests',file)],{stdio:'inherit'});
 if(p.error||p.status!==0){console.error(p.error||`Failed: ${file}`);process.exit(1);}
}
