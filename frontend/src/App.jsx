import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/v2/api'

const RESOURCES = {
  startups: {
    label: 'Startups', singular: 'startup', endpoint: 'startups', accent: 'coral',
    description: 'Empresas emergentes y su actividad de inversion',
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej. TechNova' },
      { name: 'category', label: 'Categoria', type: 'text', required: true, placeholder: 'Ej. Fintech' },
      { name: 'location', label: 'Ubicacion', type: 'text', placeholder: 'Ciudad, pais' },
      { name: 'foundedAt', label: 'Fecha de fundacion', type: 'date' },
      { name: 'fundingAmount', label: 'Financiamiento (USD)', type: 'number', min: '0' },
    ],
    columns: [
      { key: 'name', label: 'Startup' }, { key: 'category', label: 'Categoria' },
      { key: 'location', label: 'Ubicacion' }, { key: 'fundingAmount', label: 'Financiamiento', format: formatCurrency },
    ],
  },
  technologies: {
    label: 'Tecnologias', singular: 'tecnologia', endpoint: 'technologies', accent: 'blue',
    description: 'Catalogo de capacidades que impulsan el ecosistema',
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej. Machine Learning' },
      { name: 'sector', label: 'Sector', type: 'text', required: true, placeholder: 'Ej. Inteligencia Artificial' },
      { name: 'adoptionLevel', label: 'Nivel de adopcion', type: 'select', required: true, options: ['Bajo', 'Medio', 'Alto'] },
      { name: 'description', label: 'Descripcion', type: 'textarea', required: true, placeholder: 'Describe brevemente la tecnologia' },
    ],
    columns: [
      { key: 'name', label: 'Tecnologia' }, { key: 'sector', label: 'Sector' },
      { key: 'adoptionLevel', label: 'Adopcion', badge: true }, { key: 'description', label: 'Descripcion' },
    ],
  },
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function App() {
  const [resource, setResource] = useState('startups')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState(null)
  const [detail, setDetail] = useState(null)
  const [notice, setNotice] = useState('')
  const config = RESOURCES[resource]

  const loadItems = async () => {
    setLoading(true)
    setError('')
    try {
      const filter = resource === 'startups' ? 'name' : 'sector'
      const query = search.trim() ? `?${filter}=${encodeURIComponent(search.trim())}` : ''
      const response = await fetch(`${API_BASE_URL}/${config.endpoint}/read${query}`)
      if (!response.ok) throw new Error('No se pudo cargar la informacion')
      setItems(await response.json())
    } catch (requestError) {
      setError(`${requestError.message}. Comprueba que el gateway este activo.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [resource, search])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(query)))
  }, [items, search])

  const showDetail = async (item) => {
    setDetail({ loading: true, item })
    try {
      const response = await fetch(`${API_BASE_URL}/${config.endpoint}/read/${item.id}`)
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'No se pudo cargar el detalle')
      setDetail({ loading: false, item: body })
    } catch (requestError) {
      setDetail({ loading: false, error: requestError.message, item })
    }
  }

  const saveItem = async (formData) => {
    const editing = editor?.mode === 'edit'
    const path = editing ? `${API_BASE_URL}/${config.endpoint}/update/${editor.item.id}` : `${API_BASE_URL}/${config.endpoint}/create`
    const payload = config.endpoint === 'startups'
      ? { ...formData, fundingAmount: formData.fundingAmount === '' ? undefined : Number(formData.fundingAmount) }
      : formData
    const response = await fetch(path, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.message || 'No se pudo guardar el registro')
    setEditor(null)
    setNotice(`${config.singular} ${editing ? 'actualizada' : 'creada'} correctamente`)
    await loadItems()
    window.setTimeout(() => setNotice(''), 3000)
  }

  const deleteItem = async (item) => {
    if (!window.confirm(`¿Eliminar ${item.name}? Esta accion no se puede deshacer.`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/${config.endpoint}/delete/${item.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('No se pudo eliminar el registro')
      setNotice(`${config.singular} eliminada`)
      await loadItems()
      window.setTimeout(() => setNotice(''), 3000)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">R1</span><div><strong>Reto<span>1</span></strong><small>ECOSISTEMA DIGITAL</small></div></div>
        <div className="sidebar-label">Workspace</div>
        <nav>{Object.entries(RESOURCES).map(([key, item]) => <button className={`nav-item ${resource === key ? 'active' : ''}`} key={key} onClick={() => { setResource(key); setSearch('') }}><span className={`nav-icon ${item.accent}`}>{key === 'startups' ? '↗' : '◆'}</span>{item.label}<span className="nav-count">{resource === key && !loading ? items.length : ''}</span></button>)}</nav>
      </aside>
      <main className="main-content">
        <div className="content-wrap">
          <section className="page-heading"><div><p className="eyebrow">Panel de control / {config.label}</p><h1>Gestion de {config.label.toLowerCase()}</h1><p className="intro">{config.description}</p></div><button className={`primary-button ${config.accent}`} onClick={() => setEditor({ mode: 'create' })}><span>＋</span> Nueva {config.singular}</button></section>
          <section className="stats-row"><div className="stat-card"><span className={`stat-icon ${config.accent}`}>{resource === 'startups' ? '↗' : '◆'}</span><div><small>Total registrados</small><strong>{loading ? '...' : items.length}</strong></div></div><div className="stat-card"><span className="stat-icon mint">◌</span><div><small>Mostrando ahora</small><strong>{loading ? '...' : filteredItems.length}</strong></div></div></section>
          <section className="data-panel"><div className="panel-header"><div><h2>{config.label} registradas</h2><p>{filteredItems.length} resultados en este espacio</p></div><div className="panel-actions"><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={resource === 'startups' ? 'Filtrar por nombre...' : 'Filtrar por sector...'} /></label><button className="icon-button" onClick={loadItems} aria-label="Actualizar datos" title="Actualizar datos">↻</button></div></div>{error && <div className="error-banner"><b>Error</b><span>{error}</span><button onClick={loadItems}>Reintentar</button></div>}<div className="table-wrap"><table><thead><tr><th>ID</th>{config.columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Acciones</th></tr></thead><tbody>{loading ? <tr><td colSpan={config.columns.length + 2} className="table-state"><span className="loader"></span>Cargando registros...</td></tr> : filteredItems.length === 0 ? <tr><td colSpan={config.columns.length + 2} className="table-state"><b>No hay registros para mostrar</b></td></tr> : filteredItems.map((item) => <tr key={item.id}><td><button className="id-link" onClick={() => showDetail(item)} title="Consultar detalle por ID">#{String(item.id).padStart(3, '0')}</button></td>{config.columns.map((column) => <td key={column.key}>{column.badge ? <span className={`level-badge ${String(item[column.key]).toLowerCase()}`}>{item[column.key]}</span> : <span className={column.key === 'name' ? 'name-cell' : column.key === 'description' ? 'description-cell' : ''}>{column.format ? column.format(item[column.key]) : item[column.key] || '—'}</span>}</td>)}<td><div className="row-actions"><button aria-label={`Ver ${item.name}`} title="Ver detalle" onClick={() => showDetail(item)}>◉</button><button aria-label={`Editar ${item.name}`} title="Editar" onClick={() => setEditor({ mode: 'edit', item })}>✎</button><button aria-label={`Eliminar ${item.name}`} title="Eliminar" onClick={() => deleteItem(item)}>⌫</button></div></td></tr>)}</tbody></table></div><div className="panel-footer"><span>Mostrando <b>{filteredItems.length}</b> de <b>{items.length}</b> registros</span></div></section>
        </div>
      </main>
      {notice && <div className="toast">✓ {notice}</div>}
      {editor && <EntityModal config={config} item={editor.item} onClose={() => setEditor(null)} onSubmit={saveItem} />}
      {detail && <DetailModal config={config} detail={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function EntityModal({ config, item, onClose, onSubmit }) {
  const [form, setForm] = useState(() => Object.fromEntries(config.fields.map((field) => [field.name, item?.[field.name] ?? ''])))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const handleSubmit = async (event) => { event.preventDefault(); setSaving(true); setFormError(''); try { await onSubmit(form) } catch (submitError) { setFormError(submitError.message) } finally { setSaving(false) } }
  return <div className="modal-backdrop"><div className="modal"><div className="modal-heading"><div><p className="eyebrow">{item ? 'Editar registro' : 'Nuevo registro'}</p><h2>{item ? `Editar ${config.singular}` : `Registrar ${config.singular}`}</h2></div><button className="close-button" onClick={onClose} aria-label="Cerrar">×</button></div><form onSubmit={handleSubmit}><div className="form-grid">{config.fields.map((field) => <label className={field.type === 'textarea' ? 'full-field' : ''} key={field.name}><span>{field.label}{field.required && <em> *</em>}</span>{field.type === 'textarea' ? <textarea required={field.required} value={form[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.placeholder} rows="4" /> : field.type === 'select' ? <select required={field.required} value={form[field.name]} onChange={(event) => update(field.name, event.target.value)}><option value="">Selecciona una opcion</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input required={field.required} type={field.type} min={field.min} value={form[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.placeholder} />}</label>)}</div>{formError && <div className="form-error">{formError}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className={`primary-button ${config.accent}`} disabled={saving}>{saving ? 'Guardando...' : 'Guardar registro'}</button></div></form></div></div>
}

function DetailModal({ config, detail, onClose }) {
  const item = detail.item
  return <div className="modal-backdrop"><div className="modal detail-modal"><div className="modal-heading"><div><p className="eyebrow">GET /read/{item?.id}</p><h2>Detalle de {config.singular}</h2></div><button className="close-button" onClick={onClose} aria-label="Cerrar">×</button></div>{detail.loading ? <div className="table-state"><span className="loader"></span>Consultando por ID...</div> : detail.error ? <div className="form-error">{detail.error}</div> : <div className="detail-grid">{Object.entries(item).map(([key, value]) => <div className="detail-field" key={key}><small>{key}</small><strong>{value === null || value === '' ? '—' : String(value)}</strong></div>)}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cerrar</button></div></div></div>
}

export default App
