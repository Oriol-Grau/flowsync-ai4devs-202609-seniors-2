## Prompt 1

**Modelo:** Sonnet 5.5 xHigh
**Herramienta:** Claude Code

```
openspec/specs/tasks/spec.md esta spec contiene el requirement "Lo que cada tarea muestra de su responsable". 
Crea una matriz de trazabilidad de este requerimiento y revisa scenario a scenario, si cada uno tiene un test que lo cubre, en el siguiente formato:

Una fila por scenario y cuatro columnas. Encima, dos números: cuántos scenarios tiene el requisito y cuántos resultaron cubiertos — el primero se anota al empezar, el segundo al terminar.

1. El scenario, en una línea. Qué se espera y en qué situación. Si no cabe en una línea, es que estás juntando dos.

2. Qué test lo cubre, con el nombre exacto que aparece en la suite. Sin el nombre concreto, la columna va vacía: "seguro que algo lo cubre" no es una fila.

3. Cubierto · No cubierto · No lo sé. Los tres estados son válidos, y el tercero no es un fallo: es el resultado más informativo de los tres.

4. Si pusiste "no lo sé", qué te faltó para decidirlo. Media línea. Suele ser una de dos: no encontraste dónde se comprueba, o encontraste algo que se le parece y no dice exactamente lo mismo.

Guarda la matriz en un archivo en la siguiente ruta: docs/verificacion/ogm.md

```

**Qué salió:** funcionó a la primera

## Prompt 2

**Modelo:** Sonnet 5.5 xHigh
**Herramienta:** Claude Code

```
Escribe los tests para los escenarios que contiene "no cubierto" de la matriz que acabas de crear en la siguiente ruta: \backend\tests\functional\tasks

Sigue el estilo de los que ya existen en el proyecto. Sin tocar nada fuera de la carpeta de tests.

```

**Qué salió:** funcionó a la primera