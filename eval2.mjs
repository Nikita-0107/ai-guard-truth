import { analyzeText } from './src/lib/investigation-service.ts';
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('/tmp/validation.json','utf8'));
console.log('rows',data.length);
const t0=Date.now();
for (let i=0;i<data.length;i++){
  const t=Date.now();
  const rep=await analyzeText(String(data[i].Message));
  const dt=Date.now()-t;
  if(dt>200) console.log('SLOW',i,dt,String(data[i].Message).slice(0,60));
}
console.log('total',Date.now()-t0);
