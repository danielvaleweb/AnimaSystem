import fs from 'fs';
const content = fs.readFileSync('src/components/monitor/MonitorView.tsx', 'utf8');

const dropdownMatch = content.match(/\{\/\* Custom Client Selector.*?<\/AnimatePresence>/s);
if (dropdownMatch) {
  console.log("Dropdown Matched");
} else {
  console.log("Dropdown NOT matched");
}

const customTimeMatch = content.match(/\{\/\* Custom Time Range Selector.*?<\/AnimatePresence>\n\s*<\/div>/s);
if (customTimeMatch) {
  console.log("Time Selector matched");
} else {
  console.log("Time Selector NOT matched");
}

