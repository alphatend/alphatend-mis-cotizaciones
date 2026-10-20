# Mis cotizaciones · demo de alphatend

Una página para probar cómo funcionaría «✓ Ya coticé» en el tablero de alphatend. Marcas la compra en la que
ofertaste y alphatend la sigue: cuando PanamaCompra abre las ofertas, te dice quién ofertó, a cuánto y en qué lugar
quedaste, y cuando sale la resolución, a quién se adjudicó.

- **Es el tablero de verdad.** El HTML y las hojas de estilo son los compilados de alphatend.com (`assets/`), sin su
  JavaScript. Las filas se pintan con el mismo marcado del producto, y el cuadro de ofertas, con el de la ficha de un
  proceso.
- **Las tres compras del tablero son de ejemplo**, con empresas inventadas. Los botones morados adelantan el tiempo.
- **«Pruébalo con una de tus cotizaciones»** lee en vivo, desde el navegador, el pliego y el cuadro de propuestas de la
  API pública de PanamaCompra (`apisv3.panamacompra.gob.pa`). Del pliego no se guardan los datos de contacto.
- Lo que se marca se queda en el navegador (`localStorage`). No hay servidor.

`index.html` lo genera un script a partir del tablero compilado; lo propio de la demo está en `demo.js`, `demo.css` y
`piezas/`.
