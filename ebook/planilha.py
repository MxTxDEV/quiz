# Gera a planilha do order bump "Calculadora de Preço e Lucro" (.xlsx com fórmulas reais).
# Uso: python3 ebook/planilha.py <arquivo-de-saida.xlsx>   (chamado por ebook/build.mjs)
# Os exemplos são os mesmos do guia rápido (ebook/content/bump-calculadora-preco.md).
import sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule

out = sys.argv[1]

INK, ORANGE, SOFT, GREY, LINE = "0B0B0C", "FF6B00", "FFF1E6", "F2F2F4", "E1E1E6"
F_TITLE = Font(name="Arial", size=16, bold=True, color="FFFFFF")
F_SUB = Font(name="Arial", size=10, color="C9C9CF")
F_HEAD = Font(name="Arial", size=11, bold=True, color=ORANGE)
F_LABEL = Font(name="Arial", size=11, color="1A1A1D")
F_HINT = Font(name="Arial", size=9, italic=True, color="7A7A84")
F_OUT = Font(name="Arial", size=11, bold=True, color="1A1A1D")
F_BIG = Font(name="Arial", size=14, bold=True, color="FFFFFF")
FILL_INK = PatternFill("solid", fgColor=INK)
FILL_IN = PatternFill("solid", fgColor=SOFT)
FILL_OUT = PatternFill("solid", fgColor=GREY)
FILL_HL = PatternFill("solid", fgColor=ORANGE)
thin = Side(style="thin", color=LINE)
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
BRL = '"R$" #,##0.00'
PCT = "0.0%"


def sheet_header(ws, title, sub):
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 44
    ws.column_dimensions["C"].width = 18
    ws.column_dimensions["D"].width = 52
    for r in (1, 2, 3):
        for c in "ABCD":
            ws[f"{c}{r}"].fill = FILL_INK
    ws["B1"] = "ROTA INVISÍVEL · CALCULADORA DE PREÇO E LUCRO"
    ws["B1"].font = Font(name="Arial", size=9, bold=True, color=ORANGE)
    ws["B2"] = title
    ws["B2"].font = F_TITLE
    ws["B3"] = sub
    ws["B3"].font = F_SUB
    ws.row_dimensions[2].height = 26
    ws["B5"] = "Laranja-claro: você preenche · Cinza: a planilha calcula (não apague as fórmulas)"
    ws["B5"].font = F_HINT


def section(ws, row, text):
    ws[f"B{row}"] = text
    ws[f"B{row}"].font = F_HEAD


def field(ws, row, label, value, fmt=None, hint=""):
    ws[f"B{row}"] = label
    ws[f"B{row}"].font = F_LABEL
    c = ws[f"C{row}"]
    c.value = value
    c.fill = FILL_IN
    c.border = BOX
    c.font = F_LABEL
    c.alignment = Alignment(horizontal="right")
    if fmt:
        c.number_format = fmt
    if hint:
        ws[f"D{row}"] = hint
        ws[f"D{row}"].font = F_HINT


def calc(ws, row, label, formula, fmt=BRL, hint="", big=False):
    ws[f"B{row}"] = label
    c = ws[f"C{row}"]
    c.value = formula
    c.number_format = fmt
    c.border = BOX
    c.alignment = Alignment(horizontal="right")
    if big:
        ws[f"B{row}"].font = Font(name="Arial", size=12, bold=True, color=INK)
        c.fill = FILL_HL
        c.font = F_BIG
        ws.row_dimensions[row].height = 24
    else:
        ws[f"B{row}"].font = F_LABEL
        c.fill = FILL_OUT
        c.font = F_OUT
    if hint:
        ws[f"D{row}"] = hint
        ws[f"D{row}"].font = F_HINT


wb = Workbook()

