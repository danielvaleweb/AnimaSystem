const fs = require('fs');

const filesToPatch = [
  'src/components/settings/SettingsView.tsx',
  'src/components/clients/ClientModal.tsx',
  'src/components/customization/CustomizationView.tsx'
];

filesToPatch.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace: uploadBytesResumable(storageRef, file);
  // With: uploadBytesResumable(storageRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
  
  content = content.replace(
    /const uploadTask = uploadBytesResumable\(storageRef,\s*file\);/g,
    "const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });"
  );
  
  fs.writeFileSync(file, content);
  console.log(`Patched ${file}`);
});
