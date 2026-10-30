"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Monitor, Plus, Settings2, Smartphone, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SwitchRow } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { SortableList } from "@/components/admin/sortable";
import { questionTypeMeta } from "@/components/admin/question-types";
import { SaveBar, useSection } from "@/components/admin/use-section";
import { createPreviewDriver } from "@/components/admin/preview-driver";
import { QuizRunner } from "@/components/public/quiz-runner";
import { changeQuestionType, newOption, newQuestion } from "@/lib/domain/defaults";
import { questionTypes, type CampaignConfig, type Question, type QuestionType, type Quiz, type QuizOption } from "@/lib/domain/config";
import { toPublicCampaign } from "@/lib/domain/public";
import { cn, uid } from "@/lib/utils";

type Selection = "intro" | string;

export function QuizBuilder({ campaignId, slug, config, canEdit }: { campaignId: string; slug: string; config: CampaignConfig; canEdit: boolean }) {
  const s = useSection(campaignId, "quiz", config.quiz);
  const quiz = s.value;
  const [selected, setSelected] = useState<Selection>(quiz.questions[0]?.id ?? "intro");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const setQuiz = (q: Quiz) => s.setValue(q);
  const setQuestions = (questions: Question[]) => setQuiz({ ...quiz, questions });
  const updateQuestion = (id: string, patch: Partial<Question> | ((q: Question) => Question)) =>
    setQuestions(quiz.questions.map((q) => (q.id === id ? (typeof patch === "function" ? patch(q) : { ...q, ...patch }) : q)));

  const add = (type: QuestionType) => {
    const q = newQuestion(type);
    const idx = quiz.questions.findIndex((x) => x.id === selected);
    const list = [...quiz.questions];
    list.splice(idx >= 0 ? idx + 1 : list.length, 0, q);
    setQuestions(list);
    setSelected(q.id);
  };
  const duplicate = (q: Question) => {
    const copy: Question = {
      ...structuredClone(q),
      id: uid("q"),
      title: `${q.title} (cópia)`,
      options: q.options.map((o) => ({ ...o, id: q.type === "yes_no" ? o.id : uid("o") })),
    };
    const idx = quiz.questions.findIndex((x) => x.id === q.id);
    const list = [...quiz.questions];
    list.splice(idx + 1, 0, copy);
    setQuestions(list);
    setSelected(copy.id);
  };
  const remove = (q: Question) => {
    if (!confirm(`Excluir a pergunta "${q.title}"? Regras que usam esta pergunta deixarão de ser atendidas.`)) return;
    const idx = quiz.questions.findIndex((x) => x.id === q.id);
    const list = quiz.questions.filter((x) => x.id !== q.id);
    setQuestions(list);
    setSelected(list[Math.max(0, idx - 1)]?.id ?? "intro");
  };

  const current = quiz.questions.find((q) => q.id === selected);
  const currentIndex = quiz.questions.findIndex((q) => q.id === selected);

  // preview usa o rascunho local (inclusive alterações ainda não salvas)
  const previewConfig = useMemo(() => ({ ...config, quiz }), [config, quiz]);
  const previewCampaign = useMemo(() => toPublicCampaign({ id: campaignId, slug, config: previewConfig }), [campaignId, slug, previewConfig]);
  const driver = useMemo(() => createPreviewDriver(previewConfig), [previewConfig]);
  const initialStep = useMemo(
    () => (selected === "intro" || currentIndex < 0 ? { kind: "intro" as const } : { kind: "question" as const, index: currentIndex }),
    [selected, currentIndex],
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
      {/* Lista de perguntas */}
      <div className="space-y-2">
        <button
          onClick={() => setSelected("intro")}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-[13px] font-medium cursor-pointer",
            selected === "intro" ? "border-accent ring-2 ring-accent/15" : "hover:bg-muted/40",
          )}
        >
          <Settings2 className="size-4 text-muted-foreground" /> Introdução e configurações
        </button>
        <div className="space-y-1.5">
          <SortableList
            items={quiz.questions}
            onReorder={setQuestions}
            disabled={!canEdit}
            renderItem={(q, i, handle) => {
              const Icon = questionTypeMeta[q.type].icon;
              return (
                <div
                  onClick={() => setSelected(q.id)}
                  className={cn(
                    "group flex items-center gap-1.5 rounded-md border bg-card px-1.5 py-2 cursor-pointer",
                    selected === q.id ? "border-accent ring-2 ring-accent/15" : "hover:bg-muted/40",
                  )}
                >
                  {handle}
                  <span className="w-5 text-center text-[11px] tabular-nums text-muted-foreground">{i + 1}</span>
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-[13px]">{q.title || "Sem título"}</span>
                  {canEdit && (
                    <span className="hidden gap-0.5 group-hover:flex">
                      <button className="rounded p-1 hover:bg-muted cursor-pointer" aria-label="Duplicar" onClick={(e) => (e.stopPropagation(), duplicate(q))}>
                        <Copy className="size-3.5 text-muted-foreground" />
                      </button>
                      <button className="rounded p-1 hover:bg-danger-soft cursor-pointer" aria-label="Excluir" onClick={(e) => (e.stopPropagation(), remove(q))}>
                        <Trash2 className="size-3.5 text-danger" />
                      </button>
                    </span>
                  )}
                </div>
              );
            }}
          />
        </div>
        {canEdit && (
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus /> Adicionar pergunta
              </Button>
            </DropdownTrigger>
            <DropdownContent align="start" className="w-56">
              {questionTypes.map((t) => {
                const M = questionTypeMeta[t];
                return (
                  <DropdownItem key={t} onSelect={() => add(t)}>
                    <M.icon /> {M.label}
                  </DropdownItem>
                );
              })}
            </DropdownContent>
          </Dropdown>
        )}
        <p className="px-1 text-[11px] text-muted-foreground">{quiz.questions.length} pergunta(s). Arraste para reordenar.</p>
      </div>

      {/* Editor */}
      <fieldset disabled={!canEdit} className="min-w-0 space-y-5">
        {selected === "intro" || !current ? (
          <IntroEditor quiz={quiz} onChange={setQuiz} />
        ) : (
          <QuestionEditor key={current.id} question={current} index={currentIndex} onChange={(p) => updateQuestion(current.id, p)} />
        )}
        <SaveBar dirty={s.dirty} pending={s.pending} onSave={s.save} disabled={!canEdit} />
      </fieldset>

      {/* Preview */}
      <div className="xl:sticky xl:top-6 h-fit space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Pré-visualização em tempo real</p>
          <div className="inline-flex rounded-md border bg-card p-0.5">
            {(["mobile", "desktop"] as const).map((d) => (
              <button key={d} onClick={() => setDevice(d)} className={cn("rounded-sm p-1 cursor-pointer", device === d ? "bg-muted" : "text-muted-foreground")} aria-label={d}>
                {d === "mobile" ? <Smartphone className="size-3.5" /> : <Monitor className="size-3.5" />}
              </button>
            ))}
          </div>
        </div>
        <div
          className={cn(
            "mx-auto overflow-hidden border bg-white shadow-sm transition-all",
            device === "mobile" ? "h-[640px] w-[340px] rounded-[28px] border-[6px] border-zinc-800" : "h-[520px] w-full rounded-lg",
          )}
        >
          <QuizRunner key={`${selected}-${device}`} campaign={previewCampaign} driver={driver} initialStep={initialStep} embedded />
        </div>
        <p className="text-center text-[11px] text-muted-foreground">Respostas no preview não são registradas.</p>
      </div>
    </div>
  );
}

