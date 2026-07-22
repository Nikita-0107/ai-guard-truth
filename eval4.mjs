import { buildReport } from './src/lib/investigation-service.ts';
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('/tmp/validation.json','utf8'));
const catMap = {'Safe':'safe','Digital Arrest Scam':'digital_arrest','Banking/KYC Scam':'banking_kyc','OTP Scam':'otp','Courier Scam':'courier','Investment Scam':'investment','Lottery Scam':'lottery','Job Scam':'job','UPI Scam':'upi','Phishing Website':'phishing'};
const msgs={};
for (const row of data){
  const rep = buildReport(String(row.Message));
  const exp = catMap[row['Expected Category']];
  const catHit = rep.categoryId===exp || rep.detectedTypeId===exp;
  const eb = row['Expected Risk']<=20?'safe':(row['Expected Risk']>=71?'scam':'mid');
  const ab = rep.riskScore<=20?'safe':(rep.riskScore>=71?'scam':'mid');
  const ok = catHit && eb===ab;
  const key=String(row.Message);
  if(!msgs[key]) msgs[key]={ok:0,fail:0,exp:row['Expected Category'],exR:row['Expected Risk'],gs:rep.riskScore,gc:rep.scamCategory};
  if(ok) msgs[key].ok++; else msgs[key].fail++;
}
for (const [m,v] of Object.entries(msgs)) if (v.fail) console.log(v.fail+'/'+ (v.ok+v.fail), JSON.stringify({m:m.slice(0,120),...v}));
