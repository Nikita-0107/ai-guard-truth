import { buildReport } from './src/lib/investigation-service.ts';
const msg = "Hi beta, this is uncle. I lost my phone and I'm using a friend's number. I'm stuck at the airport and need ₹35,000 urgently for a medical emergency. Please transfer to this UPI: help@paytm. I'll return it tomorrow morning. Don't call, phone is off.";
console.log(JSON.stringify(buildReport(msg),null,2));
