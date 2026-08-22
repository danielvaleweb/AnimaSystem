import fs from 'fs';
let content = fs.readFileSync('src/components/plans/CheckoutView.tsx', 'utf8');

content = content.replace(
  `                      </div>
                  {/* Faixa Inferior com Instruções e Botão de Acesso */}`,
  `                      </div>
                    )}
                  </div>

                  {/* Faixa Inferior com Instruções e Botão de Acesso */}`
);

fs.writeFileSync('src/components/plans/CheckoutView.tsx', content);
