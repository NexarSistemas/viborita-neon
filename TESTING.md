# Verificación para publicar v1.0.0

Marcar un caso como aprobado solo si se probó. No borrar almacenamiento local durante la prueba de persistencia. Registrar dispositivo, navegador y fecha.

## Campaña
- [ ] La primera pulsación de flechas/WASD responde desde el inicio sin exigir clic adicional
- [ ] La cola de giros no permite invertir 180° ni perder giros rápidos
- [ ] La comida aparece en una celda libre y alcanzable
- [ ] Nivel 1: los bordes transportan a la pared opuesta
- [ ] Nivel 2 y 3: colisión con paredes, cuerpo y bloques termina la partida
- [ ] Al pasar del nivel 1 al 2 y del 2 al 3 no se generan trampas inevitables ni comida aislada
- [ ] La campaña termina al completar las 30 frutas

## Modos, puntos y datos
- [ ] Infinito: continúa después de los cambios de nivel
- [ ] Diario: mismo escenario al reiniciar el mismo día; la fecha cambia en el día siguiente
- [ ] Las dificultades alteran la velocidad sin alterar el control
- [ ] El récord solo se anuncia como nuevo cuando supera el anterior del mismo modo/dificultad
- [ ] Ranking y logros permanecen tras cerrar y volver a abrir
- [ ] Borrar datos los elimina solo tras confirmación

## Poderes y temporizadores
- [ ] Estrella, escudo, cámara lenta y puntos dobles funcionan según sus descripciones
- [ ] Al usar escudo contra muro o bloque, no aparecen movimientos inesperados o muertes inevitables
- [ ] Pausa detiene vida del bonus y duración de efectos
- [ ] Cambiar de pestaña pausa y volver no adelanta artificialmente varios movimientos
- [ ] Reiniciar desde pausa y abrir/cerrar ranking no deja superposiciones bloqueadas

## PWA
- [ ] Carga por HTTPS desde https://nexarsistemas.com.ar/viborita-neon/
- [ ] Instalación Android sin errores
- [ ] Abrir una vez con internet, cerrar, activar modo avión y reiniciar la aplicación instalada
- [ ] Verificar actualización tras nueva publicación sin borrar el ranking
- [ ] Verificar también teclado de escritorio y al menos un navegador móvil

## Hallazgos por investigar

- **Escudo:** la colisión consume el escudo y congela brevemente la serpiente en la misma celda. Verificar si permite evitar el siguiente impacto; modificarlo solo si se demuestra un fallo.
- **Alcanzabilidad:** la generación de obstáculos valida la región alcanzable ignorando temporalmente el cuerpo, que sí participa en la colisión real. Probar transiciones con serpiente larga y comida próxima.
- **Rendimiento inicial:** la pequeña demora comunicada en Android no está medida; no optimizar a ciegas.

## Criterio para el release

Publicar `v1.0.0` únicamente tras superar las pruebas bloqueantes y comprobar que la web sirve la misma versión que `main`. El tag debe apuntar a un commit validado y el release describir características, instalación y privacidad.
