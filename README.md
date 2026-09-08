# Reto 1: Microservicios CRUD


# 1. Descripción del reto

Sistema CRUD para administrar dos dominios: `startups` y `technologies`. La solución está dividida en ocho microservicios por acción, un API Gateway Nginx, PostgreSQL y un frontend React.

# 2. Objetivo de la solución

Permitir crear, consultar, filtrar, actualizar y eliminar startups y tecnologías mediante HTTP y desde una interfaz web. El frontend consume únicamente el gateway. No se implementa autenticación.

# 3. Arquitectura

```text
[ Frontend React :5173 ]
     |
     v
[ API Gateway Nginx :8080 ]
  |                         |
  v                         v
[Create][Read][Update][Delete]  [Create][Read][Update][Delete]
     Startups                    Technologies
  |                         |
  +------------+------------+
          v
        [ PostgreSQL :5432 ]
```

El gateway solo enruta las solicitudes. Cada microservicio tiene su propio contenedor, puerto y conexión a la base compartida.

## 4. Tecnologías utilizadas

- Node.js 20 y Express para los microservicios.
- React 19 y Vite para el frontend.
- Nginx como API Gateway.
- PostgreSQL 16 como base de datos.
- Docker Compose para ejecutar todo el sistema.
- Postman para las pruebas manuales.

# 5. Estructura del proyecto

```text
reto1/
├── docker-compose.yml
├── gateway/
├── services/
│   ├── startups/create
│   ├── startups/read
│   ├── startups/update
│   ├── startups/delete
│   ├── technologies/create
│   ├── technologies/read
│   ├── technologies/update
│   └── technologies/delete
├── db/migrations/
├── db/seed.sql
├── frontend/
├── postman/
├── capturas/
└── evidencias/
```

# 6. Requisitos previos

- Docker Desktop.
- Docker Compose.
- Postman para pruebas manuales.
- Node.js 20 solo si se ejecuta el frontend fuera de Docker.
- PowerShell, curl o una herramienta equivalente para comprobaciones rápidas.

# 7. Variables de entorno

El archivo `.env.example` de la raíz contiene la configuración completa de referencia. Para el frontend existe además `frontend/.env.example`.

Los servicios backend utilizan estas variables:

env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=reto1
DB_USER=postgres
DB_PASSWORD=postgres

El frontend usa:
env
VITE_API_BASE_URL=http://localhost:8080/v2/api


# 8. Instrucciones exactas para levantar localmente

Desde la raíz del proyecto:

powershell
copy .env.example .env
docker compose up -d --build
docker compose ps


Verificar que los contenedores aparezcan como `healthy`. Después abrir `http://localhost:5173` y probar el gateway. Para detener y eliminar también el volumen de PostgreSQL:

```powershell
docker compose down -v
```

## 9. URLs y puertos

- Frontend: `http://localhost:5173`
- Gateway: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- API base para Postman: `http://localhost:8080/v2/api`

Health checks:

- Gateway: `GET http://localhost:8080/status` devuelve `{ "status": "ok" }`.
- Microservicios: cada servicio expone `GET /health` en su puerto interno.
- Compose usa `healthcheck` para PostgreSQL, los ocho servicios, gateway y frontend.

Puertos internos:

| Servicio | Puerto |
|---|---:|
| CreateStartupService | 8001 |
| DeleteStartupService | 8002 |
| ReadStartupService | 8003 |
| UpdateStartupService | 8004 |
| CreateTechnologyService | 8005 |
| DeleteTechnologyService | 8006 |
| ReadTechnologyService | 8007 |
| UpdateTechnologyService | 8008 |

## 10. Contratos de API

La versión recomendada es `v2`, que valida campos, permite filtros y devuelve propiedades en `camelCase`. Las rutas `v1` se conservan para compatibilidad.

### Startups

```text
POST   /v2/api/startups/create
GET    /v2/api/startups/read
GET    /v2/api/startups/read/:id
PUT    /v2/api/startups/update/:id
DELETE /v2/api/startups/delete/:id
```

Filtros:

```text
GET /v2/api/startups/read?name=Tech
GET /v2/api/startups/read?category=Fintech
```

Body de startup:

```json
{
  "name": "OpenAI Ventures",
  "foundedAt": "2018-03-20",
  "location": "Ciudad de Mexico",
  "category": "AI",
  "fundingAmount": 2500000
}
```

