# 🐍 Viborita Neón — Arcade Edition

Juego arcade con estética neón, desarrollado en **HTML, CSS y JavaScript puro**, sin frameworks, cuentas ni backend.

🎮 **Jugar:** https://nexarsistemas.com.ar/viborita-neon/

## Características

- Campaña de tres niveles, modo infinito y desafío diario.
- Dificultades tranquilo, normal y experto.
- Bonus, escudo, cámara lenta y multiplicador de puntos.
- Ranking de diez partidas y seis logros, guardados **solo en este dispositivo**.
- Teclado (flechas o WASD), controles táctiles y gestos.
- Instalación como PWA y juego sin conexión tras guardar sus recursos.

> El desafío diario utiliza una fecha de Argentina para generar su escenario. No hay ranking global, sincronización ni verificación remota de resultados.

## Jugar localmente

Para una partida rápida podés abrir `index.html`. Para probar instalación y modo offline, serví la carpeta por HTTP local:

```bash
python3 -m http.server 8000
```

Abrí http://localhost:8000. La PWA requiere **HTTPS o localhost**; no se puede probar el Service Worker mediante `file://`.

## Instalación

Desde la URL pública en un navegador compatible, abrí el menú del navegador y elegí **Instalar aplicación** (la opción concreta depende del dispositivo). Una vez cargados los recursos, la PWA puede seguir ejecutándose sin conexión.

## Datos y privacidad

El ranking, las estadísticas de logros y los récords se guardan en `localStorage` del navegador. No se envían a ningún servidor. Si se borran los datos del sitio, esos registros se pierden.

## Estado del lanzamiento

**v1.0.1 RC — candidata a estable.** La instalación en Android y el funcionamiento offline ya se comprobaron manualmente. Antes de publicar el tag `v1.0.1`, queda pendiente completar la matriz de pruebas en [TESTING.md](TESTING.md) y resolver únicamente fallos reproducibles.

### Pruebas locales

```bash
node --check tests/smoke.mjs
node --test tests/smoke.mjs
```

Las pruebas automáticas cubren estructura y recursos estáticos; no sustituyen las pruebas de jugabilidad en navegador.

## Licencia

MIT © 2026 Nexar Sistemas. Ver [LICENSE](LICENSE).
