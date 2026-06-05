const fs = require('fs');

let code = fs.readFileSync('src/components/VenteForm.jsx', 'utf8');

// Update imports
code = code.replace(
  /import { Printer } from 'lucide-react';/,
  "import { Printer, PlusCircle } from 'lucide-react';"
);

// Update "+ Article" button
code = code.replace(
  /<button type="button" onClick=\{\(\) => setLignes\(\[\.\.\.lignes, \{ articleId: '', quantite: 1, remise: 0 \}\]\)\} className="w-full border border-dashed border-slate-600 text-slate-400 py-2 text-sm font-semibold rounded-xl">\+ Article<\/button>/,
  `<button type="button" onClick={() => setLignes([...lignes, { articleId: '', quantite: 1, remise: 0 }])} className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 py-2 text-sm font-semibold rounded-xl transition-all">
          <PlusCircle size={20} /> Nouvelle Vente
        </button>`
);

// Update "Valider la vente" button
code = code.replace(
  /<button type="submit" disabled=\{createVenteMutation\.isLoading\} className="w-full bg-indigo-600 text-white font-bold py-3\.5 rounded-xl shadow-lg shadow-indigo-500\/20">\s*\{createVenteMutation\.isLoading \? 'Enregistrement\.\.\.' : 'Valider la vente'\}\s*<\/button>/,
  `<button type="submit" disabled={createVenteMutation.isLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
          {createVenteMutation.isLoading ? 'Enregistrement...' : (
            <>
              <Printer size={20} /> Valider la vente
            </>
          )}
        </button>`
);

fs.writeFileSync('src/components/VenteForm.jsx', code);
console.log('VenteForm.jsx updated successfully.');
