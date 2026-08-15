# Cablenoticias — ficha de orientación

| | |
|---|---|
| **Valor propuesto** | **0,00** — orientación mixta por Regla 2 |
| **Firma** | ☐ sin firmar |
| **Fecha** | 2026-08-14 (**alta**, autorizada por Jose) |
| **Protocolo** | `PROTOCOLO_JUICIO_EDITORIAL.md` |
| **Ámbito** | Nacional (canal de televisión por suscripción, Bogotá) |
| **Feed** | `cablenoticias.com/rss` — 50 ítems, **15 de 15 en ventana**, 15 con imagen, mediana 7,9 h |

---

## LA DECISIÓN DE PRODUCTO QUE LO BLOQUEABA, Y LO QUE LA MEDIDA DICE

El barrido del 12 de agosto lo dejó anotado así: *«Cablenoticias publica cada hora,
y es el canal donde emite Noticias Uno, que hoy aporta cero artículos.»* La duda de
fondo era si darlo de alta **duplicaría** a un medio que ya está en el catálogo.

**No lo duplica, y esto sí se puede comprobar.** Su RSS trae **50 ítems**, el
último del **14-08-2026 a las 23:29 UTC**, con agenda nacional propia —la explosión
en la mina de Cucunubá, los créditos exprés del Valle tras el terremoto, el cierre
del colegio de Cajicá, las excarcelaciones en Venezuela— y **firmas de casa con
correo corporativo**: `jeyson.calderon@cablenoticias.tv`,
`miguel.rodriguez@cablenoticias.tv`, `pracweb2@cablenoticias.tv`, más
colaboradores externos.

**Es una redacción propia produciendo texto propio**, no la web de un noticiero
ajeno. Noticias Uno alquila espacio de emisión; eso no hace que sus artículos sean
los mismos. **La decisión de producto queda resuelta a favor de tratarlos como dos
medios**, pendiente de que Jose la confirme.

> **Lo que NO resuelve:** Noticias Uno sigue aportando cero artículos, y esta alta
> no lo arregla. Son dos problemas distintos que la nota del barrido había juntado.

---

## EVIDENCIA ADMISIBLE

### Nivel 1 — Quién lo edita, hoy

| Dato | Valor | Fuente |
|---|---|---|
| Sociedad | **CABLE NOTICIAS TV S.A.S.**, Bogotá (Av. Cra. 28 n.º 36-41) | MOM Colombia |
| **Sociedad última** | **Registrada en PANAMÁ** | MOM Colombia |
| Accionistas **documentados en 2018** | **Alberto Federico Ravell** y **Tobías Carrero Nácar**, venezolanos, al 100 % entre los dos | MOM Colombia |
| Junta directiva (2018) | Tobías Carrero Nácar (presidente), Rafael Andrés Carrero (su hijo), Jesús Ramírez (yerno de Ravell) | ídem |
| Representante registrado | José Raúl Serna Quintero, VP de Global Media Telecomunicaciones S.A. | ídem |
| Fundación y venta | Fundado en 2007 por **Juan Gonzalo Ángel Restrepo**, vendido en **agosto de 2011** por **US$ 17 millones** | Portafolio, Semana |
| **NIT** | **no publicado** | — |
| **Quién lo controla HOY** | **no consta** | — |

### Aquí todo está documentado, y todo es viejo

Es el caso contrario al de las demás altas recientes. En los regionales no aparece
ni un nombre; aquí hay estructura societaria completa —accionistas, junta,
parentescos— y **la fuente que la trae declara su última actualización el
14-03-2018**. La operación que la origina es de **2011**.

**Por eso entra con `ownerType: null` y no con un tipo asignado.** Con un tipo, la
interfaz le afirmaría al lector que hoy lo controlan dos empresarios venezolanos, y
eso no consta: consta que lo controlaban. Es **la regla del presente por cuarta vez**
—tras Semana, EL DIARIO y El Nuevo Día— y la segunda que sirve para *no* afirmar
algo en vez de para quitarlo.

**Y la sociedad última está en Panamá**, jurisdicción sin registro público de
accionistas: el hilo se corta por diseño, no por falta de búsqueda. Es el muro de
Pulzo, con la diferencia de que allí las fuentes se contradecían y aquí coinciden
pero están caducadas.

### Lo que NO se hace con esto, y conviene dejarlo escrito

**No se le deduce orientación de la biografía política venezolana de sus dueños.**
Ravell fue director de Globovisión y fundador de La Patilla, con oposición
documentada a Chávez. Trasladar eso al eje colombiano sería la misma traslación sin
justificar que el catálogo tiene pendiente con sus trece medios internacionales — y
además sobre una propiedad de hace ocho años.

**Y no es un «medio internacional».** Ese `ownerType` significa sede fuera de
Colombia y agenda editorial extranjera; este canal tiene redacción en Bogotá, firmas
colombianas y agenda colombiana. Los extranjeros son los dueños, no el medio.
Etiquetarlo así lo habría echado al mismo saco que el cable extranjero.

### Redacción propia

Al menos dos periodistas con correo corporativo firman en el feed
(`jeyson.calderon@cablenoticias.tv`, `miguel.rodriguez@cablenoticias.tv`), más
colaboradores externos.

### Su web no se puede auditar por rutas, y hay que decirlo

**`cablenoticias.tv` devuelve exactamente 220 175 bytes para cualquier ruta**,
incluidas `/politica-de-privacidad`, `/programacion` y una inventada
(`/ruta-inventada-zzz`). Es una aplicación de página única que sirve el mismo
bundle y resuelve el contenido en el navegador.

**Consecuencia práctica:** quien pruebe sus páginas institucionales con `curl` verá
200 en todas y creerá haberlas leído. Es el caso de Quindío Noticias, y aquí la
comparación de tamaños lo detecta de inmediato porque son idénticos. Para leer sus
páginas haría falta ejecutar JavaScript, que es fuera del alcance de este trabajo.

---

## LAS DOS TRAMPAS DE LA URL, PORQUE LAS DOS CALLAN CUANDO FALLAN

1. **Es `/rss`, no `/feed/`.** Las dos responden 200 y `/feed/` devuelve **cero
   ítems**: sirve el bundle de la SPA. Quien lo «corrija» a la forma habitual de
   WordPress deja al medio sin entrar y sin error.
2. **Es `cablenoticias.com`, no `.tv`.** El canal usa los dos dominios y el `.tv`
   sirve el feed igual, pero **los artículos y las 50 imágenes viven en el `.com`**.
   Se dio de alta primero con `.tv` y **lo cazó `check:feeds`**: «los enlaces
   apuntan a cablenoticias.com». Con el dominio cruzado habrían fallado a la vez la
   resolución del medio y la CSP de imágenes.

## LO QUE QUEDA ABIERTO

1. **Certificado de la Cámara de Comercio de Bogotá** para CABLE NOTICIAS TV
   S.A.S.: NIT, composición accionaria actual y estado de la matrícula. Es el
   **undécimo certificado pendiente** del catálogo y aquí es el *único* documento
   que puede cerrar la ficha, porque la vía societaria termina en Panamá.
2. **La ficha del canal ante el MinTIC** como operador de televisión por
   suscripción, que sí tiene titular público. Es la pista que funcionó con The
   Archipielago Press y su licencia de Radio Archipiélago.
3. **El valor de sesgo**, cuando haya corpus propio. Hoy entra en 0,00 por Regla 2.
4. **Noticias Uno sigue aportando cero**, y esta alta no lo arregla: eran dos
   problemas juntados en una frase del barrido.
