# Mis finanzas — instalación (≈10 minutos, una sola vez)

## 1. Conectar la Google Sheet (Apps Script)
1. Abre tu Sheet «Mis finanzas» → Extensiones → Apps Script.
2. Borra lo que haya y pega todo el contenido de `apps-script.gs`.
3. Cambia `CAMBIA-ESTE-CODIGO` por un código secreto tuyo (letras y números).
4. Implementar → Nueva implementación → tipo «Aplicación web».
   - Ejecutar como: Yo
   - Quién tiene acceso: Cualquier persona
5. Autoriza los permisos que pida Google y copia la URL que termina en `/exec`.

## 2. Publicar la app (gratis)
Opción más simple: entra a https://app.netlify.com/drop, crea cuenta gratis y arrastra la carpeta `app-finanzas`. Te dará una dirección https. (Cloudflare Pages o GitHub Pages también sirven.)

## 3. Instalar en el iPhone
Abre la dirección en Safari → Compartir → «Añadir a pantalla de inicio».

## 4. Configurar dentro de la app
Ajustes → «Conexión con Google Sheet»: pega la URL `/exec` y el código secreto → Probar conexión → Guardar ajustes.

## 5. Pasar tus datos actuales
En la app vieja: Ajustes → Copiar respaldo. En la nueva: Ajustes → Restaurar respaldo → pega → Restaurar ahora. (Los movimientos ya enviados a la Sheet no se duplican.)
