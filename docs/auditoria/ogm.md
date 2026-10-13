# Auditoría de las reglas de proceso

- **Reglas auditadas:** la sección «Reglas de proceso» de `CLAUDE.md` (`AGENTS.md` es un symlink al mismo fichero), partida en una regla por fila.
- **Ventana:** los 15 últimos commits de `auditoria-ogm`, `b955a72`..`eff1686` (2026-08-20 → 2026-09-23). Historia lineal: ningún merge commit.
- **Contra qué:** los commits y el árbol de trabajo (limpio al empezar). No se ha consultado GitHub (PRs, protecciones de rama) ni transcripciones de sesión.
- **Es una auditoría, no un arreglo:** este es el único fichero escrito.
- **Vigencia:** la redacción actual de las reglas de rama, commit y PR nace en `0e56705`, y la de contrato de capability en `160fbc7`. Los commits anteriores (`b955a72`, `4427afc`) no estaban sujetos a esa redacción.

| Qué pide la regla | Qué se revisó | Veredicto | Evidencia | Qué haría con ella |
|---|---|---|---|---|
| **R1.** Antes de tocar código, mirar la rama y, si ya es de trabajo (ni `main` ni `sN/*`), seguir en ella en vez de crear otra. | `git reflog`, `git branch -a`, `git log -15 --format=%p` | no se puede comprobar | Git no guarda en qué rama se hizo cada commit; el reflog solo cubre este clon (clone → `s5/start` → `auditoria-ogm`, una única rama creada). | dejarla |
| **R2.** Desde `main` o una `sN/*`, la rama nueva se crea con `git checkout -b feat/<slug>`. | `git branch -a --format='%(refname:short)'`, `README.md:109`, `git reflog` | no se cumple | De 7 ramas de trabajo (local + origin) solo `feat/spec-viva-auth` es `feat/*`; la actual es `auditoria-ogm` porque `README.md:109` manda ese nombre. | borrarla |
| **R3.** No commitear directamente en `main` ni en ninguna `sN/*`. | `git branch -a --contains <sha>`, `git for-each-ref`, `git merge-base --is-ancestor`, `git show 0e56705 -- CLAUDE.md` | no se cumple | `afc4b74` (su asunto dice «en la rama de partida»), `21ce54d` y `eff1686`, posteriores a `0e56705`, están en `s5/start`; son de los mantenedores y de los otros 9 posteriores git no dice dónde se hicieron. | convertirla en una comprobación automática |
| **R4.** Cerrar cada petición con un commit hecho con la skill `/commit`. | `git log -15 --format=%s`, `.claude/skills/commit/SKILL.md` | no se puede comprobar | 15/15 asuntos son `tipo(scope): descripción`, que es lo que produce la skill, pero un commit manual sale igual y nada registra qué fue «una petición». | convertirla en una comprobación automática |
| **R5.** Si un cambio toca rutas, controladores, validadores o transformers de una capability, el mismo commit lleva el OpenAPI y `docs/capabilities/<nombre>/README.md` al día. | `git log -15 --name-only -- backend/app/{controllers,validators,transformers} backend/start/routes.ts`, `git log -- CLAUDE.md`, `docs/capabilities/tasks/README.md` | se cumple | Tras `160fbc7` solo `cbe9617` toca controladores y trae anotaciones OpenAPI y README en el mismo commit; `4e03d1f` toca un transformer sin README, pero es anterior a la regla. Muestra: 1 commit. | convertirla en una comprobación automática |
| **R6.** Abrir el PR con `gh pr create` y una descripción completa, una sola vez, al terminar la unidad de trabajo. | `git log -15 --format=%p`, `Test-Path .github`, `CLAUDE.md` | no se puede comprobar | Los PRs viven en GitHub, no en git: sin merge commits en la ventana ni `.github/`. Falta `gh pr list --state all`, y ningún fichero define cuándo termina una «unidad de trabajo». | dejarla |
| **R7.** Pasar el subagente `adversarial-reviewer` sobre ese PR una sola vez, como último paso antes de dar la unidad por terminada. | `.claude/agents/adversarial-reviewer.md`, `git log -15 --grep=review -i`, `Test-Path .github` | no se puede comprobar | El revisor es de solo lectura (`Read, Grep, Glob`) y no deja nada en git; solo `8f9e715` y `0e56705` lo nombran, y es para editar el propio agente o la regla. Falta el informe del pase y un sitio donde aterrice. | convertirla en una comprobación automática |
| **R8.** Al abrir el PR, responder en el chat solo con su URL, sin repetir el resumen. | `CLAUDE.md`, `git log -15` | no se puede comprobar | Es una conducta del chat, y el chat no se guarda en el repo (la regla misma dice que «la sesión se va a perder»). Faltan las transcripciones de sesión. | dejarla |

