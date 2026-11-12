---
title: "Go por dentro"
description: "Go para quem nunca escreveu uma linha da linguagem: a anatomia de um arquivo, variáveis e valores zero, for e switch, funções com vários retornos, slices e maps, structs e métodos, interfaces implícitas, erros como valores, pacotes e módulos, generics e iteradores, goroutines e channels, context, a biblioteca padrão, HTTP, testes e os idiomas que aparecem em todo código Go."
version: "Go 1.27 · do zero à leitura fluente"
source: "Material de estudo baseado na especificação da linguagem (versão go1.27), no Tour of Go, no Effective Go, na documentação da biblioteca padrão e nas notas de lançamento do Go 1.24 ao 1.27. Recursos marcados com versão exigem pelo menos aquela versão do Go (a linha go do go.mod)."
---

Go para quem nunca escreveu uma linha da linguagem. O objetivo não é cobrir cada canto da especificação, mas deixar você capaz de abrir um repositório Go qualquer e ler sem travar: o que cada símbolo significa, por que o código tem tantos `if err != nil` e o que acontece quando aparece um `go` ou um `<-`. Cada capítulo traz o código primeiro e a explicação logo em seguida; os exemplos rodam como estão em [go.dev/play](https://go.dev/play).

::chain
---
steps:
  - "package"
  - "import"
  - "tipos e funções"
  - "go build"
  - "um binário"
---
Todo programa Go é um conjunto de pacotes compilados para um único executável, sem runtime para instalar no servidor.
::
