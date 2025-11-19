# Backend-Frontend Synchronization Guide

## Overview
Este documento describe la sincronización entre los endpoints del backend (Python Lambda) y los servicios de Angular.

---

## Estructura de Respuesta del Backend

Todos los endpoints del backend utilizan las funciones `create_response()` y `create_error_response()` con la siguiente estructura:

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { ... },
  "timestamp": "2025-11-19T..."
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Mensaje de error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error"
  },
  "timestamp": "2025-11-19T..."
}
```

---

## 1. Buildings Service

### Backend Endpoints

#### **GET /buildings**
- **Respuesta**: `{ success, message, data: { buildings: [], count } }`
- **Notas**: 
  - Retorna lista de buildings con unidades anidadas (fetched from `unitsId`)
  - Cada building incluye su array de `units` completo

#### **GET /buildings/{id}**
- **Respuesta**: `{ success, message, data: building }`
- **Notas**: 
  - Busca por campo `id` (no `_id`)
  - Retorna un solo building

#### **POST /condominiums/{condominiumId}/buildings**
- **Body**: Building data (sin `id`, se genera automáticamente)
- **Respuesta**: `{ success, message, data: created building }`
- **Notas**:
  - El `condominiumId` se pasa en el path
  - El backend agrega automáticamente el building al array `buildingsId` del condominium
  - Retorna el building con `_id` de MongoDB

#### **PUT /buildings/{id}**
- **Body**: Building data actualizado
- **Respuesta**: `{ success, message, data: updated building }`
- **Notas**: 
  - El backend asegura que el `id` del body coincida con el path parameter

#### **DELETE /buildings/{id}** (Soft Delete)
- **Respuesta**: `{ success, message, data: {} }`
- **Notas**: 
  - NO elimina físicamente el registro
  - Actualiza el campo `status` a `'INACTIVE'`
  - Busca por campo `id` (no `_id`)

### Frontend Changes
- ✅ Todos los métodos actualizados para incluir `message` en las respuestas
- ✅ `deleteBuilding()` cambiado a soft delete (actualiza status en lugar de eliminar)
- ✅ Comentarios agregados indicando el endpoint del backend

---

## 2. Condominiums Service

### Backend Endpoints

#### **GET /condominiums**
- **Respuesta**: `{ success, message, data: [condominiums] }`
- **Notas**:
  - Retorna lista de condominiums con buildings anidados (fetched from `buildingsId`)
  - Cada condominium incluye su array de `buildings` completo

#### **POST /condominiums**
- **Body**: Condominium data
- **Respuesta**: `{ success, message, data: created condominium }`
- **Notas**: 
  - Retorna el condominium con `_id` de MongoDB

#### **PUT /condominiums/{id}**
- **Body**: Condominium data actualizado
- **Respuesta**: `{ success, message, data: updated condominium }`

#### **DELETE /condominiums/{id}** (Soft Delete)
- **Respuesta**: `{ success, message }`
- **Notas**: 
  - NO elimina físicamente el registro
  - Actualiza el campo `status` a `'INACTIVE'`

### Frontend Changes
- ✅ Todos los métodos actualizados para usar estructura `{ success, message, data }`
- ✅ `deleteCondominium()` cambiado a soft delete (marca `isActive = false`)
- ✅ Comentarios agregados indicando el endpoint del backend

---

## 3. Residents Service

### Backend Endpoints

#### **GET /residents**
- **Query Params**: `?unitId=xxx&type=xxx&documentNumber=xxx`
- **Respuesta**: `{ success, message, data: { residents: [], count } }`
- **Notas**: 
  - Soporta filtros por unitId, type, documentNumber

#### **GET /residents/{id}**
- **Respuesta**: `{ success, message, data: resident }`
- **Notas**: 
  - Busca por `_id` de MongoDB

#### **POST /units/{unitId}/residents**
- **Body**: Resident data
- **Respuesta**: `{ success, message, data: created resident }`
- **Notas**:
  - El `unitId` se pasa en el path
  - El backend agrega automáticamente el resident al array `residentsId` de la unit
  - Agrega timestamp `createdAt` automáticamente

#### **PUT /residents/{id}**
- **Body**: Resident data actualizado
- **Respuesta**: `{ success, message, data: updated resident }`

#### **DELETE /residents/{id}** (Hard Delete)
- **Respuesta**: `{ success, message, data: {} }`
- **Notas**:
  - **HARD DELETE** - elimina físicamente el registro
  - Remueve automáticamente el resident del array `residentsId` de todas las units

### Frontend Changes
- ✅ Todos los métodos actualizados para incluir `message` en las respuestas
- ✅ Comentarios agregados indicando el endpoint del backend y comportamiento
- ✅ `deleteResident()` es hard delete (elimina físicamente)

---

## 4. Units Service

### Backend Endpoints

#### **GET /units**
- **Respuesta**: `{ success, message, data: { units: [], count } }`
- **Notas**:
  - Retorna lista de units con residents anidados (fetched from `residentsId`)
  - Cada unit incluye su array de `residents` completo

#### **GET /units/{id}**
- **Respuesta**: `{ success, message, data: unit }`
- **Notas**: 
  - Busca por campo `id` (no `_id`)

#### **POST /buildings/{buildingId}/units**
- **Body**: Unit data
- **Respuesta**: `{ success, message, data: created unit }`
- **Notas**:
  - El `buildingId` se pasa en el path
  - El backend agrega automáticamente la unit al array `unitsId` del building
  - Agrega timestamp `createdAt` automáticamente

#### **PUT /units/{id}**
- **Body**: Unit data actualizado
- **Respuesta**: `{ success, message, data: updated unit }`
- **Notas**: 
  - El backend asegura que el `id` del body coincida con el path parameter

#### **DELETE /units/{id}** (Soft Delete)
- **Respuesta**: `{ success, message, data: {} }`
- **Notas**:
  - NO elimina físicamente el registro
  - Actualiza el campo `status` a `'INACTIVE'`
  - Busca por campo `id` (no `_id`)

### Frontend Changes
- ✅ Todos los métodos actualizados para incluir `message` en las respuestas
- ✅ `deleteUnit()` cambiado a soft delete (actualiza status a VACANT)
- ✅ Comentarios agregados indicando el endpoint del backend

---

## Resumen de Cambios en los Services

### Cambios Globales
1. **Estructura de Respuesta**: Todos los métodos ahora incluyen `message` en el objeto `ApiResponse`
2. **Soft Delete**: Buildings, Units y Condominiums usan soft delete (marcan como inactivos)
3. **Hard Delete**: Residents usa hard delete (elimina físicamente)
4. **Endpoints con Path Params**:
   - Buildings: `POST /condominiums/{condominiumId}/buildings`
   - Units: `POST /buildings/{buildingId}/units`
   - Residents: `POST /units/{unitId}/residents`

### Comportamiento de Relaciones
El backend maneja automáticamente las relaciones:
- Al crear un **Building**, se agrega al array `buildingsId` del **Condominium**
- Al crear una **Unit**, se agrega al array `unitsId` del **Building**
- Al crear un **Resident**, se agrega al array `residentsId` de la **Unit**
- Al eliminar un **Resident**, se remueve del array `residentsId` de todas las **Units**

### Nested Data (Datos Anidados)
El backend hace fetch de relaciones anidadas:
- **GET /condominiums** incluye `buildings` array completo
- **GET /buildings** incluye `units` array completo
- **GET /units** incluye `residents` array completo

---

## Campos Opcionales en Interfaces

Los siguientes campos están marcados como opcionales (`?`) porque no siempre están presentes en las respuestas del backend:

### Building
- `buildingName?`
- `condominiumName?`
- `adminName?`
- `adminEmail?`
- `adminPhone?`

### Condominium
- `state?`
- `country?`
- `rfc?`
- `additionalInfo?`
- `description?`

### Resident
- `buildingId?`
- `buildingName?`
- `unitNumber?`
- `emergencyContactName?`
- `emergencyContactPhone?`
- `relationship?`

### Unit
- `buildingId?`
- `towerId?`
- `privateStreetId?`
- `condominiumName?`
- `buildingName?`
- `towerName?`
- `privateStreetName?`

---

## Próximos Pasos

1. ✅ **Services actualizados** para coincidir con el backend
2. ⏳ **Interfaces revisadas** - campos opcionales marcados con `?`
3. ⏳ **Pruebas de integración** - verificar que los componentes manejen correctamente las respuestas
4. ⏳ **Error Handling** - asegurar que todos los componentes manejen correctamente los errores del backend

---

## Notas Importantes

- **Todos los IDs**: El backend usa `_id` de MongoDB internamente, pero expone `id` en las respuestas
- **Timestamps**: El backend agrega `createdAt` automáticamente en POST
- **Validación**: El backend usa modelos Pydantic para validación
- **Mensajes**: Todos los mensajes del backend están en español

---

## Testing Checklist

- [ ] Probar creación de Building con condominiumId en path
- [ ] Probar creación de Unit con buildingId en path
- [ ] Probar creación de Resident con unitId en path
- [ ] Verificar soft delete de Buildings
- [ ] Verificar soft delete de Units
- [ ] Verificar soft delete de Condominiums
- [ ] Verificar hard delete de Residents
- [ ] Verificar que los arrays anidados se cargan correctamente (buildings, units, residents)
- [ ] Probar filtros en GET /residents
- [ ] Verificar que los mensajes de error se muestran correctamente
