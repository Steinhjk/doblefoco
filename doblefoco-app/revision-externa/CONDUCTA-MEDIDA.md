# La conducta medida, y por qué hoy casi no discrimina

> **AVISO DEL 2026-08-18.** Lo que sigue describe la medición del **2026-08-12**,
> con una ventana que estaba dominada por el terremoto. Los envíos del ciclo 1
> llevan dentro una medición **nueva, del 2026-08-17**, con ventana del 14 al 17
> — los días del hecho ya han salido de las 72 horas de retención—. Las cifras
> que algunas fichas llevan copiadas en su texto son las viejas; **cuando no
> coincidan, manda la que va en el envío**. Recalcular en cualquier momento:
> `npm run conducta -- --todos --json=data/conducta.json`.
>
> Todo lo demás de este archivo —qué miden las tres cifras y por qué apenas
> discriminan— sigue en pie, y es la parte que importa.

Medición del **2026-08-12** sobre el corpus entero de la base: 6 900 artículos y
5 592 historias, con ventana de retención de 72 h — o sea **del 2026-08-09 al
2026-08-12**.

Se anota aquí, una vez, porque las tres cifras que lleva cada ficha en su nivel 2
salen de aquí y **tienen una limitación común que hay que leer antes de leerlas**.

> **Las cifras de las fichas son una foto, y la ventana se mueve.** La retención es
> de 72 horas rodantes y la ingesta corre cada media hora, así que el corpus cambia
> solo: entre dos ejecuciones separadas por una hora, la agenda propia de La FM pasó
> del 22 % al 33 % porque una de sus nueve historias dejó de ser compartida al caerse
> la pieza del otro medio. **Con corpus pequeño, las proporciones bailan.** Las
> cifras copiadas en cada ficha son las del 2026-08-12 y no van a coincidir al
> decimal si se recalculan; lo que no cambia es el orden de magnitud, y es lo único
> que se usa. Recalcular: `npm run conducta`.

---

## Las tres cifras, y qué significan

| Cifra | Cómo se calcula |
|---|---|
| **Agenda propia** | Porcentaje de sus historias en las que es el único medio del catálogo |
| **Compañía media** | Sesgo medio de los OTROS medios con los que comparte historia |
| **Coincide con** | Los tres medios con los que más historias comparte |

Ninguna mide el contenido de lo que publica. Miden **con quién coincide**, que es
un dato observable y no depende de que nadie declare el sesgo de nadie — el mismo
razonamiento de `scripts/coCoverage.mjs`.

---

## LO QUE INVALIDA CASI TODA LECTURA: son tres días, y son *estos* tres días

**Tres días no son conducta.** El protocolo pide 90 días y más de 60 historias
propias para que el nivel 2 cuente. Ninguna de las cifras de estas fichas cumple
eso, ni la de los medios con 600 artículos.

Y el corpus está **dominado por el terremoto**: 2 505 de 6 900 artículos —el 37 %—
caen en desastres. En un hecho así **todos los medios cubren lo mismo**, así que
la co-cobertura mide la catástrofe antes que la línea editorial. Es el peor
momento posible para inferir orientación de con quién coincide alguien.

## Y hay algo peor, que es estructural y no pasa con el tiempo

**La compañía media de los veinte medios va de +0,08 a +0,19.** Todos. El más
«acompañado por la izquierda» y el más «acompañado por la derecha» se separan
once centésimas, y ninguno baja de cero.

Eso no dice que los veinte sean iguales: dice que **la métrica está saturada**.
Si el 22,6 % de los medios del catálogo son de izquierda pero producen el 3,3 %
del volumen, entonces coincidir con «el catálogo» es casi lo mismo que coincidir
con la derecha, para cualquiera. La compañía media de El Espectador (−0,20) es
+0,191 y la de La FM (+0,35) es +0,082: **el orden sale al revés del esperado**, y
la explicación más simple no es que El Espectador sea de derecha, sino que un
medio de gran volumen coincide con todo el mundo y hereda la media del corpus.

**Conclusión para el revisor externo:** si una ficha usa la compañía media como
argumento para mover un número, **eso es una objeción válida contra la ficha**. La
cifra está para dejar constancia de la medición y de su fecha, no para decidir.

---

## Lo que sí se puede leer hoy

- **La agenda propia** es menos frágil, porque no depende del sesgo de nadie: un
  92 % (Infobae) frente a un 22 % (La FM) es una diferencia real de
  comportamiento — publicar mucho de lo que nadie más publica, o solo lo que ya
  cubren todos.
- **El volumen**, que destapa desequilibrios de otro tipo: Infobae Colombia
  aporta 1 742 artículos y Noticias Caracol 21. El catálogo no pesa lo que la
  audiencia dice que pesan sus medios.
- **Los ceros.** CNN en Español y Noticias Uno aportan **cero artículos**: no
  tienen feed configurado. De ellos no hay nivel 2 ni lo habrá hasta que entren
  en ingesta, y sus fichas lo dicen.

---

## La fecha en que esto empieza a valer

**2026-11-10**, noventa días desde el 2026-08-12. Antes de eso, cualquier
argumento de nivel 2 en estas fichas es provisional por construcción, y así está
escrito en cada una.

Se puede reproducir el cálculo en cualquier momento; el script vivió en el
scratchpad de la sesión y las cifras están copiadas en cada ficha con su fecha.
