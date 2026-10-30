"use client";

import { useMemo, useState } from "react";
import { Copy, LayoutList, Monitor, Paintbrush, Plus, RefreshCcw, Smartphone, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SwitchRow } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { ObjectListEditor, StringListEditor } from "@/components/admin/list-editor";
import { SortableList } from "@/components/admin/sortable";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { SaveBar, useSections } from "@/components/admin/use-section";
import { SalesPageView } from "@/components/public/sales-page";
import { blockLabels, newBlock, offerFromProduct } from "@/lib/domain/defaults";
import type { Block, BlockType, CampaignConfig, Offer, Profile } from "@/lib/domain/config";
import type { Product } from "@/lib/db/schema";
import { centsToInput, cn, parseMoneyToCents, uid } from "@/lib/utils";

const blockOrder = Object.keys(blockLabels) as BlockType[];

export function SalesPageEditor({
  campaignId,
  config,
  product,
  canEdit,
}: {
  campaignId: string;
  config: CampaignConfig;
  product: Product | null;
  canEdit: boolean;
}) {
  const s = useSections(campaignId, { salesPage: config.salesPage, offer: config.offer });
  const { salesPage, offer } = s.value;
  const setBlocks = (blocks: Block[]) => s.setValue({ offer, salesPage: { ...salesPage, blocks } });
  const setOffer = (o: Offer) => s.setValue({ salesPage, offer: o });
  const [selected, setSelected] = useState<string | null>(salesPage.blocks[0]?.id ?? null);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [asProfile, setAsProfile] = useState<string>("");

  const current = salesPage.blocks.find((b) => b.id === selected) ?? null;
  const updateBlock = (b: Block) => setBlocks(salesPage.blocks.map((x) => (x.id === b.id ? b : x)));
  const add = (type: BlockType) => {
    const b = newBlock(type);
    const idx = salesPage.blocks.findIndex((x) => x.id === selected);
    const list = [...salesPage.blocks];
    list.splice(idx >= 0 ? idx + 1 : list.length, 0, b);
    setBlocks(list);
    setSelected(b.id);
  };

  const profile = config.profiles.find((p) => p.id === asProfile) ?? null;
  const ctx = useMemo(() => ({ profile: profile && { id: profile.id, name: profile.name }, checkoutHref: () => "#checkout" }), [profile]);

  return (
    <fieldset disabled={!canEdit}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Tabs defaultValue="blocks" className="min-w-0">
          <TabsList className="mb-5">
            <TabsTrigger value="blocks"><LayoutList /> Blocos <Badge>{salesPage.blocks.length}</Badge></TabsTrigger>
            <TabsTrigger value="offer"><Tag /> Oferta</TabsTrigger>
            <TabsTrigger value="theme"><Paintbrush /> Aparência</TabsTrigger>
          </TabsList>

          <TabsContent value="blocks">
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-1.5">
                <SortableList
                  items={salesPage.blocks}
                  onReorder={setBlocks}
                  disabled={!canEdit}
                  renderItem={(b, _i, handle) => (
                    <div
                      onClick={() => setSelected(b.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border bg-card px-1.5 py-2 text-[13px] cursor-pointer",
                        selected === b.id ? "border-accent ring-2 ring-accent/15" : "hover:bg-muted/40",
                      )}
                    >
                      {handle}
                      <span className="flex-1 truncate">{blockLabels[b.type]}</span>
                      {b.profileIds.length > 0 && <Badge tone="accent">{b.profileIds.length} perfil</Badge>}
                    </div>
                  )}
                />
                {canEdit && (
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full"><Plus /> Adicionar bloco</Button>
                    </DropdownTrigger>
                    <DropdownContent align="start" className="max-h-80 overflow-y-auto">
                      {blockOrder.map((t) => <DropdownItem key={t} onSelect={() => add(t)}>{blockLabels[t]}</DropdownItem>)}
                    </DropdownContent>
                  </Dropdown>
                )}
              </div>
              <div className="min-w-0">
                {current ? (
                  <BlockEditor
                    key={current.id}
                    block={current}
                    profiles={config.profiles}
                    onChange={updateBlock}
                    onDuplicate={() => {
                      const copy = { ...structuredClone(current), id: uid("b") };
                      const idx = salesPage.blocks.findIndex((x) => x.id === current.id);
                      setBlocks([...salesPage.blocks.slice(0, idx + 1), copy, ...salesPage.blocks.slice(idx + 1)]);
                      setSelected(copy.id);
                    }}
                    onRemove={() => {
                      const rest = salesPage.blocks.filter((x) => x.id !== current.id);
                      setBlocks(rest);
                      setSelected(rest[0]?.id ?? null);
                    }}
                  />
                ) : (
                  <Notice>Selecione ou adicione um bloco.</Notice>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="offer">
            <OfferEditor offer={offer} onChange={setOffer} product={product} />
          </TabsContent>

          <TabsContent value="theme">
            <Card>
              <CardHeader><CardTitle>Aparência da página de vendas</CardTitle></CardHeader>
              <CardContent>
                <ThemeEditor value={salesPage.theme} onChange={(theme) => s.setValue({ offer, salesPage: { ...salesPage, theme } })} />
              </CardContent>
            </Card>
          </TabsContent>
          <SaveBar dirty={s.dirty} pending={s.pending} onSave={s.save} disabled={!canEdit} />
        </Tabs>

        <div className="xl:sticky xl:top-6 h-fit space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Select className="h-8 text-xs" value={asProfile} onChange={(e) => setAsProfile(e.target.value)} aria-label="Ver como perfil">
              <option value="">Visitante sem perfil</option>
              {config.profiles.map((p) => <option key={p.id} value={p.id}>Ver como: {p.name}</option>)}
            </Select>
            <div className="inline-flex shrink-0 rounded-md border bg-card p-0.5">
              {(["mobile", "desktop"] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDevice(d)} className={cn("rounded-sm p-1 cursor-pointer", device === d ? "bg-muted" : "text-muted-foreground")} aria-label={d}>
                  {d === "mobile" ? <Smartphone className="size-3.5" /> : <Monitor className="size-3.5" />}
                </button>
              ))}
            </div>
          </div>
          <div className={cn("mx-auto overflow-y-auto border bg-white shadow-sm", device === "mobile" ? "h-[680px] w-[360px] rounded-[28px] border-[6px] border-zinc-800" : "h-[680px] w-full rounded-lg")}>
            <div style={device === "desktop" ? { zoom: 0.62 } : undefined}>
              <SalesPageView page={salesPage} offer={offer} ctx={ctx} minHeight="100%" />
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  );
}

