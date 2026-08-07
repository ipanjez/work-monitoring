"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAgendaText = parseAgendaText;
var INDONESIAN_MONTHS = {
    'januari': 'January', 'februari': 'February', 'maret': 'March', 'april': 'April',
    'mei': 'May', 'juni': 'June', 'juli': 'July', 'agustus': 'August',
    'september': 'September', 'oktober': 'October', 'november': 'November', 'desember': 'December'
};
function parseDateIndonesian(text) {
    var dateMatch = text.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
    if (dateMatch) {
        var _ = dateMatch[0], day = dateMatch[1], monthId = dateMatch[2], year = dateMatch[3];
        var monthEn = INDONESIAN_MONTHS[monthId.toLowerCase()] || monthId;
        var dateObj = new Date("".concat(day, " ").concat(monthEn, " ").concat(year));
        if (!isNaN(dateObj.getTime()))
            return dateObj;
    }
    return null;
}
function extractTimes(line) {
    // Matches HH:MM or HH.MM
    var matches = __spreadArray([], line.matchAll(/(\d{1,2})[:.](\d{2})/g), true);
    if (matches.length > 0) {
        var startH = matches[0][1].padStart(2, '0');
        var startM = matches[0][2];
        var start = "".concat(startH, ":").concat(startM);
        var end = null;
        if (matches.length > 1) {
            var separator = line.substring(matches[0].index + matches[0][0].length, matches[1].index).trim();
            // If the separator is likely a range indicator
            if (/^(-|s\/d|sampai|s\.d|to|s\.d\.)$/i.test(separator)) {
                var endH = matches[1][1].padStart(2, '0');
                var endM = matches[1][2];
                end = "".concat(endH, ":").concat(endM);
            }
        }
        return { start: start, end: end };
    }
    return { start: '', end: null };
}
function parseAgendaText(rawText) {
    // Pre-process rawText to handle single-line PDF pastes by inserting newlines before key fields
    var processedText = rawText.replace(/(Hari\/Tanggal|Waktu|Tempat|Agenda)\s*:/gi, '\n$1 :');
    var lines = processedText.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; });
    var globalDate = new Date(); // Fallback to today
    // Try to find a global date in the first few lines
    for (var i = 0; i < Math.min(5, lines.length); i++) {
        var parsed = parseDateIndonesian(lines[i]);
        if (parsed) {
            globalDate = parsed;
            break;
        }
    }
    var tasks = [];
    var currentTask = {
        nama: 'Pekerjaan Baru',
        pic: '',
        startDate: globalDate,
        endDate: globalDate,
        startTime: '08:00',
        endTime: '17:00',
        deskripsi: '',
        lokasi: ''
    };
    var currentDescription = [];
    var isFirstTaskNameFound = false;
    var saveCurrentTask = function () {
        if (currentTask && (isFirstTaskNameFound || currentDescription.length > 0)) {
            currentTask.deskripsi = currentDescription.join('\n').trim();
            tasks.push(currentTask);
        }
    };
    var isNewTaskLine = function (line) {
        return /^\d+[\.\)]\s/.test(line) || line.startsWith('🗒️') || /^agenda\s*:/i.test(line);
    };
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var lowerLine = line.toLowerCase();
        // Check if line looks like the start of a new task
        if (isNewTaskLine(line)) {
            var name_1 = line.replace(/^\d+[\.\)]\s/, '').replace(/^[•\-\*]\s/, '').trim();
            if (line.startsWith('🗒️')) {
                name_1 = line.replace(/^🗒️\s*[:\-]?\s*/, '').trim();
            }
            else if (/^agenda\s*:/i.test(line)) {
                name_1 = line.replace(/^agenda\s*[:\-]?\s*/i, '').trim();
            }
            if (!isFirstTaskNameFound) {
                currentTask.nama = name_1;
                isFirstTaskNameFound = true;
            }
            else {
                saveCurrentTask();
                currentTask = {
                    nama: name_1,
                    pic: '',
                    startDate: globalDate,
                    endDate: globalDate,
                    startTime: '08:00',
                    endTime: '17:00',
                    deskripsi: '',
                    lokasi: ''
                };
                currentDescription = [];
            }
            continue;
        }
        // Date parsing
        var parsedDate = parseDateIndonesian(line);
        if (parsedDate) {
            currentTask.startDate = parsedDate;
            currentTask.endDate = parsedDate;
            globalDate = parsedDate; // update fallback for subsequent tasks
            currentDescription.push(line);
            continue;
        }
        // Time parsing
        if (lowerLine.includes('⏰') || lowerLine.includes('waktu') || lowerLine.includes('jam') || lowerLine.includes('pukul')) {
            var _a = extractTimes(line), start = _a.start, end = _a.end;
            if (start) {
                currentTask.startTime = start;
                if (end) {
                    currentTask.endTime = end;
                }
                else {
                    var _b = start.split(':').map(Number), h = _b[0], m = _b[1];
                    var endH = Math.min(23, h + 2).toString().padStart(2, '0');
                    currentTask.endTime = "".concat(endH, ":").concat(m.toString().padStart(2, '0'));
                }
            }
            currentDescription.push(line); // Also keep in description for context
        }
        // Location parsing
        else if (lowerLine.includes('🏩') || lowerLine.includes('📍') || lowerLine.includes('🏢') || /tempat\s*:/i.test(line) || /lokasi\s*:/i.test(line) || /ruang\s*:/i.test(line) || /link\s*:/i.test(line)) {
            var cleanLoc = line.replace(/^[🏩📍🏢\s]+[:\-]?\s*/, '').replace(/^(tempat|lokasi|ruang|link)\s*[:\-]?\s*/i, '').trim();
            if (cleanLoc) {
                var locLower = cleanLoc.toLowerCase();
                if (locLower.startsWith('http://') || locLower.startsWith('https://') || locLower.includes('zoom.us') || locLower.includes('meet.google.com') || locLower.includes('teams.live.com') || locLower.includes('teams.microsoft') || locLower.startsWith('online:')) {
                    var cleanLink = cleanLoc.replace(/^online:\s*/i, '').trim();
                    currentTask.lokasi = JSON.stringify({ tipe: 'online', linkZoom: cleanLink, lokasiFisik: '', jam: '' });
                }
                else {
                    var cleanPhys = cleanLoc.replace(/^offline:\s*/i, '').trim();
                    currentTask.lokasi = JSON.stringify({ tipe: 'offline', linkZoom: '', lokasiFisik: cleanPhys, jam: '' });
                }
            }
            currentDescription.push(line);
        }
        // Misc Description parsing
        else {
            currentDescription.push(line);
        }
    }
    // Save the last one
    saveCurrentTask();
    return tasks;
}
