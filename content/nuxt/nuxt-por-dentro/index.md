---
title: "Nuxt por dentro"
description: "O que acontece entre a requisição e a página interativa: onde cada linha de código roda, como os dados viajam do servidor para o cliente sem buscar duas vezes, como misturar estático, cache e SSR por rota, e uma referência de todos os composables, componentes e utilitários do framework."
version: "Nuxt 4.6 · revisão para dev pleno"
source: "Material de estudo baseado na documentação oficial do Nuxt 4 (nuxt.com) e nas notas de versão até a 4.6.4 (2 de novembro de 2026). O Nuxt 5 ainda não foi lançado."
---

O que acontece entre a requisição e a página interativa: onde cada linha de código roda, como os dados viajam do servidor para o cliente sem buscar duas vezes, como misturar estático, cache e SSR por rota, e uma referência de todos os composables, componentes e utilitários do framework. Neste tomo, :server[servidor] e :client[cliente] têm cores próprias.

::formula{expr="Nuxt = Vue + Vue Router + Nitro + convenções"}
::