function ProfileVisibility({ block, profiles, onChange }: { block: Block; profiles: Profile[]; onChange: (b: Block) => void }) {
  if (!profiles.length) return null;
  const toggle = (id: string) =>
    onChange({ ...block, profileIds: block.profileIds.includes(id) ? block.profileIds.filter((x) => x !== id) : [...block.profileIds, id] });
  return (
    <div className="space-y-2 border-t pt-4">
      <p className="text-[13px] font-medium">Visível para</p>
      <p className="text-xs text-muted-foreground">Nenhum perfil marcado = todos os visitantes veem este bloco.</p>
      <div className="flex flex-wrap gap-1.5">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={cn("rounded-full border px-2.5 py-1 text-xs cursor-pointer", block.profileIds.includes(p.id) ? "border-accent bg-accent-soft text-accent" : "text-muted-foreground hover:bg-muted")}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockEditor({
  block: b,
  profiles,
  onChange,
  onDuplicate,
  onRemove,
}: {
  block: Block;
  profiles: Profile[];
  onChange: (b: Block) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const set = (patch: Record<string, unknown>) => onChange({ ...b, ...patch } as Block);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{blockLabels[b.type]}</CardTitle>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="xs" onClick={onDuplicate}><Copy /> Duplicar</Button>
          <Button type="button" variant="danger-ghost" size="xs" onClick={onRemove}><Trash2 /> Remover</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(b.type === "headline" || b.type === "subheadline") && (
          <>
            <Field label="Texto" hint="Use {{perfil}} para inserir o nome do perfil do visitante.">
              <Textarea rows={b.type === "headline" ? 2 : 3} value={b.text} onChange={(e) => set({ text: e.target.value })} />
            </Field>
            <Field label="Alinhamento">
              <Select value={b.align} onChange={(e) => set({ align: e.target.value })}>
                <option value="center">Centralizado</option>
                <option value="left">À esquerda</option>
              </Select>
            </Field>
          </>
        )}
        {(b.type === "image" || b.type === "mockup") && (
          <>
            <Field label="URL da imagem"><Input value={b.url} placeholder="https://..." onChange={(e) => set({ url: e.target.value })} /></Field>
            {b.type === "image" ? (
              <Field label="Texto alternativo"><Input value={b.alt} onChange={(e) => set({ alt: e.target.value })} /></Field>
            ) : (
              <Field label="Legenda"><Input value={b.caption} onChange={(e) => set({ caption: e.target.value })} /></Field>
            )}
          </>
        )}
        {b.type === "video" && (
          <Field label="URL do vídeo" hint="YouTube, Vimeo ou arquivo .mp4.">
            <Input value={b.url} placeholder="https://youtube.com/watch?v=..." onChange={(e) => set({ url: e.target.value })} />
          </Field>
        )}
        {b.type === "benefits" && (
          <>
            <Field label="Título"><Input value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <SwitchRow label="Usar benefícios da oferta" description="Desative para escrever uma lista específica para este bloco." checked={b.useOffer} onCheckedChange={(v) => set({ useOffer: v })} />
            {!b.useOffer && <StringListEditor value={b.items} onChange={(items) => set({ items })} />}
          </>
        )}
        {b.type === "content" && (
          <>
            <Field label="Título"><Input value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <ObjectListEditor
              value={b.items}
              onChange={(items) => set({ items })}
              empty={{ title: "", description: "" }}
              fields={[{ key: "title", label: "Módulo / item" }, { key: "description", label: "Descrição", multiline: true }]}
              addLabel="Adicionar item"
            />
          </>
        )}
        {b.type === "bonuses" && (
          <>
            <Field label="Título"><Input value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Notice>Os bônus exibidos são os cadastrados na aba Oferta.</Notice>
          </>
        )}
        {b.type === "testimonials" && (
          <>
            <Field label="Título"><Input value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Notice tone="warning">Use apenas depoimentos reais, com autorização de quem os deu.</Notice>
            <ObjectListEditor
              value={b.items}
              onChange={(items) => set({ items })}
              empty={{ name: "", role: "", text: "", avatarUrl: "" }}
              fields={[
                { key: "name", label: "Nome" },
                { key: "role", label: "Descrição (opcional)" },
                { key: "text", label: "Depoimento", multiline: true },
                { key: "avatarUrl", label: "Foto (URL, opcional)" },
              ]}
              addLabel="Adicionar depoimento"
            />
          </>
        )}
        {b.type === "faq" && (
          <>
            <Field label="Título"><Input value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <ObjectListEditor
              value={b.items}
              onChange={(items) => set({ items })}
              empty={{ question: "", answer: "" }}
              fields={[{ key: "question", label: "Pergunta" }, { key: "answer", label: "Resposta", multiline: true }]}
              addLabel="Adicionar pergunta"
            />
          </>
        )}
        {b.type === "price" && (
          <>
            <Field label="Título (opcional)"><Input value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Notice>Preço, preço de referência e condições vêm da aba Oferta.</Notice>
          </>
        )}
        {b.type === "cta" && (
          <>
            <Field label="Texto do botão" hint="Vazio = usa o texto padrão da oferta."><Input value={b.label} onChange={(e) => set({ label: e.target.value })} /></Field>
            <Field label="Observação abaixo do botão"><Input value={b.note} onChange={(e) => set({ note: e.target.value })} /></Field>
          </>
        )}
        {b.type === "guarantee" && (
          <>
            <Field label="Título"><Input value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Texto" hint="Vazio = usa a garantia da oferta."><Textarea value={b.text} onChange={(e) => set({ text: e.target.value })} /></Field>
          </>
        )}
        {b.type === "footer" && (
          <Field label="Texto do rodapé"><Textarea value={b.text} onChange={(e) => set({ text: e.target.value })} /></Field>
        )}
        <ProfileVisibility block={b} profiles={profiles} onChange={onChange} />
      </CardContent>
    </Card>
  );
}

function MoneyInput({ cents, onChange, placeholder }: { cents: number | null; onChange: (c: number | null) => void; placeholder?: string }) {
  const [text, setText] = useState(centsToInput(cents));
  return (
    <Input
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseMoneyToCents(e.target.value));
      }}
    />
  );
}

