"use client";

import { useMemo, useState } from "react";
import { Copy, GitBranch, Plus, Star, Trash2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Notice } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StringListEditor } from "@/components/admin/list-editor";
import { SortableList } from "@/components/admin/sortable";
import { SaveBar, useSections } from "@/components/admin/use-section";
import { newProfile } from "@/lib/domain/defaults";
import type { CampaignConfig, Condition, ConditionGroup, Operator, Profile, Quiz, Rule } from "@/lib/domain/config";
import { cn, uid } from "@/lib/utils";

export function ResultsEditor({ campaignId, config, canEdit }: { campaignId: string; config: CampaignConfig; canEdit: boolean }) {
  const s = useSections(campaignId, { profiles: config.profiles, rules: config.rules });
  const { profiles, rules } = s.value;
  const setProfiles = (p: Profile[]) => s.setValue({ profiles: p, rules });
  const setRules = (r: Rule[]) => s.setValue({ profiles, rules: r });

  return (
    <fieldset disabled={!canEdit}>
      <Tabs defaultValue="profiles">
        <TabsList className="mb-5">
          <TabsTrigger value="profiles"><UserRound /> Perfis e resultados <Badge>{profiles.length}</Badge></TabsTrigger>
          <TabsTrigger value="rules"><GitBranch /> Regras de segmentação <Badge>{rules.length}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="profiles">
          <ProfilesEditor profiles={profiles} rules={rules} onChange={setProfiles} />
        </TabsContent>
        <TabsContent value="rules">
          <RulesEditor rules={rules} profiles={profiles} quiz={config.quiz} onChange={setRules} />
        </TabsContent>
      </Tabs>
      <SaveBar dirty={s.dirty} pending={s.pending} onSave={s.save} disabled={!canEdit} />
    </fieldset>
  );
}

// ---------------------------------------------------------------- Perfis