# ------------------------------------------------------------------ Como usar
ws = wb.active
ws.title = "Como usar"
sheet_header(ws, "Como usar esta planilha", "Preço = custos diretos + valor do seu tempo + margem de lucro")
lines = [
    ("1. Faça uma cópia", "Salve uma cópia com o nome do seu negócio antes de preencher."),
    ("2. Escolha a aba", "Produto (você produz) · Serviço (seu tempo) · Revenda (compra e revende) · Controle do mês."),
    ("3. Preencha o laranja-claro", "Os exemplos já preenchidos são os mesmos do guia. Troque pelos seus números."),
    ("4. Leia o resultado", "O preço sugerido aparece em destaque. Compare com 5 ofertas parecidas antes de decidir."),
    ("5. Registre o mês", "Anote cada entrada e saída no dia em que acontecer, na aba Controle do mês."),
    ("Atenção", "Os valores de exemplo são ilustrativos. Taxas de plataformas mudam: confira os valores atuais."),
    ("Aviso", "Material educativo. A planilha ajuda a calcular, mas resultados financeiros não são garantidos."),
]
for i, (a, b) in enumerate(lines):
    r = 7 + i * 2
    ws[f"B{r}"] = a
    ws[f"B{r}"].font = F_HEAD if i < 5 else Font(name="Arial", size=11, bold=True, color="C62828")
    ws[f"B{r+1}"] = b
    ws[f"B{r+1}"].font = F_LABEL
    ws.merge_cells(f"B{r+1}:D{r+1}")

# ------------------------------------------------------------------ Produto
ws = wb.create_sheet("Preço de produto")
sheet_header(ws, "Preço de produto", "Doces, marmitas, artesanato, cestas, personalizados · exemplo: bolo de pote")
section(ws, 7, "A leva")
field(ws, 8, "Quantas unidades a leva rende", 20, "0", "Ex.: 20 potes")
section(ws, 10, "Custos diretos da leva")
field(ws, 11, "Ingredientes / matéria-prima", 60, BRL, "Valor gasto na leva inteira")
field(ws, 12, "Embalagens e etiquetas", 30, BRL)
field(ws, 13, "Gás, energia e transporte", 8, BRL, "Estimativa honesta")
field(ws, 14, "Outros custos", 0, BRL)
section(ws, 16, "Seu tempo e sua margem")
field(ws, 17, "Horas de trabalho na leva", 3, "0.0", "Compra, preparo, embalagem e entrega")
field(ws, 18, "Quanto você quer ganhar por hora", 20, BRL)
field(ws, 19, "Margem de lucro", 0.25, PCT, "Comece entre 20% e 30%")
field(ws, 20, "Taxa por venda (maquininha / link / marketplace)", 0, PCT, "Pix sem taxa: 0%")
section(ws, 22, "Resultado")
calc(ws, 23, "Custo direto total da leva", "=SUM(C11:C14)")
calc(ws, 24, "Custo direto por unidade", "=IFERROR(C23/C8,0)")
calc(ws, 25, "Valor do seu tempo por unidade", "=IFERROR(C17*C18/C8,0)")
calc(ws, 26, "Subtotal por unidade", "=C24+C25")
calc(ws, 27, "PREÇO SUGERIDO POR UNIDADE", "=IFERROR(C26*(1+C19)/(1-C20),0)", big=True, hint="Já inclui a margem e a taxa de pagamento")
calc(ws, 28, "Preço arredondado (para cima, de R$ 0,50 em R$ 0,50)", "=CEILING(C27,0.5)")
calc(ws, 29, "Lucro por unidade (além do seu tempo)", "=C28*(1-C20)-C26", hint="Calculado sobre o preço arredondado")
calc(ws, 30, "Lucro da leva inteira (além do seu tempo)", "=C29*C8")
calc(ws, 31, "Você recebe pela leva (tempo + lucro)", "=C17*C18+C30")
calc(ws, 32, "Ponto de equilíbrio (unidades para pagar os custos)", "=IFERROR(ROUNDUP(C23/(C28*(1-C20)),0),0)", "0", hint="Abaixo disso, a leva dá prejuízo")

