---
title: "Vue por dentro"
description: "Como a reatividade do Vue rastreia dependências e decide o que renderizar de novo, uma referência de toda a API nativa (reatividade, ciclo de vida, macros do script setup, diretivas e componentes embutidos) e quatro temas para estudar a fundo: provide/inject, Pinia, Web Workers e Server-Sent Events."
version: "Vue 3.5 · revisão para dev pleno"
source: "Material de estudo baseado na referência oficial do Vue 3.5 (vuejs.org). A versão estável mais recente é a 3.5.44; a 3.6, com Vapor Mode, está em release candidate. As bancadas rodam o Vue do próprio grimório."
---

Como a reatividade do Vue rastreia dependências e decide o que renderizar de novo, uma referência de toda a API nativa (reatividade, ciclo de vida, macros do `<script setup>`, diretivas e componentes embutidos) e quatro temas para estudar a fundo: provide/inject, Pinia, Web Workers e Server-Sent Events.

::formula{expr="view = render(estado reativo)  ·  leu → rastreia  ·  escreveu → dispara"}
::
