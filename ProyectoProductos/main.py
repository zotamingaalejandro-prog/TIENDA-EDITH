from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI(title="Productos CRUD (FastAPI + Frontend estático)")

# ===== Modelos =====
class Producto(BaseModel):
    codigo: int = Field(gt=0, description="Identificador único (entero > 0)")
    descripcion: str = Field(min_length=3, max_length=100)
    precio: float = Field(gt=0, description="Precio mayor a 0")

class ProductoCreate(Producto):
    pass

class ProductoUpdate(BaseModel):
    descripcion: Optional[str] = Field(None, min_length=3, max_length=100)
    precio: Optional[float] = Field(None, gt=0)

# ===== "Base de datos" en memoria =====
productos_db: List[Producto] = [
    Producto(codigo=1, descripcion="Teclado", precio=50.0),
    Producto(codigo=2, descripcion="Mouse", precio=30.0),
    Producto(codigo=3, descripcion="Monitor", precio=200.0),
]

# ===== Endpoints API =====

# Listar todos
@app.get("/api/productos", response_model=List[Producto])
def listar_productos():
    return productos_db

# Obtener uno
@app.get("/api/productos/{codigo}", response_model=Producto)
def obtener_producto(codigo: int):
    for p in productos_db:
        if p.codigo == codigo:
            return p
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

# Crear
@app.post("/api/productos", response_model=Producto, status_code=status.HTTP_201_CREATED)
def crear_producto(prod: ProductoCreate):
    # Validar que no exista el código
    if any(p.codigo == prod.codigo for p in productos_db):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El código ya existe")
    productos_db.append(prod)
    return prod

# Actualizar (solo desc y precio)
@app.put("/api/productos/{codigo}", response_model=Producto)
def actualizar_producto(codigo: int, cambios: ProductoUpdate):
    for i, p in enumerate(productos_db):
        if p.codigo == codigo:
            # No permitimos cambiar el código
            data = p.model_dump()
            if cambios.descripcion is not None:
                data["descripcion"] = cambios.descripcion
            if cambios.precio is not None:
                data["precio"] = cambios.precio
            actualizado = Producto(**data)
            productos_db[i] = actualizado
            return actualizado
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

# Eliminar
@app.delete("/api/productos/{codigo}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(codigo: int):
    for i, p in enumerate(productos_db):
        if p.codigo == codigo:
            productos_db.pop(i)
            return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

# ===== Servir frontend estático =====
app.mount("/", StaticFiles(directory="static", html=True), name="static")