# ------------------------------------------------------------------ Serviço
ws = wb.create_sheet("Preço de serviço")
sheet_header(ws, "Preço de serviço", "Faxina, manicure, aulas, social media, edição, montagem · exemplo: faxina")
section(ws, 7, "Tempo")
field(ws, 8, "Duração do atendimento (horas)", 4, "0.0")
field(ws, 9, "Deslocamento, ida e volta (horas)", 1, "0.0", "0 se for on-line")
field(ws, 10, "Quanto você quer ganhar por hora", 25, BRL)
section(ws, 12, "Custos por atendimento")
field(ws, 13, "Materiais / produtos", 15, BRL)
field(ws, 14, "Transporte", 12, BRL, "Passagem, combustível ou aplicativo")
field(ws, 15, "Taxa de pagamento", 0, PCT, "Pix sem taxa: 0%")
field(ws, 16, "Margem de lucro", 0.20, PCT, "Comece entre 15% e 25%")
section(ws, 18, "Pacote mensal")
field(ws, 19, "Atendimentos no pacote", 4, "0")
field(ws, 20, "Desconto do pacote", 0.10, PCT)
section(ws, 22, "Resultado")
calc(ws, 23, "Valor do seu tempo", "=(C8+C9)*C10")
calc(ws, 24, "Custos do atendimento", "=C13+C14")
calc(ws, 25, "PREÇO POR ATENDIMENTO", "=IFERROR((C23+C24)*(1+C16)/(1-C15),0)", big=True)
calc(ws, 26, "Preço do pacote mensal", "=C25*C19*(1-C20)")
calc(ws, 27, "Preço por atendimento no pacote", "=IFERROR(C26/C19,0)")
calc(ws, 28, "Seu ganho real por hora (atendimento avulso)", "=IFERROR((C25*(1-C15)-C24)/(C8+C9),0)", hint="Inclui o deslocamento no cálculo")
calc(ws, 29, "Seu ganho real por hora (no pacote)", "=IFERROR((C27*(1-C15)-C24)/(C8+C9),0)", hint="Se ficar abaixo do que você quer, reduza o desconto")

# ------------------------------------------------------------------ Revenda
ws = wb.create_sheet("Revenda e marketplace")
sheet_header(ws, "Revenda e marketplace", "Revenda, catálogo e anúncios em marketplace · exemplo: acessório")
section(ws, 7, "Custos")
field(ws, 8, "Custo do produto (unidade)", 18, BRL)
field(ws, 9, "Frete de compra por unidade", 2, BRL, "Frete total ÷ unidades")
field(ws, 10, "Embalagem e envio por unidade", 1.5, BRL)
field(ws, 11, "Comissão da plataforma", 0.14, PCT, "Confira a taxa atual da sua categoria")
field(ws, 12, "Tarifa fixa por venda", 5, BRL, "Se a plataforma cobrar")
section(ws, 14, "Preço")
field(ws, 15, "Preço que você quer testar", 39.90, BRL)
field(ws, 16, "Margem que você deseja", 0.25, PCT, "Para calcular o preço ideal abaixo")
section(ws, 18, "Resultado")
calc(ws, 19, "Custo total por unidade", "=C8+C9+C10")
calc(ws, 20, "Comissão + tarifa nesse preço", "=C15*C11+C12")
calc(ws, 21, "FICA COM VOCÊ POR VENDA", "=C15-C20-C19", big=True)
calc(ws, 22, "Margem real", "=IFERROR(C21/C15,0)", PCT)
calc(ws, 23, "Preço mínimo (abaixo disso, prejuízo)", "=IFERROR((C19+C12)/(1-C11),0)")
calc(ws, 24, "Preço para a margem desejada", "=IFERROR((C19+C12)/(1-C11-C16),0)")
ws["B26"] = '=IF(C21<0,"⚠ Esse preço dá prejuízo. Aumente o preço ou reduza os custos.",IF(C22<0.15,"Atenção: margem baixa. Qualquer imprevisto vira prejuízo.","Margem saudável para começar."))'
ws["B26"].font = Font(name="Arial", size=11, bold=True, color="C24F00")
ws.merge_cells("B26:D26")