## Notas

**Qué sería «convertirla en comprobación automática»:**

- **R3:** protección de rama en GitHub para `main` y `sN/*`, con excepción para los mantenedores, o un hook `pre-commit` que falle si `git branch --show-current` casa con `main` o `s\d+/`.
- **R4:** un hook `commit-msg` que rechace asuntos que no sean `tipo(scope): descripción`. Es lo único de la regla que deja rastro; que se usó la skill no se puede probar.
- **R5:** un job que regenere `.adonisjs/` y el documento `/api.json` y falle con `git diff --exit-code`. Hoy no hay `.github/` ni hooks de git activos (`.git/hooks` solo tiene `*.sample`).
- **R7:** un job de CI que lance el revisor al abrirse el PR y deje el hallazgo como comentario. Hoy el agente no tiene `Bash`, así que ni siquiera puede leer «ese PR» por su cuenta.

**Cosas que han salido de paso:**

- **R2 contradice a la lección:** `README.md:109` manda `auditoria-<iniciales>`, y la regla manda `feat/<slug>`. Dos instrucciones del mismo repo se contradicen y ninguna dice cuál manda. Además, R1 ya cubre «quedarse en la rama de trabajo» y R3 implica crearla, así que lo único que R2 añade es el nombre.
- **R3 es ambigua con los nombres reales:** `origin/s1/harness-ogm` y `origin/s3/spec-viva-og` son ramas de trabajo que casan con `sN/*`; leída al pie de la letra, la regla las declara intocables.
- **R5 y `.adonisjs/`:** la regla dice que lo que se commitea es el diff regenerado de `.adonisjs/`, pero `cbe9617` no toca `.adonisjs/`. No se ha regenerado para comprobar si debía cambiar, porque eso escribiría en el árbol.
- **R5 solo existe para `tasks`:** `docs/capabilities/` solo tiene `tasks/`. `auth` no tiene README, y sus tres controladores no llevan ninguna anotación `@Api*`: un cambio en `auth` no podría cumplir la regla tal como está escrita.
- **Fuera de las reglas de proceso:** `CLAUDE.md` afirma que «la capability `tasks` no tiene ni un test», pero `4427afc` añadió `backend/tests/functional/tasks/assignee.spec.ts`. La descripción está desfasada.

## Parte B

1. La regla en la que más te equivocaste. Compara tu expectativa inicial con el veredicto final y elige la que más se alejó de lo que pensabas. Si acertaste todas, indícalo y explica en una frase en qué te apoyaste para acertar. Si solo era una impresión, también conviene dejarlo por escrito.

**R3.** No commitear directamente en `main` ni en ninguna `sN/*`. pensava que esta regla era bastante clara pero no se cumple.

2. Una regla que no se puede comprobar con la información disponible. Explica en una frase qué tendría que cambiar para poder verificarla. Puede ser reformularla, convertirla en una comprobación automática o aceptar que no deja una evidencia clara.

**R7.** Pasar el subagente `adversarial-reviewer` sobre ese PR una sola vez, como último paso antes de dar la unidad por terminada. El informe que genera no se guarda solo se muestra en la salida del agente.

3. La regla que eliminarías y por qué. Hay dos casos habituales: una regla que ya garantiza otra herramienta o una que nadie sigue y que tampoco aporta valor. Elige una y explica a cuál de los dos casos pertenece.

**R8.** Al abrir el PR, responder en el chat solo con su URL, sin repetir el resumen.
No aporta nada, al contrario no da feedback del trabajo hecho.