function IntroEditor({ quiz, onChange }: { quiz: Quiz; onChange: (q: Quiz) => void }) {
  const intro = quiz.intro;
  const st = quiz.settings;
  const setIntro = (p: Partial<Quiz["intro"]>) => onChange({ ...quiz, intro: { ...intro, ...p } });
  const setSettings = (p: Partial<Quiz["settings"]>) => onChange({ ...quiz, settings: { ...st, ...p } });
  return (
    <>
      <Card>
        <CardHeader><CardTitle>Tela de introdução</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow label="Exibir introdução" description="Quando desativada, o quiz começa direto na primeira pergunta." checked={intro.enabled} onCheckedChange={(v) => setIntro({ enabled: v })} />
          <Field label="Título"><Input value={intro.title} onChange={(e) => setIntro({ title: e.target.value })} /></Field>
          <Field label="Subtítulo"><Textarea value={intro.subtitle} onChange={(e) => setIntro({ subtitle: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto do botão"><Input value={intro.ctaLabel} onChange={(e) => setIntro({ ctaLabel: e.target.value })} /></Field>
            <Field label="Imagem (URL)"><Input value={intro.imageUrl} placeholder="https://..." onChange={(e) => setIntro({ imageUrl: e.target.value })} /></Field>
          </div>
          <Field label="Aviso" hint="Recomendado: deixe claro que o quiz é orientativo, não um diagnóstico.">
            <Textarea rows={2} value={intro.disclaimer} onChange={(e) => setIntro({ disclaimer: e.target.value })} />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Comportamento</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SwitchRow label="Barra de progresso" checked={st.showProgress} onCheckedChange={(v) => setSettings({ showProgress: v })} />
          <SwitchRow label="Permitir voltar" checked={st.allowBack} onCheckedChange={(v) => setSettings({ allowBack: v })} />
          <SwitchRow label="Avançar automaticamente" description="Em escolha única e sim/não, avança ao tocar na opção." checked={st.autoAdvance} onCheckedChange={(v) => setSettings({ autoAdvance: v })} />
          <Field label="Mensagem de transição" hint="Exibida enquanto o resultado é calculado.">
            <Input value={st.transitionMessage} onChange={(e) => setSettings({ transitionMessage: e.target.value })} />
          </Field>
        </CardContent>
      </Card>
    </>
  );
}

function QuestionEditor({ question: q, index, onChange }: { question: Question; index: number; onChange: (p: Partial<Question> | ((q: Question) => Question)) => void }) {
  const hasOptions = q.type === "single" || q.type === "multiple" || q.type === "yes_no";
  const setOption = (id: string, patch: Partial<QuizOption>) => onChange((cur) => ({ ...cur, options: cur.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  const moveOption = (i: number, dir: -1 | 1) =>
    onChange((cur) => {
      const list = [...cur.options];
      const j = i + dir;
      if (j < 0 || j >= list.length) return cur;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...cur, options: list };
    });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pergunta {index + 1}</CardTitle>
          <Select
            className="h-8 w-48 text-[13px]"
            value={q.type}
            onChange={(e) => onChange((cur) => changeQuestionType(cur, e.target.value as QuestionType))}
            aria-label="Tipo da pergunta"
          >
            {questionTypes.map((t) => <option key={t} value={t}>{questionTypeMeta[t].label}</option>)}
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Enunciado"><Input value={q.title} onChange={(e) => onChange({ title: e.target.value })} /></Field>
          <Field label="Descrição (opcional)"><Textarea rows={2} value={q.description} onChange={(e) => onChange({ description: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Imagem (URL)"><Input value={q.imageUrl} placeholder="https://..." onChange={(e) => onChange({ imageUrl: e.target.value })} /></Field>
            <Field label="Atributo registrado" hint="Ex.: tempo_disponivel. Usado nas regras.">
              <Input
                value={q.attributeKey}
                placeholder="nome_do_atributo"
                className="font-mono text-xs"
                onChange={(e) => onChange({ attributeKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 60) })}
              />
            </Field>
          </div>
          <SwitchRow label="Resposta obrigatória" description="Perguntas opcionais exibem a opção “Pular”." checked={q.required} onCheckedChange={(v) => onChange({ required: v })} />
          <Field label="Feedback após responder (opcional)" hint="Mensagem curta exibida por um segundo antes de avançar.">
            <Input value={q.feedback} onChange={(e) => onChange({ feedback: e.target.value })} placeholder="Ex.: Ótimo, isso ajuda bastante!" />
          </Field>
        </CardContent>
      </Card>

      {hasOptions && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Opções de resposta</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Cada opção pode registrar um valor, pontuação e atributos extras.</p>
            </div>
            {q.type === "multiple" && (
              <Field label="Máx. seleções" className="w-28">
                <Input type="number" min={0} value={q.maxSelections} onChange={(e) => onChange({ maxSelections: Math.max(0, Number(e.target.value) || 0) })} />
              </Field>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((o, i) => (
              <OptionRow
                key={o.id}
                option={o}
                attributeKey={q.attributeKey}
                fixed={q.type === "yes_no"}
                onChange={(p) => setOption(o.id, p)}
                onMove={(d) => moveOption(i, d)}
                onRemove={() => onChange((cur) => ({ ...cur, options: cur.options.filter((x) => x.id !== o.id) }))}
              />
            ))}
            {q.type !== "yes_no" && (
              <Button type="button" variant="outline" size="sm" onClick={() => onChange((cur) => ({ ...cur, options: [...cur.options, newOption(`Opção ${cur.options.length + 1}`)] }))}>
                <Plus /> Adicionar opção
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {(q.type === "text" || q.type === "number") && (
        <Card>
          <CardHeader><CardTitle>Campo de resposta</CardTitle></CardHeader>
          <CardContent>
            <Field label="Texto de exemplo (placeholder)"><Input value={q.placeholder} onChange={(e) => onChange({ placeholder: e.target.value })} /></Field>
          </CardContent>
        </Card>
      )}

      {q.type === "range" && (
        <Card>
          <CardHeader><CardTitle>Faixa de valores</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Field label="Mínimo"><Input type="number" value={q.min} onChange={(e) => onChange({ min: Number(e.target.value) })} /></Field>
            <Field label="Máximo"><Input type="number" value={q.max} onChange={(e) => onChange({ max: Number(e.target.value) })} /></Field>
            <Field label="Passo"><Input type="number" min={0.01} step="any" value={q.step} onChange={(e) => onChange({ step: Math.max(0.01, Number(e.target.value) || 1) })} /></Field>
            <Field label="Prefixo"><Input value={q.prefix} placeholder="R$ " onChange={(e) => onChange({ prefix: e.target.value })} /></Field>
            <Field label="Sufixo"><Input value={q.suffix} placeholder=" h" onChange={(e) => onChange({ suffix: e.target.value })} /></Field>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function OptionRow({
  option: o,
  attributeKey,
  fixed,
  onChange,
  onMove,
  onRemove,
}: {
  option: QuizOption;
  attributeKey: string;
  fixed: boolean;
  onChange: (p: Partial<QuizOption>) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const attrs = Object.entries(o.attributes);
  const setAttrs = (entries: [string, string][]) => onChange({ attributes: Object.fromEntries(entries.filter(([k]) => k)) });
  return (
    <div className="rounded-md border bg-muted/20 p-2.5">
      <div className="flex items-center gap-2">
        {!fixed && (
          <div className="flex flex-col">
            <button type="button" onClick={() => onMove(-1)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Subir"><ArrowUp className="size-3" /></button>
            <button type="button" onClick={() => onMove(1)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Descer"><ArrowDown className="size-3" /></button>
          </div>
        )}
        <Input value={o.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="Texto da opção" className="h-8" />
        <Input
          type="number"
          value={o.score}
          onChange={(e) => onChange({ score: Number(e.target.value) || 0 })}
          className="h-8 w-20"
          title="Pontuação"
          aria-label="Pontuação"
        />
        <Button type="button" variant="ghost" size="xs" onClick={() => setOpen(!open)}>
          Atributos {attrs.length + (o.value ? 1 : 0) > 0 && <Badge tone="accent">{attrs.length + (o.value ? 1 : 0)}</Badge>}
        </Button>
        {!fixed && (
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onRemove} aria-label="Remover opção">
            <X className="text-muted-foreground" />
          </Button>
        )}
      </div>
      {open && (
        <div className="mt-2.5 space-y-2 border-t pt-2.5">
          <Field label={attributeKey ? `Valor registrado em “${attributeKey}”` : "Valor registrado"} hint={attributeKey ? "Se vazio, usa o id da opção." : "Defina o atributo da pergunta para usar este valor."}>
            <Input value={o.value} className="h-8 font-mono text-xs" placeholder="ex.: ate_1h" onChange={(e) => onChange({ value: e.target.value.slice(0, 120) })} />
          </Field>
          <p className="text-xs font-medium">Atributos extras</p>
          {attrs.map(([k, v], i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={k}
                className="h-8 font-mono text-xs"
                placeholder="atributo"
                onChange={(e) => setAttrs(attrs.map((a, j) => (j === i ? [e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"), a[1]] : a)))}
              />
              <Input value={v} className="h-8 font-mono text-xs" placeholder="valor" onChange={(e) => setAttrs(attrs.map((a, j) => (j === i ? [a[0], e.target.value] : a)))} />
              <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setAttrs(attrs.filter((_, j) => j !== i))} aria-label="Remover atributo">
                <X className="text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="xs" onClick={() => setAttrs([...attrs, [`atributo_${attrs.length + 1}`, ""]])}>
            <Plus /> Atributo
          </Button>
        </div>
      )}
    </div>
  );
}
