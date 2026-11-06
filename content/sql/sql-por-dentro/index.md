---
title: "SQL por dentro"
description: "Da primeira consulta ao que separa quem usa banco de quem entende banco: a ordem em que o SQL é avaliado, texto e datas sem armadilhas, JOINs e janelas, transações e MVCC, locks, como cada tipo de índice funciona por dentro, planos de execução, as views que mostram o que o servidor está fazendo, busca textual, trigramas e o que manter em dia para o banco aguentar produção."
version: "PostgreSQL 18 · do básico ao avançado"
source: "Material de estudo baseado na documentação do PostgreSQL 18 (versão estável atual) e nas notas do PostgreSQL 19, em release candidate com lançamento previsto para 19 de novembro de 2026. Recursos marcados com versão exigem pelo menos aquela versão."
---

Da primeira consulta ao que separa quem usa banco de quem entende banco: a ordem em que o SQL é avaliado, texto e datas sem armadilhas, JOINs e janelas, transações e MVCC, locks, como cada tipo de índice funciona por dentro, planos de execução, as views que mostram o que o servidor está fazendo, busca textual, trigramas e o que manter em dia para o banco aguentar produção. O SQL que o Eloquent gera aparece no [tomo de Laravel](/laravel); aqui está o que o banco faz com ele.

::formula{expr="FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT"}
::
