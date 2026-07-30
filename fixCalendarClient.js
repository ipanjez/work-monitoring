const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/calendar/CalendarClient.tsx', 'utf8');

const target = "background: activeFilter === filterValue ? color : 'var(--surface-color)',\n                  color: activeFilter === filterValue ? 'white' : color,\n                  border: `1px solid ${color}`,";
const replacement = "background: activeFilter === filterValue ? bgColor : 'var(--surface-color)',\n                  color: activeFilter === filterValue ? color : bgColor,\n                  border: `1px solid ${bgColor}`,";

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/app/(dashboard)/calendar/CalendarClient.tsx', content);
    console.log('Fixed CalendarClient button colors');
} else {
    console.log('CalendarClient target not found');
}
