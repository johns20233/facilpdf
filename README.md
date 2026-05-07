# FácilPDF

Web app para convertir JPG/PNG a PDF, unir PDF + imágenes y comprimir documentos para páginas que piden archivos livianos.

## Estructura

- `frontend/` página web HTML, CSS y JavaScript.
- `backend/` API FastAPI en Python para procesar archivos.

## Probar en tu PC

### 1. Instalar Python
Instala Python 3.11 o superior.

### 2. Abrir terminal en la carpeta backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

El backend abre en:
```txt
http://localhost:8000
```

### 3. Abrir la web
Abre este archivo en tu navegador:
```txt
frontend/index.html
```

## Publicar en internet

### Backend en Render
1. Crea cuenta en Render.
2. New Web Service.
3. Conecta GitHub.
4. Root directory: `backend`.
5. Build command:
```bash
pip install -r requirements.txt
```
6. Start command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
7. Copia tu URL, ejemplo:
```txt
https://facilpdf-api.onrender.com
```

### Frontend en Vercel o Netlify
1. Sube la carpeta `frontend`.
2. Antes de usar, abre la consola del navegador o cambia `app.js` y reemplaza:
```js
const API_URL = localStorage.getItem("FACILPDF_API") || "http://localhost:8000";
```
por:
```js
const API_URL = "https://facilpdf-api.onrender.com";
```
3. Publica.

## Plan gratis y premium

Gratis:
- JPG a PDF.
- Unir PDF.
- Unir PDF + JPG.
- Compresión básica.

Premium futuro:
- OCR.
- Archivos más pesados.
- Sin anuncios.
- Procesamiento más rápido.
- Stripe o PayPal.

## Importante sobre 1 MB

No siempre es posible bajar cualquier PDF a menos de 1 MB sin perder mucha calidad, especialmente si tiene muchas fotos escaneadas. Esta app reduce imágenes y reescribe el PDF para intentarlo.
