import { buildReport } from './src/lib/investigation-service.ts';
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('/tmp/validation.json','utf8'));
const catMap = {'Safe':'safe','Digital Arrest Scam':'digital_arrest','Banking/KYC Scam':'banking_kyc','OTP Scam':'otp','Courier Scam':'courier','Investment Scam':'investment','Lottery Scam':'lottery','Job Scam':'job','UPI Scam':'upi','Phishing Website':'phishing'};
let both=0, catOk=0, bandOk=0;
const fails=[];
for (const row of data){
  const rep = buildReport(String(row.Message));
  const exp = catMap[row['Expected Category']];
  const catHit = rep.categoryId===exp || rep.detectedTypeId===exp;
  const eb = row['Expected Risk']<=20?'safe':(row['Expected Risk']>=71?'scam':'mid');
  const ab = rep.riskScore<=20?'safe':(rep.riskScore>=71?'scam':'mid');
  if (catHit) catOk++;
  if (eb===ab) bandOk++;
  if (catHit && eb===ab) both++;
  else fails.push({id:row['Test ID'],msg:String(row.Message).slice(0,90), exp:row['Expected Category'],exR:row['Expected Risk'], gs:rep.riskScore, gc:rep.scamCategory,cid:rep.categoryId});
}
console.log('Cat',catOk,'Band',bandOk,'Both',both,'/250');
const u={};for(const f of fails){const k=f.msg+'|'+f.exp;if(!u[k])u[k]=f;}
for (const f of Object.values(u)) console.log(JSON.stringify(f));
