# Evidencias — TP1

## 1. Push directo a main rechazado
<img width="692" height="615" alt="image" src="https://github.com/user-attachments/assets/e450cc34-8f7c-4ce2-9c8d-5633389783fb" />

GitHub rechaza el push porque main está protegida y la regla alcanza también al dueño del repo.

## 2. El PR de la rama B no se puede mergear: conflicto
<img width="1600" height="771" alt="image" src="https://github.com/user-attachments/assets/0c3e01cf-1b80-4c3a-9fb2-3a03dcdb6d98" />

GitHub rechaza el merge de la rama B porque hizo cambio en el mismo sitio que la rama A 

##3. Se visualiza el conflicto especifico
<img width="910" height="645" alt="image" src="https://github.com/user-attachments/assets/986d0c66-17c4-4354-b360-a583eda4c176" />

GitHub muestra donde esta el conflicto: la version actual y la que se encuentra en main junto con marcadores/fronteras.

##4. Se visualiza la release 
<img width="950" height="838" alt="image" src="https://github.com/user-attachments/assets/2cec358f-d790-4d11-a725-118cae14aa25" />

La release le agrega comunicación al tag v1.0.0 que marca un commit

---

## TP2 — Evidencias de Ejecución y Contenerización

### 1. Salida de `docker compose up -d` y Sistema Funcionando
```
 ✔ Network finfix_default       Created
 ✔ Volume "finfix_db_data"      Created
 ✔ Container finfix-db-1        Healthy
 ✔ Container finfix-backend-1   Started
 ✔ Container finfix-frontend-1  Started
```
- Sistema corriendo end-to-end en `http://localhost:3000`.

### 2. Prueba de Persistencia de Datos
- **`docker compose down` / `up -d`**: Los datos persisten intactos en el volumen PostgreSQL `db_data`.
- **`docker compose down -v`**: Destruye el volumen `db_data` e inicializa la base de datos a cero.

### 3. Comparación de Tamaños de Imagen (Multi-stage vs Base)
- **Backend (`finfix-backend:dev`)**: **200 MB** *(multi-stage node:20-alpine)*.
- **Frontend (`finfix-frontend:dev`)**: **93 MB** *(multi-stage nginx:alpine)*.

### 4. Imágenes Publicadas en GitHub Container Registry (`ghcr.io`)
- **Backend**: `ghcr.io/bistolfibri/finfix-backend:v0.1.0` *(Visibilidad: Pública)*.
- **Frontend**: `ghcr.io/bistolfibri/finfix-frontend:v0.1.0` *(Visibilidad: Pública)*.

