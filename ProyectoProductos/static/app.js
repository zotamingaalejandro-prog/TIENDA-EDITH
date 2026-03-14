const API = "/api/productos";

const tbody = document.getElementById("tbody-productos");
const msgTabla = document.getElementById("mensaje-tabla");

// Form agregar
const fAdd = document.getElementById("form-agregar");
const addCodigo = document.getElementById("add-codigo");
const addDesc = document.getElementById("add-descripcion");
const addPrecio = document.getElementById("add-precio");
const msgAgregar = document.getElementById("msg-agregar");

// Form editar
const fEdit = document.getElementById("form-editar");
const editCodigo = document.getElementById("edit-codigo");
const editDesc = document.getElementById("edit-descripcion");
const editPrecio = document.getElementById("edit-precio");
const msgEditar = document.getElementById("msg-editar");
const btnCancelar = document.getElementById("btn-cancelar-edicion");

// ===== Helpers UI =====
function setMessage(el, text, ok=false){
  el.textContent = text || "";
  el.style.color = text ? (ok ? "var(--ok)" : "var(--muted)") : "var(--muted)";
}

function limpiarEdicion(){
  editCodigo.value = "";
  editDesc.value = "";
  editPrecio.value = "";
  setMessage(msgEditar, "");
}

// ===== Render =====
function renderTable(items){
  tbody.innerHTML = "";
  if (!items.length){
    setMessage(msgTabla, "No hay productos cargados.");
    return;
  }
  setMessage(msgTabla, "");
  for (const p of items){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.descripcion}</td>
      <td>$ ${Number(p.precio).toFixed(2)}</td>
      <td>
        <button class="secondary" data-edit="${p.codigo}">Editar</button>
        &nbsp;&nbsp;
        <a href="#" class="action" data-del="${p.codigo}">Eliminar</a>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

// ===== API calls =====
async function cargarProductos(){
  try{
    const r = await fetch(API);
    if(!r.ok) throw new Error("Error al cargar");
    const data = await r.json();
    renderTable(data);
  }catch(e){
    setMessage(msgTabla, "No se pudo cargar el listado");
    console.error(e);
  }
}

async function agregarProducto(e){
  e.preventDefault();
  setMessage(msgAgregar, "Procesando...");
  const payload = {
    codigo: Number(addCodigo.value),
    descripcion: addDesc.value.trim(),
    precio: Number(addPrecio.value)
  };
  try{
    const r = await fetch(API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    if (r.status === 409){
      setMessage(msgAgregar, "El código ya existe.");
      return;
    }
    if(!r.ok){
      const err = await r.json().catch(()=>({detail:"Error inesperado"}));
      throw new Error(err.detail || "Error al crear");
    }
    await cargarProductos();
    fAdd.reset();
    setMessage(msgAgregar, "Producto agregado ", true);
  }catch(e){
    setMessage(msgAgregar, e.message || "Error al crear");
  }
}

async function prepararEdicion(codigo){
  try{
    const r = await fetch(`${API}/${codigo}`);
    if(!r.ok) throw new Error("No encontrado");
    const p = await r.json();
    editCodigo.value = p.codigo;
    editDesc.value = p.descripcion;
    editPrecio.value = p.precio;
    setMessage(msgEditar, "Producto cargado para editar", true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }catch(e){
    setMessage(msgEditar, "No se pudo cargar el producto");
  }
}

async function guardarEdicion(e){
  e.preventDefault();
  const codigo = Number(editCodigo.value);
  if(!codigo){
    setMessage(msgEditar, "Elegí un producto desde la tabla (Editar).");
    return;
  }
  const cambios = {};
  if (editDesc.value.trim()) cambios.descripcion = editDesc.value.trim();
  if (editPrecio.value) cambios.precio = Number(editPrecio.value);
  if (Object.keys(cambios).length === 0){
    setMessage(msgEditar, "No hay cambios para guardar.");
    return;
  }
  setMessage(msgEditar, "Guardando cambios...");
  try{
    const r = await fetch(`${API}/${codigo}`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(cambios)
    });
    if (r.status === 404){
      setMessage(msgEditar, "Producto no encontrado.");
      return;
    }
    if(!r.ok){
      const err = await r.json().catch(()=>({detail:"Error inesperado"}));
      throw new Error(err.detail || "Error al actualizar");
    }
    await cargarProductos();
    setMessage(msgEditar, "Cambios guardados ", true);
  }catch(e){
    setMessage(msgEditar, e.message || "Error al actualizar");
  }
}

async function eliminarProducto(codigo){
  if(!confirm(`Eliminar el producto ${codigo}?`)) return;
  try{
    const r = await fetch(`${API}/${codigo}`, { method: "DELETE" });
    if (r.status === 404){
      alert("Producto no encontrado.");
      return;
    }
    if(!r.ok) throw new Error("Error al eliminar");
    await cargarProductos();
  }catch(e){
    alert("No se pudo eliminar.");
  }
}

// ===== Listeners =====
fAdd.addEventListener("submit", agregarProducto);
fEdit.addEventListener("submit", guardarEdicion);
btnCancelar.addEventListener("click", limpiarEdicion);

tbody.addEventListener("click", (e)=>{
  const btnEdit = e.target.closest("[data-edit]");
  const aDel = e.target.closest("[data-del]");
  if (btnEdit){
    const codigo = Number(btnEdit.getAttribute("data-edit"));
    prepararEdicion(codigo);
  }
  if (aDel){
    e.preventDefault();
    const codigo = Number(aDel.getAttribute("data-del"));
    eliminarProducto(codigo);
  }
});

// Inicial
cargarProductos();

