import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';

function load() { return JSON.parse(readFileSync('leads-qualificados.json', 'utf8')); }
function save(d) { writeFileSync('leads-qualificados.json', JSON.stringify(d, null, 2)); }

const leads = load();
console.log('test');
save(leads);
console.log('done');