function ProfilesEditor({ profiles, rules, onChange }: { profiles: Profile[]; rules: Rule[]; onChange: (p: Profile[]) => void }) {
  const [selected, setSelected] = useState(profiles[0]?.id ?? null);
  const current = profiles.find((p) => p.id === selected) ?? null;
  const update = (id: string, patch: Partial<Profile>) => onChange(profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const setDefault = (id: string) => onChange(profiles.map((p) => ({ ...p, isDefault: p.id === id })));

  const add = () => {
    const p = newProfile(`Perfil ${profiles.length + 1}`, profiles.length === 0);
    onChange([...profiles, p]);
    setSelected(p.id);
  };
  const duplicate = (p: Profile) => {
    const copy = { ...structuredClone(p), id: uid("p"), name: `${p.name} (cópia)`, isDefault: false };
    onChange([...profiles, copy]);
    setSelected(copy.id);
  };
  const remove = (p: Profile) => {
    const used = rules.filter((r) => r.profileId === p.id).length;
    if (!confirm(used ? `Este perfil é usado por ${used} regra(s), que ficarão inválidas. Excluir mesmo assim?` : `Excluir o perfil "${p.name}"?`)) return;
    const rest = profiles.filter((x) => x.id !== p.id);
    if (p.isDefault && rest[0]) rest[0] = { ...rest[0], isDefault: true };
    onChange(rest);
    setSelected(rest[0]?.id ?? null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="space-y-1.5">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-[13px] cursor-pointer",
              selected === p.id ? "border-accent ring-2 ring-accent/15" : "hover:bg-muted/40",
            )}
          >
            <span className="flex-1 truncate">{p.name}</span>
            {p.isDefault && <Badge tone="accent">Padrão</Badge>}
          </button>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={add}>
          <Plus /> Novo perfil
        </Button>
        <p className="px-1 text-[11px] text-muted-foreground">Sem limite de perfis. O perfil padrão aparece quando nenhuma regra é atendida.</p>
      </div>
      {current ? (
        <div className="space-y-5 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Resultado: {current.name}</CardTitle>
              <div className="flex gap-1">
                {!current.isDefault && (
                  <Button type="button" size="xs" variant="ghost" onClick={() => setDefault(current.id)}><Star /> Tornar padrão</Button>
                )}
                <Button type="button" size="xs" variant="ghost" onClick={() => duplicate(current)}><Copy /> Duplicar</Button>
                <Button type="button" size="xs" variant="danger-ghost" onClick={() => remove(current)}><Trash2 /> Excluir</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do perfil" hint="Exibido ao visitante como “Seu perfil: …”.">
                  <Input value={current.name} onChange={(e) => update(current.id, { name: e.target.value })} />
                </Field>
                <Field label="Imagem (URL)"><Input value={current.imageUrl} placeholder="https://..." onChange={(e) => update(current.id, { imageUrl: e.target.value })} /></Field>
              </div>
              <Field label="Título"><Input value={current.title} onChange={(e) => update(current.id, { title: e.target.value })} placeholder="Ex.: Você pode começar sem montar um grande estoque." /></Field>
              <Field label="Subtítulo"><Input value={current.subtitle} onChange={(e) => update(current.id, { subtitle: e.target.value })} /></Field>
              <Field label="Descrição"><Textarea rows={4} value={current.description} onChange={(e) => update(current.id, { description: e.target.value })} /></Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pontos identificados</CardTitle></CardHeader>
            <CardContent><StringListEditor value={current.highlights} onChange={(v) => update(current.id, { highlights: v })} placeholder="Ex.: Pouco tempo disponível por dia" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recomendações</CardTitle></CardHeader>
            <CardContent><StringListEditor value={current.recommendations} onChange={(v) => update(current.id, { recommendations: v })} placeholder="Ex.: Comece por encomendas" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Conteúdo e chamada</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Conteúdo personalizado" hint="Texto livre exibido após as recomendações. Linhas em branco separam parágrafos.">
                <Textarea rows={4} value={current.content} onChange={(e) => update(current.id, { content: e.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Texto do botão (CTA)"><Input value={current.ctaLabel} onChange={(e) => update(current.id, { ctaLabel: e.target.value })} /></Field>
                <Field label="Destino do botão">
                  <Select value={current.ctaTarget} onChange={(e) => update(current.id, { ctaTarget: e.target.value as Profile["ctaTarget"] })}>
                    <option value="sales_page">Página de vendas da campanha</option>
                    <option value="checkout">Direto para o checkout</option>
                  </Select>
                </Field>
              </div>
              <Notice>
                Evite afirmar que o resultado é um diagnóstico ou uma previsão de ganhos. Apresente-o como orientação baseada nas respostas.
              </Notice>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState icon={UserRound} title="Nenhum perfil" description="Crie ao menos um perfil e marque-o como padrão." />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Regras

const operatorLabels: Record<Operator, string> = {
  equals: "é igual a",
  not_equals: "é diferente de",
  contains: "contém",
  not_contains: "não contém",
  gt: "é maior que",
  gte: "é maior ou igual a",
  lt: "é menor que",
  lte: "é menor ou igual a",
  answered: "foi respondida",
  not_answered: "não foi respondida",
};

type Ctx = {
  quiz: Quiz;
  attributes: Map<string, Set<string>>;
};

function knownAttributes(quiz: Quiz) {
  const map = new Map<string, Set<string>>();
  const add = (k: string, v?: string) => {
    if (!k) return;
    if (!map.has(k)) map.set(k, new Set());
    if (v) map.get(k)!.add(v);
  };
  for (const q of quiz.questions) {
    add(q.attributeKey);
    for (const o of q.options) {
      if (q.attributeKey) add(q.attributeKey, o.value || o.id);
      for (const [k, v] of Object.entries(o.attributes)) add(k, v);
    }
  }
  return map;
}

function newCondition(ctx: Ctx): Condition {
  const firstAttr = [...ctx.attributes.keys()][0];
  return firstAttr
    ? { kind: "condition", id: uid("c"), source: "attribute", target: firstAttr, operator: "equals", value: [...(ctx.attributes.get(firstAttr) ?? [])][0] ?? "" }
    : { kind: "condition", id: uid("c"), source: "answer", target: ctx.quiz.questions[0]?.id ?? "", operator: "answered", value: "" };
}

function RulesEditor({ rules, profiles, quiz, onChange }: { rules: Rule[]; profiles: Profile[]; quiz: Quiz; onChange: (r: Rule[]) => void }) {
  const ctx: Ctx = useMemo(() => ({ quiz, attributes: knownAttributes(quiz) }), [quiz]);
  const update = (id: string, patch: Partial<Rule>) => onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const defaultProfile = profiles.find((p) => p.isDefault);

  const add = () =>
    onChange([
      ...rules,
      {
        id: uid("r"),
        name: `Regra ${rules.length + 1}`,
        enabled: true,
        profileId: profiles.find((p) => !p.isDefault)?.id ?? profiles[0]?.id ?? "",
        when: { kind: "group", id: uid("g"), combinator: "and", children: [newCondition(ctx)] },
      },
    ]);

  if (!profiles.length) return <EmptyState icon={GitBranch} title="Crie perfis primeiro" description="Cada regra direciona o visitante para um perfil de resultado." />;

  return (
    <div className="space-y-3">
      <Notice>
        As regras são avaliadas <b>de cima para baixo</b>: a primeira regra atendida define o resultado. Arraste para mudar a prioridade.
        {ctx.attributes.size === 0 && " Dica: defina “Atributo registrado” nas perguntas para criar regras por atributo."}
      </Notice>
      <SortableList
        items={rules}
        onReorder={onChange}
        renderItem={(rule, i, handle) => (
          <Card className={cn("mb-3", !rule.enabled && "opacity-60")}>
            <CardHeader className="pb-2">
              <div className="flex flex-1 items-center gap-2">
                {handle}
                <Badge>{i + 1}</Badge>
                <Input value={rule.name} onChange={(e) => update(rule.id, { name: e.target.value })} className="h-8 max-w-xs font-medium" aria-label="Nome da regra" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={rule.enabled} onCheckedChange={(v) => update(rule.id, { enabled: v })} aria-label="Regra ativa" />
                <Button type="button" variant="ghost" size="icon" aria-label="Duplicar regra" onClick={() => onChange([...rules.slice(0, i + 1), reId(rule), ...rules.slice(i + 1)])}>
                  <Copy className="text-muted-foreground" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Excluir regra" onClick={() => confirm("Excluir esta regra?") && onChange(rules.filter((r) => r.id !== rule.id))}>
                  <Trash2 className="text-danger" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Se</p>
              <GroupEditor group={rule.when} ctx={ctx} depth={0} onChange={(g) => update(rule.id, { when: g })} />
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Então exibir o perfil</p>
                <Select value={rule.profileId} onChange={(e) => update(rule.id, { profileId: e.target.value })} className="h-8 w-60">
                  {!profiles.some((p) => p.id === rule.profileId) && <option value={rule.profileId}>⚠ Perfil removido</option>}
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
      />
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus /> Nova regra</Button>
      <Card className="border-dashed">
        <CardContent className="py-3 text-[13px] text-muted-foreground">
          <b className="text-foreground">Senão</b> (nenhuma regra atendida): exibir <b className="text-foreground">{defaultProfile?.name ?? "o primeiro perfil"}</b>.
        </CardContent>
      </Card>
    </div>
  );
}

function reId(rule: Rule): Rule {
  const walk = (g: ConditionGroup): ConditionGroup => ({
    ...g,
    id: uid("g"),
    children: g.children.map((c) => (c.kind === "group" ? walk(c) : { ...c, id: uid("c") })),
  });
  return { ...structuredClone(rule), id: uid("r"), name: `${rule.name} (cópia)`, when: walk(rule.when) };
}

function GroupEditor({ group, ctx, depth, onChange, onRemove }: { group: ConditionGroup; ctx: Ctx; depth: number; onChange: (g: ConditionGroup) => void; onRemove?: () => void }) {
  const setChild = (i: number, child: Condition | ConditionGroup) => onChange({ ...group, children: group.children.map((c, j) => (j === i ? child : c)) });
  const removeChild = (i: number) => onChange({ ...group, children: group.children.filter((_, j) => j !== i) });
  return (
    <div className={cn("space-y-2", depth > 0 && "rounded-md border border-dashed bg-muted/30 p-3")}>
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-md border bg-card p-0.5 text-[11px] font-semibold">
          {(["and", "or"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...group, combinator: c })}
              className={cn("rounded-sm px-2 py-0.5 cursor-pointer", group.combinator === c ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              {c === "and" ? "E (todas)" : "OU (qualquer)"}
            </button>
          ))}
        </div>
        {onRemove && (
          <Button type="button" variant="ghost" size="xs" onClick={onRemove} className="ml-auto"><X /> Remover grupo</Button>
        )}
      </div>
      {group.children.length === 0 && <p className="text-xs text-warning">Grupo sem condições nunca é atendido.</p>}
      {group.children.map((child, i) =>
        child.kind === "group" ? (
          <GroupEditor key={child.id} group={child} ctx={ctx} depth={depth + 1} onChange={(g) => setChild(i, g)} onRemove={() => removeChild(i)} />
        ) : (
          <ConditionRow key={child.id} cond={child} ctx={ctx} onChange={(c) => setChild(i, c)} onRemove={() => removeChild(i)} />
        ),
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="xs" onClick={() => onChange({ ...group, children: [...group.children, newCondition(ctx)] })}>
          <Plus /> Condição
        </Button>
        {depth < 2 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange({ ...group, children: [...group.children, { kind: "group", id: uid("g"), combinator: group.combinator === "and" ? "or" : "and", children: [newCondition(ctx)] }] })}
          >
            <Plus /> Grupo
          </Button>
        )}
      </div>
    </div>
  );
}

function ConditionRow({ cond, ctx, onChange, onRemove }: { cond: Condition; ctx: Ctx; onChange: (c: Condition) => void; onRemove: () => void }) {
  const question = cond.source === "answer" ? ctx.quiz.questions.find((q) => q.id === cond.target) : undefined;
  const isChoice = question && (question.type === "single" || question.type === "multiple" || question.type === "yes_no");
  const isNumeric = cond.source === "score" || question?.type === "number" || question?.type === "range";

  const ops: Operator[] =
    cond.source === "score"
      ? ["equals", "gt", "gte", "lt", "lte"]
      : cond.source === "answer"
        ? isChoice
          ? question.type === "multiple"
            ? ["contains", "not_contains", "answered", "not_answered"]
            : ["equals", "not_equals", "answered", "not_answered"]
          : isNumeric
            ? ["equals", "not_equals", "gt", "gte", "lt", "lte", "answered", "not_answered"]
            : ["equals", "not_equals", "contains", "not_contains", "answered", "not_answered"]
        : ["equals", "not_equals", "contains", "not_contains", "gt", "gte", "lt", "lte", "answered", "not_answered"];

  const set = (patch: Partial<Condition>) => onChange({ ...cond, ...patch });
  const needsValue = cond.operator !== "answered" && cond.operator !== "not_answered";
  const attrValues = cond.source === "attribute" ? [...(ctx.attributes.get(cond.target) ?? [])] : [];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-card">
      <Select
        className="h-8 w-32 text-[13px]"
        value={cond.source}
        onChange={(e) => {
          const source = e.target.value as Condition["source"];
          const target = source === "answer" ? ctx.quiz.questions[0]?.id ?? "" : source === "attribute" ? [...ctx.attributes.keys()][0] ?? "" : "";
          set({ source, target, operator: source === "score" ? "gte" : source === "answer" ? "answered" : "equals", value: "" });
        }}
        aria-label="Origem"
      >
        <option value="attribute">Atributo</option>
        <option value="answer">Resposta</option>
        <option value="score">Pontuação</option>
      </Select>

      {cond.source === "answer" && (
        <Select
          className="h-8 w-56 text-[13px]"
          value={cond.target}
          onChange={(e) => {
            const q = ctx.quiz.questions.find((x) => x.id === e.target.value);
            const choice = q && (q.type === "single" || q.type === "yes_no");
            set({ target: e.target.value, operator: q?.type === "multiple" ? "contains" : choice ? "equals" : "answered", value: q?.options[0]?.id ?? "" });
          }}
          aria-label="Pergunta"
        >
          {!question && <option value={cond.target}>⚠ Pergunta removida</option>}
          {ctx.quiz.questions.map((q, i) => <option key={q.id} value={q.id}>{i + 1}. {q.title.slice(0, 50)}</option>)}
        </Select>
      )}
      {cond.source === "attribute" && (
        <>
          <Input
            list={`attrs-${cond.id}`}
            className="h-8 w-44 font-mono text-xs"
            value={cond.target}
            placeholder="atributo"
            onChange={(e) => set({ target: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
            aria-label="Atributo"
          />
          <datalist id={`attrs-${cond.id}`}>
            {[...ctx.attributes.keys()].map((k) => <option key={k} value={k} />)}
          </datalist>
        </>
      )}

      <Select className="h-8 w-44 text-[13px]" value={ops.includes(cond.operator) ? cond.operator : ops[0]} onChange={(e) => set({ operator: e.target.value as Operator })} aria-label="Operador">
        {ops.map((o) => <option key={o} value={o}>{operatorLabels[o]}</option>)}
      </Select>

      {needsValue &&
        (isChoice ? (
          <Select className="h-8 w-48 text-[13px]" value={cond.value} onChange={(e) => set({ value: e.target.value })} aria-label="Valor">
            {!question.options.some((o) => o.id === cond.value) && <option value={cond.value}>Selecione…</option>}
            {question.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        ) : (
          <>
            <Input
              list={attrValues.length ? `vals-${cond.id}` : undefined}
              className="h-8 w-40 text-[13px]"
              value={cond.value}
              inputMode={isNumeric ? "decimal" : undefined}
              placeholder="valor"
              onChange={(e) => set({ value: e.target.value })}
              aria-label="Valor"
            />
            {attrValues.length > 0 && (
              <datalist id={`vals-${cond.id}`}>
                {attrValues.map((v) => <option key={v} value={v} />)}
              </datalist>
            )}
          </>
        ))}
      <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onRemove} aria-label="Remover condição">
        <X className="text-muted-foreground" />
      </Button>
    </div>
  );
}
