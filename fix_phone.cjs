const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientDetailView.tsx', 'utf8');
content = content.replace(
  "import { MoreVertical, Edit2, Trash2, Globe, FileText, ChevronRight, Rocket, Hand, Power, Code, Clock } from 'lucide-react';",
  "import { MoreVertical, Edit2, Trash2, Globe, FileText, ChevronRight, Rocket, Hand, Power, Code, Clock, Phone } from 'lucide-react';"
);

fs.writeFileSync('src/components/clients/ClientDetailView.tsx', content);
