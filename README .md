# SalvaPets

Site de adoção e lar temporário de animais, feito com **HTML5, CSS3 e JavaScript puro** (sem frameworks).

🔗 Site: https://SEU-USUARIO.github.io/salvapets/

## Como testar

| Perfil | E-mail | Senha |
|---|---|---|
| Voluntária | mariana@email.com | 12345678 |
| ONG | contato@patasamigas.org.br | 12345678 |

Também é possível criar contas novas nas telas de cadastro.

## Checklist dos critérios

| Critério | Atende? | Por quê |
|---|---|---|
| Deploy e funcionamento | ✅ Sim | Publicado no GitHub Pages. `index.html`, `style.css` e `script.js` ficam na raiz e as fotos estão embutidas no código, então não há arquivos faltando nem pastas expostas. |
| Interatividade sem recarregar | ✅ Sim | Todos os formulários e cliques usam `preventDefault()` e atualizam a tela via JavaScript. Cadastro, edição e exclusão de animais, envio e cancelamento de solicitações, mensagens e perfil funcionam sem recarregar a página. |
| Persistência de dados | ✅ Sim | Dados, contas e sessão ficam no `localStorage` e continuam na tela após F5. |
| Estabilidade do console | ✅ Sim | Telas e ações testadas com o DevTools aberto, sem erros em vermelho. |
| Adaptabilidade e responsividade | ✅ Sim | Layout com Flexbox, Grid e Media Queries, testado em 390 px sem rolagem horizontal. Acessibilidade: `lang="pt-BR"`, `alt` descritivo nas imagens, tags `header`, `nav`, `main`, `aside`, rótulos (`label`) nos campos, `aria-label` nos botões de ícone, erros de formulário com `role="alert"`, tabelas com papéis ARIA, link "Pular para o conteúdo" e foco visível no teclado. |

## Estrutura

```
index.html   estrutura da página
style.css    estilos e responsividade
script.js    rotas, telas, formulários e localStorage
```
