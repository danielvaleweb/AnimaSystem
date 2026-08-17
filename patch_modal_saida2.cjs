const fs = require('fs');

let content = fs.readFileSync('src/components/finance/FinanceView.tsx', 'utf8');

content = content.replace(
  /const handleAddTransaction = async \(e: FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*if \(\!auth\.currentUser\) return;\n\s*try \{\n\s*if \(editingId\) \{\n\s*await updateDoc\(doc\(db, 'transactions', editingId\), \{\n\s*\.\.\.formData,\n\s*amount: Number\(formData\.amount\),\n\s*\}\);/,
  `const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    const dataToSave = {
      ...formData,
      amount: Number(formData.amount),
      ...(formData.type === 'saida' ? { status: 'paid', method: 'manual', gateway: 'manual' } : {})
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'transactions', editingId), dataToSave);`
);

content = content.replace(
  /\} else \{\n\s*await addDoc\(collection\(db, 'transactions'\), \{\n\s*\.\.\.formData,\n\s*ownerId: auth\.currentUser\.uid,\n\s*amount: Number\(formData\.amount\),\n\s*createdAt: serverTimestamp\(\),\n\s*\}\);/,
  `} else {
        await addDoc(collection(db, 'transactions'), {
          ...dataToSave,
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });`
);

fs.writeFileSync('src/components/finance/FinanceView.tsx', content);
console.log("FinanceView Patched successfully!");
