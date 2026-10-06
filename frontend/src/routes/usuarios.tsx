import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus, Power, Shield } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AcoesLinha,
  BarraFiltros,
  CABECALHO_FIXO,
  ConfirmDialog,
  EstadoErro,
  EstadoVazio,
  FiltroSelect,
  Paginacao,
  StatusBadge,
  TABELA_CONTAINER,
  TabelaSkeleton,
  TODOS,
  mensagemAmigavel,
  type AcaoLinha,
} from "@/components/padroes";
import { useAuth } from "@/lib/auth/session";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { permissionsQuery, rolesQuery, usersQuery } from "@/hooks/use-access";
import {
  createUser,
  replaceUserRoles,
  setUserActive,
  updateUser,
  type ApplicationUser,
} from "@/services/users";
import { replaceRolePermissions, type Role } from "@/services/access";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Controle de Afastamentos MCM" }] }),
  component: PaginaUsuarios,
});

function PaginaUsuarios() {
  const { can } = useAuth();
  if (!can("users.read"))
    return (
      <AppLayout titulo="Usuários">
        <EstadoErro mensagem="Você não tem permissão para consultar usuários e papéis." />
      </AppLayout>
    );
  return (
    <AppLayout titulo="Usuários" descricao="Acesso corporativo, papéis e permissões da aplicação.">
      <Tabs defaultValue="usuarios">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="papeis">Papéis</TabsTrigger>
          {can("permissions.manage") ? (
            <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="usuarios">
          <Usuarios />
        </TabsContent>
        <TabsContent value="papeis">
          <Papeis />
        </TabsContent>
        {can("permissions.manage") ? (
          <TabsContent value="permissoes">
            <Permissoes />
          </TabsContent>
        ) : null}
      </Tabs>
    </AppLayout>
  );
}

function Usuarios() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const pagination = useServerPagination();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState(TODOS);
  const [roleId, setRoleId] = useState(TODOS);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<ApplicationUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmar, setConfirmar] = useState<ApplicationUser | null>(null);
  const [papeisDe, setPapeisDe] = useState<ApplicationUser | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const query = useQuery(
    usersQuery({
      page: pagination.pagina,
      perPage: pagination.tamanho,
      search: busca.trim() || undefined,
      ativo: status === TODOS ? undefined : status === "ativos",
      roleId: roleId === TODOS ? undefined : roleId,
    }),
  );
  const roles = useQuery(rolesQuery());
  const users = query.data?.data ?? [];

  function invalidar() {
    pagination.setPagina(1);
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }
  const salvar = useMutation({
    mutationFn: () =>
      editando
        ? updateUser(editando.id, name.trim())
        : createUser({ name: name.trim(), email: email.trim().toLowerCase(), isActive: true }),
    onSuccess: () => {
      invalidar();
      setAberto(false);
      toast.success(
        editando
          ? "Usuário atualizado."
          : "Usuário cadastrado. Atribua os papéis para liberar as ações.",
      );
    },
    onError: (error) => toast.error(mensagemAmigavel(error)),
  });
  const alternar = useMutation({
    mutationFn: (item: ApplicationUser) => setUserActive(item.id, !item.isActive),
    onSuccess: () => {
      invalidar();
      setConfirmar(null);
      toast.success("Acesso do usuário atualizado.");
    },
    onError: (error) => toast.error(mensagemAmigavel(error)),
  });
  const atribuir = useMutation({
    mutationFn: () => replaceUserRoles(papeisDe!.id, selecionados),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setPapeisDe(null);
      toast.success("Papéis do usuário atualizados.");
    },
    onError: (error) => toast.error(mensagemAmigavel(error)),
  });
  function abrir(item?: ApplicationUser) {
    salvar.reset();
    setEditando(item ?? null);
    setName(item?.name ?? "");
    setEmail(item?.email ?? "");
    setAberto(true);
  }
  const acoesDe = (item: ApplicationUser): AcaoLinha[] => [
    ...(can("users.manage")
      ? [
          { rotulo: "Editar", icone: Pencil, aoClicar: () => abrir(item) },
          {
            rotulo: item.isActive ? "Inativar" : "Reativar",
            icone: Power,
            destrutiva: item.isActive,
            aoClicar: () => setConfirmar(item),
          },
        ]
      : []),
    ...(can("permissions.manage")
      ? [
          {
            rotulo: "Papéis",
            icone: Shield,
            aoClicar: () => {
              atribuir.reset();
              setPapeisDe(item);
              setSelecionados(item.roles.map((link) => link.role.id));
            },
          },
        ]
      : []),
  ];
  const papeisDisponiveis = roles.data ?? [];
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Usuários locais</h2>
        {can("users.manage") ? (
          <Button onClick={() => abrir()}>
            <Plus className="size-4" /> Novo usuário
          </Button>
        ) : null}
      </div>
      <BarraFiltros
        busca={busca}
        aoBuscar={(value) => {
          setBusca(value);
          pagination.setPagina(1);
        }}
        placeholderBusca="Nome ou e-mail"
        filtrosAtivos={Number(status !== TODOS) + Number(roleId !== TODOS)}
        aoLimpar={() => {
          setBusca("");
          setStatus(TODOS);
          setRoleId(TODOS);
          pagination.setPagina(1);
        }}
        colunas="lg:grid-cols-2"
      >
        <FiltroSelect
          id="usuario-status"
          rotulo="Status"
          valor={status}
          aoMudar={(value) => {
            setStatus(value);
            pagination.setPagina(1);
          }}
          itens={[
            { id: "ativos", nome: "Ativos" },
            { id: "inativos", nome: "Inativos" },
          ]}
          rotuloTodos="Todos"
        />
        <FiltroSelect
          id="usuario-papel"
          rotulo="Papel"
          valor={roleId}
          aoMudar={(value) => {
            setRoleId(value);
            pagination.setPagina(1);
          }}
          itens={papeisDisponiveis.map((role) => ({ id: role.id, nome: role.name }))}
          rotuloTodos="Todos"
        />
      </BarraFiltros>
      {roles.isError ? (
        <EstadoErro
          mensagem={mensagemAmigavel(roles.error)}
          aoTentarNovamente={() => roles.refetch()}
        />
      ) : null}
      {query.isFetching && !query.isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Atualizando…
        </p>
      ) : null}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        {query.isLoading ? (
          <TabelaSkeleton />
        ) : query.isError ? (
          <EstadoErro
            className="m-4"
            mensagem={mensagemAmigavel(query.error)}
            aoTentarNovamente={() => query.refetch()}
          />
        ) : !users.length ? (
          <EstadoVazio
            className="m-4"
            titulo="Nenhum usuário encontrado."
            descricao="Ajuste os filtros ou cadastre um usuário com e-mail corporativo elegível."
          />
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {users.map((item) => (
                <li key={item.id} className="flex items-start gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                    <p className="my-2 text-xs text-muted-foreground">
                      {item.roles.map((r) => r.role.name).join(", ") || "Sem papel"}
                    </p>
                    <StatusBadge ativo={item.isActive} />
                  </div>
                  <AcoesLinha acoes={acoesDe(item)} compacto />
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <Table containerClassName={TABELA_CONTAINER}>
                <TableHeader className={CABECALHO_FIXO}>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail corporativo</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        {item.roles.map((r) => r.role.name).join(", ") || "Sem papel"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge ativo={item.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
                        <AcoesLinha acoes={acoesDe(item)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Paginacao
              {...pagination}
              total={query.data!.meta.total}
              totalPaginas={query.data!.meta.totalPages}
            />
          </>
        )}
      </div>
      <Dialog
        open={aberto}
        onOpenChange={(value) => {
          if (!salvar.isPending) setAberto(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>
              O acesso usa a conta Microsoft corporativa. O cadastro local não cria uma conta
              Microsoft.
            </DialogDescription>
          </DialogHeader>
          {salvar.isError ? <EstadoErro mensagem={mensagemAmigavel(salvar.error)} /> : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (
                name.trim().length < 2 ||
                (!editando && !/^[^\s@]+@(mcm\.eng\.br|mcmmontagens\.com\.br)$/i.test(email.trim()))
              ) {
                toast.error(
                  "Informe o nome e um e-mail corporativo dos domínios mcm.eng.br ou mcmmontagens.com.br.",
                );
                return;
              }
              if (!salvar.isPending) salvar.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="usuario-nome">Nome *</Label>
              <Input
                id="usuario-nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={200}
                disabled={salvar.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usuario-email">E-mail corporativo *</Label>
              <Input
                id="usuario-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={320}
                disabled={Boolean(editando) || salvar.isPending}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={salvar.isPending}
                onClick={() => setAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        aberto={Boolean(confirmar)}
        aoMudar={(open) => {
          if (!open && !alternar.isPending) setConfirmar(null);
        }}
        titulo={confirmar?.isActive ? "Inativar usuário?" : "Reativar usuário?"}
        descricao={
          confirmar?.isActive
            ? `${confirmar.name} perderá o acesso à aplicação e suas sessões atuais serão encerradas.`
            : `${confirmar?.name ?? ""} poderá entrar com a conta Microsoft e os papéis atribuídos.`
        }
        rotuloConfirmar={confirmar?.isActive ? "Inativar" : "Reativar"}
        destrutivo={Boolean(confirmar?.isActive)}
        carregando={alternar.isPending}
        aoConfirmar={() => {
          if (confirmar) alternar.mutate(confirmar);
        }}
      />
      <Dialog
        open={Boolean(papeisDe)}
        onOpenChange={(open) => {
          if (!open && !atribuir.isPending) setPapeisDe(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Papéis — {papeisDe?.name}</DialogTitle>
            <DialogDescription>
              Selecione os papéis que definem o acesso deste usuário.
            </DialogDescription>
          </DialogHeader>
          {atribuir.isError ? <EstadoErro mensagem={mensagemAmigavel(atribuir.error)} /> : null}
          {roles.isLoading ? (
            <TabelaSkeleton linhas={3} />
          ) : roles.isError ? (
            <EstadoErro
              mensagem={mensagemAmigavel(roles.error)}
              aoTentarNovamente={() => roles.refetch()}
            />
          ) : !papeisDisponiveis.length ? (
            <EstadoVazio titulo="Nenhum papel disponível." />
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {papeisDisponiveis.map((role) => (
                <label
                  key={role.id}
                  className="flex items-start gap-3 rounded-md border border-border p-3"
                >
                  <Checkbox
                    checked={selecionados.includes(role.id)}
                    disabled={
                      atribuir.isPending || (!role.isActive && !selecionados.includes(role.id))
                    }
                    onCheckedChange={(checked) =>
                      setSelecionados((current) =>
                        checked ? [...current, role.id] : current.filter((id) => id !== role.id),
                      )
                    }
                  />
                  <span className="text-sm">
                    <span className="font-medium">
                      {role.name}
                      {!role.isActive ? " (inativo; remova para salvar)" : ""}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {role.description ?? role.code}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={atribuir.isPending}
              onClick={() => setPapeisDe(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={
                atribuir.isPending ||
                roles.isLoading ||
                roles.isError ||
                selecionados.some((id) => !papeisDisponiveis.find((r) => r.id === id)?.isActive)
              }
              onClick={() => atribuir.mutate()}
            >
              {atribuir.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {atribuir.isPending ? "Salvando…" : "Salvar papéis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Papeis() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery(rolesQuery());
  const permissions = useQuery({ ...permissionsQuery(), enabled: can("permissions.manage") });
  const [editando, setEditando] = useState<Role | null>(null);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const salvar = useMutation({
    mutationFn: () => replaceRolePermissions(editando!.id, selecionadas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setEditando(null);
      toast.success("Permissões do papel atualizadas.");
    },
    onError: (error) => toast.error(mensagemAmigavel(error)),
  });
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
      {query.isLoading ? (
        <TabelaSkeleton />
      ) : query.isError ? (
        <EstadoErro
          className="m-4"
          mensagem={mensagemAmigavel(query.error)}
          aoTentarNovamente={() => query.refetch()}
        />
      ) : !query.data?.length ? (
        <EstadoVazio className="m-4" titulo="Nenhum papel cadastrado." />
      ) : (
        <ul className="divide-y divide-border">
          {query.data.map((role) => (
            <li key={role.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {role.name}{" "}
                    <span className="font-mono text-xs text-muted-foreground">{role.code}</span>
                  </p>
                  {role.description ? (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge ativo={role.isActive} />
                  {can("permissions.manage") ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        salvar.reset();
                        setEditando(role);
                        setSelecionadas(role.permissions.map((link) => link.permission.id));
                      }}
                    >
                      <Pencil className="size-4" /> Permissões
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground break-words">
                {role.permissions.map((link) => link.permission.code).join(", ") ||
                  "Sem permissões atribuídas"}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={Boolean(editando)}
        onOpenChange={(open) => {
          if (!open && !salvar.isPending) setEditando(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Permissões — {editando?.name}</DialogTitle>
            <DialogDescription>
              Estas alterações afetam todos os usuários que possuem este papel.
            </DialogDescription>
          </DialogHeader>
          {salvar.isError ? <EstadoErro mensagem={mensagemAmigavel(salvar.error)} /> : null}
          {permissions.isLoading ? (
            <TabelaSkeleton linhas={3} />
          ) : permissions.isError ? (
            <EstadoErro
              mensagem={mensagemAmigavel(permissions.error)}
              aoTentarNovamente={() => permissions.refetch()}
            />
          ) : !permissions.data?.length ? (
            <EstadoVazio titulo="Nenhuma permissão disponível." />
          ) : (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {permissions.data.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-start gap-3 rounded-md border border-border p-3"
                >
                  <Checkbox
                    checked={selecionadas.includes(permission.id)}
                    disabled={salvar.isPending}
                    onCheckedChange={(checked) =>
                      setSelecionadas((current) =>
                        checked
                          ? [...current, permission.id]
                          : current.filter((id) => id !== permission.id),
                      )
                    }
                  />
                  <span className="text-sm">
                    <span className="font-mono">{permission.code}</span>
                    {permission.description ? (
                      <span className="block text-xs text-muted-foreground">
                        {permission.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={salvar.isPending} onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button
              disabled={salvar.isPending || permissions.isLoading || permissions.isError}
              onClick={() => salvar.mutate()}
            >
              {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {salvar.isPending ? "Salvando…" : "Salvar permissões"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Permissoes() {
  const query = useQuery(permissionsQuery());
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
      {query.isLoading ? (
        <TabelaSkeleton />
      ) : query.isError ? (
        <EstadoErro
          className="m-4"
          mensagem={mensagemAmigavel(query.error)}
          aoTentarNovamente={() => query.refetch()}
        />
      ) : !query.data?.length ? (
        <EstadoVazio className="m-4" titulo="Nenhuma permissão disponível." />
      ) : (
        <ul className="divide-y divide-border">
          {query.data.map((permission) => (
            <li key={permission.id} className="p-4">
              <p className="font-mono text-sm">{permission.code}</p>
              <p className="text-sm text-muted-foreground">
                {permission.description ?? "Sem descrição"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
