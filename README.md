# Controle Financeiro Pessoal

Aplicação web simples para registrar e acompanhar receitas e despesas pessoais. O projeto foi pensado para estudantes iniciantes de Engenharia de Software e utiliza apenas HTML, CSS e JavaScript, sem frameworks.

## Funcionalidades

- Dashboard com saldo disponível, total de receitas, total de despesas e quantidade de movimentações.
- Cadastro de receitas e despesas com descrição, valor, categoria e data.
- Histórico ordenado por data, com identificação visual do tipo e confirmação antes da exclusão.
- Filtros por mês e tipo, além de pesquisa pela descrição.
- Gráfico comparativo de receitas e despesas e gráfico de despesas por categoria.
- Persistência local dos dados no `localStorage` do navegador.
- Validação de campos, valores positivos com até duas casas decimais e datas reais no formato `AAAA-MM-DD`.
- Cálculos em centavos inteiros e mensagens claras quando os dados inválidos são ignorados ou o armazenamento falha.
- Interface responsiva para computadores, tablets e celulares.

O dashboard apresenta os totais gerais. Os filtros de mês afetam o histórico e os gráficos; os filtros de tipo e pesquisa afetam o histórico. O gráfico mensal exibe os seis meses mais recentes quando nenhum mês específico está selecionado.

## Tecnologias

- HTML5 para a estrutura e acessibilidade.
- CSS3 para o tema escuro, layout e responsividade.
- JavaScript puro para a lógica, os gráficos em Canvas e o armazenamento.
- `localStorage` para manter os registros neste navegador e dispositivo.

## Como executar

1. Baixe ou clone o projeto.
2. Abra `index.html` em um navegador atualizado.
3. Use **Nova movimentação** para registrar receitas e despesas.

Não é necessário instalar dependências ou iniciar um servidor. Os registros ficam salvos apenas no armazenamento local do navegador usado e não são sincronizados entre dispositivos. Limpar os dados do navegador também remove os registros.

## Estrutura

```text
controle-financeiro/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── README.md
```
