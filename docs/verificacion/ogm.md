# Matriz de trazabilidad — «Lo que cada tarea muestra de su responsable»

Fuente: `openspec/specs/tasks/spec.md`, requisito «Lo que cada tarea muestra de su responsable».
Suite revisada: `backend/tests/functional/` (`auth/*.spec.ts` y `tasks/assignee.spec.ts`).

- Scenarios del requisito: **3** (anotado al empezar)
- Scenarios cubiertos: **3** (anotado al terminar)

| Scenario | Test que lo cubre | Estado | Qué faltó para decidir |
|---|---|---|---|
| Al obtener una tarea cuyo responsable es «Ada Lovelace», su `assignee` trae el nombre y las iniciales | el assignee trae el nombre y las iniciales del responsable | Cubierto | |
| Al obtener cualquier tarea, suelta o en la lista, su `assignee` no incluye el email ni otro dato de acceso | la tarea suelta no incluye el email ni otros datos de acceso del responsable<br>la lista no incluye el email ni otros datos de acceso del responsable | Cubierto | |
| Si el responsable se registró sin nombre, su `assignee` trae el nombre nulo y las iniciales siguen llegando | un responsable sin nombre llega con el nombre nulo y sus iniciales<br>un responsable sin nombre también llega sin nombre en la lista, con sus iniciales | Cubierto | |

## Cómo se verificó

Los cinco tests están en `backend/tests/functional/tasks/assignee.spec.ts`, grupo «Tasks | responsable». Pasan (5 de 5) con `node ace test functional --files=assignee`, ejecutado desde WSL.

El scenario 2 cubre las dos formas de obtener una tarea (suelta y en la lista), una por test. Con el scenario 3 pasa lo mismo.

Los tests de `auth/initials.spec.ts` y `auth/signup.spec.ts` no se cuentan: miran la cuenta (`data.user`), no el `assignee` de una tarea.

Los tests se ejecutaron ya con `TaskTransformer` usando `TaskAssigneeTransformer`. No se ha comprobado que fallen contra la versión anterior, que usaba `UserTransformer` e incluía el email del responsable en la lista.

# Parte B: las tres líneas

1. Cuántos scenarios creías cubiertos antes de mirar, y cuántos lo estaban
    cubiertos 0, sin cubrir 3
2. El scenario en el que no supiste si faltaba un test o faltaba la regla en la spec
    La tarea no filtra datos de cuenta, dude si el email era del usuario o del responsable
3. Algo que el scenario no determinaba y tuviste que decidir al escribir el test.
    nada