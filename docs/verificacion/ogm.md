# Matriz de trazabilidad — «Lo que cada tarea muestra de su responsable»

Fuente: `openspec/specs/tasks/spec.md`, requisito «Lo que cada tarea muestra de su responsable».
Suite revisada: `backend/tests/functional/auth/*.spec.ts` (es la única que existe; no hay `tests/unit/` ni ningún test de `tasks`).

- Scenarios del requisito: **3** (anotado al empezar)
- Scenarios cubiertos: **0** (anotado al terminar)

| Scenario | Test que lo cubre | Estado | Qué faltó para decidir |
|---|---|---|---|
| Al obtener una tarea cuyo responsable es «Ada Lovelace», su `assignee` trae el nombre y las iniciales | | No cubierto | |
| Al obtener cualquier tarea, suelta o en la lista, su `assignee` no incluye el email ni otro dato de acceso | | No cubierto | |
| Si el responsable se registró sin nombre, su `assignee` trae el nombre nulo y las iniciales siguen llegando | | No cubierto | |

## Por qué ninguno cuenta como cubierto

Ningún test de la suite llama a una ruta de tareas (`/api/v1/tasks…`) ni inspecciona un `assignee`. Los tests que se le parecen comprueban la cuenta, no la tarea:

- `auth/initials.spec.ts` — «un nombre de dos palabras da la inicial de cada una», «un nombre de una palabra da sus dos primeras letras», «sin nombre, las iniciales salen del email»: miran `data.user.initials` en la respuesta de `POST /auth/login`. Ejercitan el getter `User.initials`, pero no la forma que la tarea le da al responsable (`TaskAssigneeTransformer` / `TaskTransformer`). Se acercan a los scenarios 1 y 3, pero no los verifican.
- `auth/signup.spec.ts` — «una cuenta puede quedarse sin nombre»: comprueba `fullName` nulo en el registro, no en el `assignee` de una tarea.

## Hallazgo al revisar el código (no es parte de la matriz)

El scenario «La tarea no filtra datos de cuenta» no solo carece de test: el código actual probablemente lo incumple.

- `backend/app/transformers/task_transformer.ts` serializa `assignee` con `UserTransformer`, que incluye `email`, `createdAt` y `updatedAt`.
- `TaskTransformer` lo usan la lista (`tasks_controller.ts:47`), la creación (`tasks_controller.ts:80`) y el cambio de estado (`task_statuses_controller.ts:26`).
- Solo la tarea suelta y el cambio de fecha usan `TaskDetailTransformer`, que sí usa `TaskAssigneeTransformer` (`id`, `fullName`, `initials`).
- `TaskAssigneeTransformer` documenta que no debe sustituirse por `UserTransformer`; el commit `ed2c748` («reutilizar UserTransformer y no duplicar la forma del usuario») hizo justo eso en `TaskTransformer`.

Lo he deducido leyendo el código, no ejecutando la API. Un test del scenario 2 sobre la lista lo confirmaría o lo desmentiría.
