const text = '[Done] Proses Penyusunan | PIC: Farhan Jezando | Tenggat: 2026-08-15';
const picMatch = text.match(/\|\s*PIC:\s*([^|]+)/i);
const tenggatMatch = text.match(/\|\s*Tenggat:\s*([^|]+)/i);
console.log('picMatch:', picMatch ? picMatch[1] : null);
console.log('tenggatMatch:', tenggatMatch ? tenggatMatch[1] : null);