function OfferEditor({ offer, onChange, product }: { offer: Offer; onChange: (o: Offer) => void; product: Product | null }) {
  const set = (patch: Partial<Offer>) => onChange({ ...offer, ...patch });
  const [version, setVersion] = useState(0);
  const refInvalid = offer.referencePriceCents != null && offer.referencePriceCents <= offer.priceCents;
  return (
    <div className="space-y-5" key={version}>
      {product && (
        <Notice className="flex items-center justify-between gap-3">
          <span>Produto associado: <b>{product.name}</b></span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => {
              if (!confirm("Substituir os dados da oferta pelos dados atuais do produto?")) return;
              onChange(offerFromProduct(product, offer));
              setVersion((v) => v + 1);
            }}
          >
            <RefreshCcw /> Copiar dados do produto
          </Button>
        </Notice>
      )}
      <Card>
        <CardHeader><CardTitle>Preço</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Preço atual">
            <MoneyInput cents={offer.priceCents} onChange={(c) => set({ priceCents: c ?? 0 })} placeholder="97,00" />
          </Field>
          <Field label="Preço de referência (opcional)" error={refInvalid ? "Deve ser maior que o preço atual" : null}>
            <MoneyInput cents={offer.referencePriceCents} onChange={(c) => set({ referencePriceCents: c })} placeholder="Somente se comprovável" />
          </Field>
          <Field label="Moeda">
            <Select value={offer.currency} onChange={(e) => set({ currency: e.target.value as Offer["currency"] })}>
              <option value="BRL">Real (BRL)</option>
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </Select>
          </Field>
          {offer.referencePriceCents != null && (
            <Field label="Justificativa do preço de referência" className="sm:col-span-3" hint="Exibida na página. Ex.: “preço praticado até 01/09/2026”.">
              <Input value={offer.referencePriceNote} onChange={(e) => set({ referencePriceNote: e.target.value })} />
            </Field>
          )}
          <Field label="Condições de pagamento" className="sm:col-span-3">
            <Input value={offer.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value })} placeholder="Ex.: ou 12x de R$ 9,74 no cartão" />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Checkout</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="URL de checkout" hint="O FunnelOS adiciona a sessão e as UTMs para atribuir a venda.">
            <Input value={offer.checkoutUrl} onChange={(e) => set({ checkoutUrl: e.target.value })} placeholder="https://pay.hotmart.com/..." />
          </Field>
          <Field label="Texto padrão do botão"><Input value={offer.buttonLabel} onChange={(e) => set({ buttonLabel: e.target.value })} /></Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Conteúdo da oferta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Descrição"><Textarea value={offer.description} onChange={(e) => set({ description: e.target.value })} /></Field>
          <div className="space-y-1.5"><p className="text-[13px] font-medium">Benefícios</p><StringListEditor value={offer.benefits} onChange={(v) => set({ benefits: v })} /></div>
          <div className="space-y-1.5"><p className="text-[13px] font-medium">Bônus</p>
            <ObjectListEditor
              value={offer.bonuses}
              onChange={(v) => set({ bonuses: v })}
              empty={{ title: "", description: "" }}
              fields={[{ key: "title", label: "Título" }, { key: "description", label: "Descrição", multiline: true }]}
              addLabel="Adicionar bônus"
            />
          </div>
          <Field label="Garantia" hint="Conforme a política real do produto."><Textarea value={offer.guarantee} onChange={(e) => set({ guarantee: e.target.value })} /></Field>
        </CardContent>
      </Card>
      <Notice>Contadores regressivos, escassez artificial e descontos fictícios não são suportados por decisão de produto.</Notice>
    </div>
  );
}
