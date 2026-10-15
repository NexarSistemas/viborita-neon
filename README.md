# Viborita Neón — Arcade Edition v1.0.0 (candidata)

Juego HTML/CSS/JavaScript sin dependencias ni backend.

## Probar en la computadora

Abrí `index.html` directamente para jugar. Para **probar la PWA y el modo offline**, iniciá un servidor local dentro de esta carpeta:

```bash
python3 -m http.server 8000
```

Visitá http://localhost:8000 desde la computadora. La instalación y el service worker requieren `localhost` o un sitio servido por HTTPS (por ejemplo, GitHub Pages); no funcionan desde `file://`.

## Repositorio y licencia

Repositorio previsto: https://github.com/NexarSistemas/viborita-neon

Licencia MIT, consultar `LICENSE`.

## Publicar en GitHub Pages

1. Crear un repositorio público y subir **el contenido** de esta carpeta a la rama principal.
2. Ir a Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`.
3. Abrir la URL HTTPS de Pages. La aplicación podrá instalarse desde el navegador compatible.

## Datos

El ranking y los logros se guardan en el almacenamiento local del navegador. No se suben a un servidor. Borrar datos del sitio los elimina. El desafío diario usa la fecha de Argentina; el resultado se guarda solo localmente, por lo que no constituye una competencia global verificada.

## Validaciones antes de etiquetar v1.0.0 estable

- Campaña: completar niveles 1, 2 y 3; muerte por obstáculos, cuerpo y límites.
- Modos infinito y diario, las tres dificultades y puntuación.
- Poderes, su expiración y pausa; controles táctiles y teclado.
- Ranking, logros y persistencia tras cerrar/reabrir.
- Probar instalación y funcionamiento offline en Android y en escritorio, desde HTTPS.

**Estado:** candidata para pruebas. El repositorio y GitHub Pages deben crearse y habilitarse antes de afirmar que está publicada.

## Ajuste de controles (RC 1.0.1)

Al iniciar se enfoca el tablero y se libera el foco del selector o campo del jugador. Durante una partida, las flechas y WASD se procesan aunque hubiera quedado enfocado un campo de texto. Se mantiene la cola de direcciones y la protección contra giros de 180°.