### Technologies

```text
POST   /v2/api/technologies/create
GET    /v2/api/technologies/read
GET    /v2/api/technologies/read/:id
PUT    /v2/api/technologies/update/:id
DELETE /v2/api/technologies/delete/:id
```

Filtros:

```text
GET /v2/api/technologies/read?sector=Healthcare
GET /v2/api/technologies/read?adoptionLevel=Alto
```

Body de technology:

```json
{
  "name": "Computer Vision",
  "sector": "Healthcare",
  "description": "Tecnologia para analizar imagenes medicas",
  "adoptionLevel": "Alto"
}
```

Códigos esperados:

- `201 Created`: creación correcta.
- `200 OK`: lectura o actualización correcta.
- `204 No Content`: eliminación correcta.
- `400 Bad Request`: validación, JSON inválido o campo no permitido.
- `404 Not Found`: recurso inexistente.
- `500 Internal Server Error`: error interno.

## 11. Flujo del frontend

1. Abrir `http://localhost:5173`.
2. Elegir `Startups` o `Tecnologias` en el menú lateral.
3. Consultar registros y filtrar por nombre o sector.
4. Crear un registro con el botón de nueva entidad.
5. Usar el botón de detalle o el ID para ejecutar `GET /read/:id`.
6. Editar el registro con `PUT`.
7. Eliminarlo con `DELETE` y confirmación.

## 12. Cómo desplegar

Para ejecución local:

```powershell
docker compose up -d --build
```

El orden lógico de los componentes es PostgreSQL, microservicios, gateway y frontend. Docker Compose crea la red interna y resuelve los servicios por nombre.

## 13. Pruebas manuales

Crear una variable de entorno o de colección:

```text
baseUrl = http://localhost:8080/v2/api
```

Pruebas mínimas para cada dominio:

| Prueba | Método | Ruta | Esperado |
|---|---|---|---:|
| Listar | GET | `{{baseUrl}}/startups/read` | 200 |
| Filtrar | GET | `{{baseUrl}}/startups/read?name=Tech` | 200 |
| Crear válido | POST | `{{baseUrl}}/startups/create` | 201 |
| Crear inválido | POST | `{{baseUrl}}/startups/create` | 400 |
| Detalle existente | GET | `{{baseUrl}}/startups/read/1` | 200 |
| Detalle inexistente | GET | `{{baseUrl}}/startups/read/99999` | 404 |
| Actualizar | PUT | `{{baseUrl}}/startups/update/1` | 200 |
| Campo no permitido | PUT | `{{baseUrl}}/startups/update/1` | 400 |
| Eliminar | DELETE | `{{baseUrl}}/startups/delete/1` | 204 |
| Eliminar inexistente | DELETE | `{{baseUrl}}/startups/delete/99999` | 404 |

Repetir las mismas pruebas sustituyendo `startups` por `technologies`. Para POST y PUT seleccionar `Body > raw > JSON`.

JSON inválido de prueba:

```json
{
  "name": "Registro sin cerrar
}
```

Respuesta esperada:

```json
{
  "message": "Validation error",
  "details": ["Request body must be valid JSON"]
}
```

## 14. Evidencias

Las capturas de la interfaz y de Postman se guardan en `evidencias/capturas/`. Cada evidencia debe mostrar método, URL, body cuando aplique, status HTTP y respuesta. La colección documentada está en `postman/Reto1.postman_collection.json`.

## 15. Limitaciones conocidas

- No hay autenticación.
- No hay despliegue público ni URL externa.
- La entrega se mantiene local y no se subirá a Git.
- Las validaciones están implementadas en cada servicio y podrían extraerse a una librería compartida en una iteración futura.

## 16. Siguientes pasos

- Automatizar las pruebas de contrato.
- Añadir filtros avanzados y paginación.
- Configurar variables de entorno separadas para producción.
- Añadir autenticación y autorización si el sistema se publica.

## 17. Información del repositorio Git

Por decisión del equipo, el proyecto no se subirá a Git. La revisión se realizará sobre la carpeta local ejecutable.

## 18. Rúbrica de evaluación

Funcionamiento (CRUDs) — 30%  
Código y orden (estructura, validación, errores) — 25%  
Contenedores y despliegue — 20%  
Documentación y reproducibilidad — 15%  
Pruebas manuales claras — 10%  
Plus (pequeños extras bien hechos) — +10%
