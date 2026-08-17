const fs = require('fs');

let content = fs.readFileSync('src/components/clients/ClientModal.tsx', 'utf8');

// Remove required from name
content = content.replace(
  '                  <input \n                    required\n                    name="name"',
  '                  <input \n                    name="name"'
);

// Remove required from responsible
content = content.replace(
  '                  <input \n                    required\n                    name="responsible"',
  '                  <input \n                    name="responsible"'
);

// Update handleSubmit to do the validation
const newHandleSubmit = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Por favor, preencha o Nome da Empresa.");
      return;
    }
    if (!formData.responsible) {
      alert("Por favor, preencha o Nome do Responsável.");
      return;
    }`;

content = content.replace(
  `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;`,
  newHandleSubmit
);

fs.writeFileSync('src/components/clients/ClientModal.tsx', content);