# ------------------------------------------------------------------ Controle do mês
ws = wb.create_sheet("Controle do mês")
sheet_header(ws, "Controle do mês", "Anote cada entrada e saída no dia em que acontecer")
ws.column_dimensions["B"].width = 14
ws.column_dimensions["C"].width = 40
ws.column_dimensions["D"].width = 14
ws.column_dimensions["E"].width = 16
for c in "E":
    for r in (1, 2, 3):
        ws[f"{c}{r}"].fill = FILL_INK
ws["B3"].value = None
ws["C3"] = "Anote cada entrada e saída no dia em que acontecer"
ws["C3"].font = F_SUB
ws["B2"].value = None
ws["C2"] = "Controle do mês"
ws["C2"].font = F_TITLE
ws["B1"].value = None
ws["C1"] = "ROTA INVISÍVEL · CALCULADORA DE PREÇO E LUCRO"
ws["C1"].font = Font(name="Arial", size=9, bold=True, color=ORANGE)
ws["B5"].value = None
ws["C5"] = "Laranja-claro: você preenche · Cinza: a planilha calcula"
ws["C5"].font = F_HINT

summary = [
    ("Total de entradas", '=SUMIF(D14:D213,"Entrada",E14:E213)', BRL),
    ("Total de saídas", '=SUMIF(D14:D213,"Saída",E14:E213)', BRL),
    ("RESULTADO DO MÊS", "=E7-E8", BRL),
    ("Vendas registradas", '=COUNTIF(D14:D213,"Entrada")', "0"),
    ("Valor médio por venda", "=IFERROR(E7/E10,0)", BRL),
]
for i, (label, f, fmt) in enumerate(summary):
    r = 7 + i
    ws[f"C{r}"] = label
    ws[f"C{r}"].font = Font(name="Arial", size=11, bold=(i == 2), color=INK)
    cell = ws[f"E{r}"]
    cell.value = f
    cell.number_format = fmt
    cell.border = BOX
    cell.alignment = Alignment(horizontal="right")
    cell.fill = FILL_HL if i == 2 else FILL_OUT
    cell.font = F_BIG if i == 2 else F_OUT

heads = ["Data", "Descrição", "Tipo", "Valor"]
for j, h in enumerate(heads):
    c = ws.cell(row=13, column=2 + j, value=h)
    c.font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    c.fill = FILL_INK
    c.border = BOX
examples = [
    ("01/03", "Ingredientes para a leva de 20 potes", "Saída", 60),
    ("01/03", "Potes, tampas e etiquetas", "Saída", 30),
    ("02/03", "Venda: 6 potes (Ana)", "Entrada", 60),
    ("02/03", "Venda: 4 potes (vizinha do 12)", "Entrada", 40),
]
dv = DataValidation(type="list", formula1='"Entrada,Saída"', allow_blank=True)
ws.add_data_validation(dv)
for r in range(14, 214):
    for col in range(2, 6):
        c = ws.cell(row=r, column=col)
        c.fill = FILL_IN
        c.border = BOX
        c.font = F_LABEL
    ws.cell(row=r, column=5).number_format = BRL
    dv.add(f"D{r}")
for i, row in enumerate(examples):
    for j, v in enumerate(row):
        ws.cell(row=14 + i, column=2 + j, value=v)
ws["C212"].value = None
ws.freeze_panes = "B14"
ws.conditional_formatting.add("E9", CellIsRule(operator="lessThan", formula=["0"], fill=PatternFill("solid", fgColor="C62828")))

for s in wb.worksheets:
    s.sheet_properties.tabColor = ORANGE
wb.active = 1
wb.save(out)
print(f"XLSX: {out}")
