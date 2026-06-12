-- Cole este script no Supabase → SQL Editor → Run
-- Aplica modelo v2 + funções de pontuação (9 rodadas, 10/7/5/2, artilheiro da rodada)
-- Execute DEPOIS das migrations base do projeto (ou se db push não estiver disponível)

\i supabase/migrations/20260611220000_scoring_system_v2_data_model.sql
\i supabase/migrations/20260611220100_scoring_system_v2_functions.sql
