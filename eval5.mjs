import { buildReport } from './src/lib/investigation-service.ts';
const r=buildReport("Your train ticket has been confirmed.");
console.log(JSON.stringify(r,null,2));
