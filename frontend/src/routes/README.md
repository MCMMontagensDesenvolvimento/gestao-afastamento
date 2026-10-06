# Rotas da SPA

TanStack Router usa arquivos `.tsx` neste diretório. O plugin do Vite gera
`src/routeTree.gen.ts`; não edite esse arquivo manualmente.

`__root.tsx` contém providers, proteção de sessão/capacidades, fallback e Outlet.
`login.tsx` é pública. As URLs de afastamentos, colaboradores, dashboard e
configurações foram preservadas; `usuarios.tsx` administra acessos.

O servidor estático precisa encaminhar rotas de interface para `index.html`.
Endpoints `/api/v1` são atendidos exclusivamente pelo backend.
