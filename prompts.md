# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---

## Prompt 1

**Modelo:** Opus 5.5 xMedium
**Herramienta:** Claude Code

```
contrasta las reglas con los últimos 15 commits del repositorio y el estado actual de los archivos del proyecto. Crea una tabla con 5 columnas, usa una fila por regla y completa estas cinco columnas

Qué pide la regla. Resúmela en una frase y con tus propias palabras. Si necesitas varias frases, puede que estés mezclando más de una regla.

Qué se revisó para comprobarla. Indica el comando ejecutado o el archivo consultado. Sin esta información no hay forma de saber en qué se apoya el veredicto.

Veredicto. Solo puede ser se cumple, no se cumple o no se puede comprobar con la información disponible. Este último caso también es un resultado válido. Significa que la regla no deja suficiente evidencia para verificarla.

Evidencia. Escríbela en una línea. Si la regla no se cumple, indica dónde se incumple. Si no se puede comprobar, explica qué información falta.

Qué harías con ella. Elige una opción: dejarla, borrarla o convertirla en una comprobación automática.

Guarda el resultado en docs/auditoria/ogm.md

```

**Qué salió:** funcionó a la primera.
