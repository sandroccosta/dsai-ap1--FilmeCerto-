-- Onboarding assertivo: gêneros que a pessoa não quer ver e streamings que ela assina.
-- Quem já tinha preferências fica com as duas listas vazias.

alter table public.preferencias
  add column generos_evitados int[] not null default '{}'
    check (cardinality(generos_evitados) <= 5)
    -- Os 19 gêneros de filme do TMDB (src/features/preferencias/generos.ts).
    check (generos_evitados <@ array[
      28, 16, 12, 10770, 35, 80, 99, 18, 10751, 14, 37, 878, 10752, 36, 9648, 10402, 10749, 27, 53
    ]),
  -- IDs de provedor do TMDB; a lista fechada fica no código (src/features/preferencias/streamings.ts),
  -- porque o catálogo de provedores muda com mais frequência que o de gêneros.
  add column streamings int[] not null default '{}'
    check (cardinality(streamings) <= 10)
    check (array_position(streamings, null) is null),
  add constraint preferencias_evitados_fora_dos_favoritos
    check (not (generos && generos_evitados));

comment on column public.preferencias.generos_evitados is 'Gêneros que nunca devem ser recomendados.';
comment on column public.preferencias.streamings is 'Provedores do TMDB que a pessoa assina (watch_region=BR).';
