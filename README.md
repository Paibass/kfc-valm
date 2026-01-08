# KFC Liniers – VALM Ticket Scanner

Aplicación web para **digitalizar tickets de VALM (Venta a la Mesa)** mediante OCR y almacenar la información estructurada en una planilla de Google Sheets.

La herramienta reemplaza el registro manual del libro de VALM, optimizando tiempos operativos y reduciendo errores de carga.

---

## Descripción general

La aplicación funciona íntegramente del lado del cliente y permite:

- Capturar imágenes de tickets desde dispositivos móviles
- Extraer datos relevantes mediante OCR
- Validar y corregir la información detectada
- Persistir los registros en un soporte centralizado

No requiere backend propio ni servicios pagos.

---

## Alcance funcional

El sistema procesa tickets impresos y obtiene los siguientes datos:

- Fecha del ticket  
- Identificador de transacción (últimos 4 dígitos del CHK)  
- Cajero/a (seleccionado desde un conjunto controlado de cajeros actuales)  
- Detalle de la venta (normalizado)  
- Total de la operación  

Todos los campos son editables antes de confirmar el guardado.

---

## Estrategia de carga de datos

- El texto detectado por OCR **no se considera confiable automáticamente**
- La aplicación:
  - autocompleta campos cuando es posible
  - permite corrección manual en todos los casos
- El cajero se selecciona desde un `<select>` para evitar inconsistencias

El envío se realiza mediante una solicitud `POST` a Google Forms (`no-cors`).

---

## Estrategia de OCR

- OCR ejecutado localmente con **Tesseract.js**
- Preprocesamiento de imágenes:
  - redimensionado
  - escala de grises
  - mejora de contraste
- Detección basada en **patrones**, no en palabras clave fijas:
  - formatos de fecha
  - valores monetarios
  - identificadores alfanuméricos

Este enfoque mejora la tolerancia a errores de OCR y variaciones en el formato del ticket.

---

## Normalización de cajeros

- Existe un conjunto predefinido de cajeros activos
- El OCR intenta detectar coincidencias parciales sobre:
  - nombre
  - apellido
  - combinaciones alfanuméricas
- La selección final queda siempre bajo control del usuario

Esto garantiza consistencia en los datos almacenados.

---

## Interfaz de usuario

- Diseño **mobile-first**
- Flujo de uso reducido:
  1. Captura de imagen
  2. Escaneo
  3. Validación
  4. Guardado
- Consola interna para visualizar el texto OCR
- Pensado para uso operativo frecuente

---

## Deploy

- Framework: **Next.js (App Router)**
- Hosting: **Vercel**
- Ejecución completamente del lado del cliente
- Sin capa de backend propia

---

## Limitaciones

- La precisión del OCR depende de:
  1. calidad de la imagen
  2. iluminacion
  3. estado fisico del ticket

---

## Uso previsto

- Herramienta de uso interno para el registro de tickets VALM.
- 
  
