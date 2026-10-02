# Pelucinha Acessórios — GitHub Pages

Site estático + Supabase para catálogo e painel administrativo.

## O que já existe

- Home responsiva
- Catálogo dinâmico
- Categorias dinâmicas
- Página de produto
- Carrinho local
- Redirecionamento de pedido para WhatsApp
- `/admin` com login
- CRUD de produtos
- CRUD de categorias
- Supabase/PostgreSQL
- RLS
- Workflow de GitHub Pages

## Configuração

1. Crie um projeto em https://supabase.com/
2. Abra o SQL Editor do Supabase.
3. Execute `schema.sql`.
4. Crie um usuário em Authentication > Users.
5. Copie o UUID desse usuário.
6. Execute:
   `insert into public.admin_users (user_id) values ('SEU_UUID');`
7. Crie um bucket público chamado `product-images`.
8. Abra `js/config.js`.
9. Coloque a URL do projeto e a chave anon/publishable.
10. Faça upload do projeto para o GitHub.
11. Ative GitHub Pages usando GitHub Actions.

## Importante

Nunca coloque a `service_role key` no `config.js`.

A chave pública/anon é própria para uso no frontend, desde que as políticas RLS estejam configuradas corretamente.

## WhatsApp

No `js/app.js`, configure:

`window.STORE_WHATSAPP = "5513999999999";`

Use o número no formato internacional, somente números.

## Imagens

O painel permite selecionar várias imagens no formulário do produto. Elas são enviadas para o bucket `product-images` do Supabase e vinculadas automaticamente ao produto.

A exclusão individual/reordenação avançada de imagens pode ser refinada depois; a estrutura do banco já suporta isso.

## GitHub Pages

O arquivo `.github/workflows/pages.yml` publica automaticamente o conteúdo do repositório.

Como o site é estático, não há servidor Node necessário para hospedá-lo no GitHub Pages.
