---
title: "Web por dentro"
description: "O que existe por baixo de qualquer framework: como o navegador transforma bytes em pixels, o event loop, HTTP e cache, o modelo de segurança por origem, threads com Workers, Service Workers, tempo real, armazenamento, performance e as APIs que React, Vue e companhia apenas embrulham."
version: "Plataforma web · conceitos avançados"
source: "Material de estudo sobre a plataforma web, baseado nas especificações e na documentação do MDN e do web.dev. O suporte a APIs recentes muda com frequência: confira o selo Baseline antes de usar em produção."
---

O que existe por baixo de qualquer framework: como o navegador transforma bytes em pixels, o event loop, HTTP e cache, o modelo de segurança por origem, threads com Workers, Service Workers, tempo real, armazenamento, performance e as APIs que React, Vue e companhia apenas embrulham. Os tomos de [Vue](/vue) e [React](/react) apontam para cá sempre que um tema precisa ir mais fundo.

::formula{expr="bytes → DOM + CSSOM → layout → paint → composite"}
::
