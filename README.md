# 🍗 KFC Liniers – VALM Scanner

Aplicación web mobile-first desarrollada para optimizar la carga de tickets de **Venta a la Mesa (VALM)**, reemplazando procesos manuales por una solución digital rápida, consistente y orientada a uso real en operación.

---

## 🧠 Problemática

En el contexto operativo, los tickets de VALM se registraban manualmente en papel, lo que generaba:

- Pérdida de tiempo
- Errores humanos
- Dificultad para analizar ventas
- Falta de estructura en los datos

---

## 💡 Solución

Se desarrolló una webapp que permite:

- Cargar tickets de forma rápida desde el celular
- Seleccionar productos mediante botones
- Calcular automáticamente el total
- Guardar los datos en una hoja de cálculo centralizada

---

## 📱 Flujo de uso

1. Definir sesión:
   - Fecha
   - Cajero

2. Por cada ticket:
   - Ingresar CHK (últimos 4 dígitos)
   - Seleccionar categoría
   - Agregar productos con taps
   - Verificar total
   - Guardar

3. Continuar con el siguiente ticket sin reiniciar sesión

---

## 📊 Almacenamiento y análisis

Todos los datos se almacenan en **Google Sheets**, lo que permite:

- Visualizar ventas diarias
- Analizar rendimiento por cajero
- Obtener métricas por producto
- Centralizar la información en tiempo real

---

## 🧾 Estructura de datos

Cada ticket incluye:

- Fecha  
- CHK  
- Cajero  
- Detalle normalizado  
- Total  
- Timestamp  

---

## 📦 Gestión de productos

Los productos se gestionan mediante un archivo externo:

```
/products.json
```

Esto permite:

- Modificar precios sin tocar código
- Escalar el menú fácilmente
- Mantener la UI desacoplada de la lógica

---

## 🏗 Arquitectura

- Frontend: Next.js (App Router)
- UI: React (client-side)
- Deploy: Vercel
- Backend liviano: Google Apps Script
- Base de datos: Google Sheets

---

## 🎨 Diseño UX/UI

- Mobile-first
- Interfaz táctil optimizada
- Botones grandes para carga rápida
- Flujo sin fricción
- Estética inspirada en KFC

---

## ⚙️ Decisiones técnicas clave

- Uso de selección guiada para asegurar consistencia
- Persistencia de sesión con localStorage
- Uso de Sheets como base de datos ligera

---

## 📈 Impacto

- Reducción significativa del tiempo de carga
- Eliminación de errores manuales
- Datos estructurados desde el origen
- Mejora en el análisis de ventas

---

## 📍 Estado

Aplicación funcional en producción para uso interno.

---

## 👨‍💻 Autor

Proyecto desarrollado como solución real a una necesidad operativa, combinando desarrollo web, UX y automatización de procesos.


  
