import { useEffect, useState } from 'react'
import './App.css'

const services = [
  { id: 'repair', icon: '✦', name: 'Repair', nameEs: 'Arreglo', detail: 'Mending, patches & zips', detailEs: 'Remiendos, parches y cremalleras', time: '3–5 days', price: 'From $18' },
  { id: 'alteration', icon: '⌁', name: 'Alteration', nameEs: 'Arreglo y ajuste', detail: 'Fit, hems & reshaping', detailEs: 'Ajustes, bajos y forma', time: '5–7 days', price: 'From $28' },
]

const dropOffs = [
  { id: 'comillas', name: 'Universidad Pontificia Comillas', address: 'Calle de Alberto Aguilera 23, Madrid', addressEn: '23 Alberto Aguilera Street, Madrid', hours: 'Abierto hasta las 20:00', hoursEn: 'Open until 8pm', distance: '0.8 km', lockers: ['C-04', 'C-08', 'C-12', 'C-16', 'C-20'] },
  { id: 'uc3m', name: 'La Universidad Carlos III de Madrid UC3M', address: 'Calle de Madrid 126, Getafe', addressEn: '126 Madrid Street, Getafe', hours: 'Abierto hasta las 21:00', hoursEn: 'Open until 9pm', distance: '2.4 km', lockers: ['U-31', 'U-35', 'U-39', 'U-43', 'U-47'] },
  { id: 'ie', name: 'IE University', address: 'Calle de María de Molina 31, Madrid', addressEn: '31 María de Molina Street, Madrid', hours: 'Abierto hasta las 19:00', hoursEn: 'Open until 7pm', distance: '3.1 km', lockers: ['I-02', 'I-06', 'I-10', 'I-14', 'I-18'] },
]

const orders = [
  { id: 'M-1048', initials: 'JM', name: 'Julia Martín', item: 'Pantalón de lino', service: 'Bajo + estrechar', arrival: '14 oct', deadline: '18 oct', pickup: '19 oct', status: 'Recibida', tone: 'orange', notes: 'Mantener el bajo original y ajustar ligeramente la pernera.', photos: [] },
  { id: 'M-1047', initials: 'SG', name: 'Sergio García', item: 'Americana de lana', service: 'Ajuste de mangas', arrival: '13 oct', deadline: '17 oct', pickup: '18 oct', status: 'Trabajo iniciado', tone: 'green', notes: 'Cliente pidió conservar el botón original.', photos: [] },
  { id: 'M-1046', initials: 'LR', name: 'Lucía Ruiz', item: 'Cazadora vaquera', service: 'Parche en codo', arrival: '12 oct', deadline: '16 oct', pickup: '17 oct', status: 'Lista para recoger', tone: 'blue', notes: 'Usar denim oscuro similar al tejido existente.', photos: [] },
  { id: 'M-1044', initials: 'TA', name: 'Tomás Álvarez', item: 'Vestido de seda', service: 'Restauración', arrival: '10 oct', deadline: '15 oct', pickup: '16 oct', status: 'Lista para recoger', tone: 'purple', notes: 'Tratar la mancha con cuidado antes del planchado.', photos: [] },
]

const statusTones = {
  'En camino': 'in-transit',
  'Recibida': 'received',
  'Trabajo iniciado': 'in-progress',
  'Lista para recoger': 'pickup',
}
const statusEnglish = { 'Recibida': 'Received', 'En proceso': 'Works started', 'Trabajo iniciado': 'Works started', 'Lista para recoger': 'Ready for pickup', 'Entregada': 'Completed', 'En camino': 'On the way to shop', 'Entrega completada': 'Drop-off completed' }
const ORDER_HANDOFF_DELAY = 20 * 1000
const orderEnglish = {
  'Cliente de Madrid': 'Madrid customer',
  'Prenda para revisar': 'Garment to review',
  'Pantalón de lino': 'Linen trousers',
  'Bajo + estrechar': 'Hem + taper',
  'Americana de lana': 'Wool blazer',
  'Ajuste de mangas': 'Sleeve alteration',
  'Cazadora vaquera': 'Denim jacket',
  'Parche en codo': 'Elbow patch',
  'Vestido de seda': 'Silk dress',
  'Restauración': 'Restoration',
  'Hoy': 'Today',
  'Por confirmar': 'To be confirmed',
  'Sin indicaciones adicionales.': 'No additional instructions.',
  'Pedido enviado': 'Order submitted',
  'En proceso de entrega': 'Delivery in progress',
  'Mantener el bajo original y ajustar ligeramente la pernera.': 'Keep the original hem and slightly taper the leg.',
  'Cliente pidió conservar el botón original.': 'Customer asked to keep the original button.',
  'Usar denim oscuro similar al tejido existente.': 'Use dark denim similar to the existing fabric.',
  'Tratar la mancha con cuidado antes del planchado.': 'Treat the stain carefully before pressing.',
}

const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '')

function loadOrders() {
  try {
    const savedOrders = JSON.parse(localStorage.getItem('zurcido-orders'))
    if (!Array.isArray(savedOrders)) return orders
    return savedOrders.map((order) => ({
      ...order,
      status: order.status === 'Lista para prueba' || order.status === 'En proceso' ? 'Trabajo iniciado' : order.status === 'Esperando aprobación' ? 'Lista para recoger' : order.status,
    }))
  } catch {
    return orders
  }
}

function loadClientOrders() {
  try {
    const savedOrders = JSON.parse(localStorage.getItem('zurcido-client-orders'))
    if (Array.isArray(savedOrders)) return savedOrders
    const legacyOrder = JSON.parse(localStorage.getItem('zurcido-client-order'))
    return legacyOrder ? [legacyOrder] : []
  } catch {
    return []
  }
}

function formatOrderDate(date, language) {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short' }).format(date)
}

function nextBusinessStatus(status) {
  const progression = ['En camino', 'Recibida', 'Trabajo iniciado', 'Lista para recoger']
  const nextIndex = progression.indexOf(status) + 1
  return progression[nextIndex] || null
}

function previousBusinessStatus(status) {
  const progression = ['En camino', 'Recibida', 'Trabajo iniciado', 'Lista para recoger']
  const previousIndex = progression.indexOf(status) - 1
  return progression[previousIndex] || null
}

function App() {
  const [view, setView] = useState(window.location.pathname === `${appBasePath}/business` ? 'business' : 'client')
  const [language, setLanguage] = useState('en')
  const [service, setService] = useState('alteration')
  const [dropOff, setDropOff] = useState('comillas')
  const [locker, setLocker] = useState('C-04')
  const [showDropoffModal, setShowDropoffModal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [clientName, setClientName] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [businessOrders, setBusinessOrders] = useState(loadOrders)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [clientOrders, setClientOrders] = useState(loadClientOrders)
  const [confirmationOrder, setConfirmationOrder] = useState(null)
  const [showClientOrder, setShowClientOrder] = useState(false)

  const selectedService = services.find((item) => item.id === service)
  const selectedDropOff = dropOffs.find((item) => item.id === dropOff)
  const usedLockers = new Set(clientOrders.map((order) => `${order.dropOff}:${order.locker}`))
  const availableLockers = selectedDropOff.lockers.filter((number) => !usedLockers.has(`${selectedDropOff.id}:${number}`))
  const isSpanish = language === 'es'
  const copy = isSpanish ? {
    clientMode: 'Cliente', businessMode: 'Taller', yourOrder: 'Tu pedido', clientEyebrow: 'ARREGLA, AJUSTA, VUELVE A USAR', clientTitle: <>Tu ropa merece<br /><em>otra vida.</em></>, clientIntro: 'Arreglos y transformaciones cuidadas, hechos por sastres locales que conocen Madrid y respetan tus prendas.', metaLocal: 'Sastres locales', metaTurnaround: 'Entrega en 3–10 días', help: '¿Qué necesita tu prenda?', helpNote: 'Elige la opción más cercana. El sastre confirmará los detalles.', drop: '¿Dónde la vas a dejar?', dropNote: 'Elige el punto que te venga mejor.', more: 'Cuéntanos un poco más', moreNote: 'Una foto ayuda al sastre a preparar tu cita.', next: 'Siguiente', locker: 'Número de taquilla', lockerHint: 'Selecciona una disponible', dropHint: 'Elige el punto y la taquilla donde dejarás tu prenda', details: 'DETALLES', detailHint: 'Añade una foto y una descripción para que el sastre pueda preparar tu pedido.', addPhoto: 'Añadir una foto', photoReady: 'Foto lista. Haz clic para cambiarla.', description: 'Descripción para el sastre (opcional)', submitOrder: 'Enviar pedido', orderDetail: 'DETALLE DEL PEDIDO', arrival: 'Llegada', deadline: 'Fecha límite', pickupDate: 'Recogida', status: 'Estado', customerNotes: 'Notas del cliente', close: 'Guardar y cerrar', tailorEyebrow: 'CHAMBERI ATELIER / ESCRITORIO DEL TALLER', tailorTitle: 'Buenos días, Ana', tailorIntro: 'Aquí tienes lo que necesita tu atención hoy.', orders: 'Tus pedidos', newOrder: '+ Nuevo pedido', all: 'Todos', footer: 'Hecho para prendas que merecen durar.', dropoffConfirmation: 'Deja tu prenda en la taquilla', byClient: 'por el cliente', orderSaved: 'Pedido guardado', lockerLocation: 'Ubicación de la taquilla', orderStatus: 'Pedido recibido', completedDropoff: 'Entrega completada', completeDropoff: 'Completar entrega', orderSubmitted: 'Pedido enviado', deliveryInProgress: 'Entrega en curso', noLockers: 'No hay taquillas disponibles en este punto.', noOrder: 'Todavía no tienes ningún pedido.' } : {
    clientMode: 'Client', businessMode: 'Business', yourOrder: 'Your order', clientEyebrow: 'REPAIR, ALTER, REWEAR', clientTitle: <>Give your clothes<br /><em>another life.</em></>, clientIntro: 'Thoughtful repairs and precise alterations, handled by local tailors who know Madrid and care about what you wear.', metaLocal: 'Local tailors', metaTurnaround: '3–10 day turnaround', help: 'What does your garment need?', helpNote: 'Choose the closest match. Your tailor will confirm the details.', drop: 'Where will you drop it off?', dropNote: 'Pick the location that works best for you.', more: 'Tell us a little more', moreNote: 'A photo helps your tailor prepare for the appointment.', next: 'Next', locker: 'Locker number', lockerHint: 'Choose an available locker', dropHint: 'Choose the Madrid location and locker for your garment', details: 'DETAILS', detailHint: 'Add a photo and description so your tailor can prepare your order.', addPhoto: 'Add a photo', photoReady: 'Photo ready. Click to change it.', description: 'Description for your tailor (optional)', submitOrder: 'Submit order', orderDetail: 'ORDER DETAIL', arrival: 'Arrival', deadline: 'Deadline', pickupDate: 'Pickup', status: 'Status', customerNotes: 'Customer notes', close: 'Save and close', tailorEyebrow: 'CHAMBERI ATELIER / TAILOR DESK', tailorTitle: 'Good morning, Ana', tailorIntro: 'Here is what needs your attention today.', orders: 'Your orders', newOrder: '+ New order', all: 'All', footer: 'Made for garments worth keeping.', dropoffConfirmation: 'Drop off your garment in locker', byClient: 'by the client', orderSaved: 'Order saved', lockerLocation: 'Locker location', orderStatus: 'Order received', completedDropoff: 'Drop-off completed', completeDropoff: 'Complete drop-off', orderSubmitted: 'Order submitted', deliveryInProgress: 'Delivery in progress', noLockers: 'No lockers are available at this location.', noOrder: 'You do not have an order yet.' }

  useEffect(() => {
    localStorage.setItem('zurcido-orders', JSON.stringify(businessOrders))
  }, [businessOrders])

  useEffect(() => {
    localStorage.setItem('zurcido-client-orders', JSON.stringify(clientOrders))
  }, [clientOrders])

  useEffect(() => {
    function syncStoredOrders(event) {
      if (event.key === 'zurcido-orders' && event.newValue) {
        const storedBusinessOrders = JSON.parse(event.newValue)
        if (Array.isArray(storedBusinessOrders)) setBusinessOrders(storedBusinessOrders)
      }
      if (event.key === 'zurcido-client-orders' && event.newValue) {
        const storedClientOrders = JSON.parse(event.newValue)
        if (Array.isArray(storedClientOrders)) setClientOrders(storedClientOrders)
      }
    }

    window.addEventListener('storage', syncStoredOrders)
    return () => window.removeEventListener('storage', syncStoredOrders)
  }, [])

  useEffect(() => {
    const timers = clientOrders
      .filter((order) => order.clientStatus === 'Entrega completada' && order.dropOffCompletedAt)
      .map((order) => {
        const remaining = Math.max(0, ORDER_HANDOFF_DELAY - (Date.now() - order.dropOffCompletedAt))
        return window.setTimeout(() => {
          setClientOrders((current) => current.map((item) => item.id === order.id ? { ...item, clientStatus: 'En camino' } : item))
          setBusinessOrders((current) => current.some((item) => item.id === order.id) ? current : [{ ...order, status: 'En camino' }, ...current])
        }, remaining)
      })

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [clientOrders])

  function navigate(nextView) {
    const path = `${appBasePath}/${nextView}`
    window.history.pushState({}, '', path)
    setView(nextView)
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto({ name: file.name, data: reader.result })
    reader.readAsDataURL(file)
  }

  function submitOrder() {
    // The deadline is anchored to the moment the customer submits the order.
    // oxlint-disable-next-line react/purity
    const submissionDate = new Date()
    const deadlineDate = new Date(submissionDate)
    deadlineDate.setDate(deadlineDate.getDate() + 3)
    const newOrder = { id: `M-${1050 + businessOrders.length + clientOrders.length}`, initials: (clientName || 'AN').slice(0, 2).toUpperCase(), name: clientName || 'Cliente de Madrid', item: 'Prenda para revisar', service: selectedService.name, arrival: isSpanish ? 'Hoy' : 'Today', deadline: formatOrderDate(deadlineDate, language), pickup: isSpanish ? 'Por confirmar' : 'To be confirmed', status: 'En camino', clientStatus: 'Pedido enviado', tone: 'orange', notes: clientNotes || 'Sin indicaciones adicionales.', photos: photo ? [photo] : [], locker, dropOff, dropOffName: selectedDropOff.name, dropOffAddress: selectedDropOff.address, dropOffAddressEn: selectedDropOff.addressEn }
    setClientOrders((current) => [...current, newOrder])
    setConfirmationOrder(newOrder)
    setShowDetails(false)
    setShowDropoffModal(false)
    setShowClientOrder(true)
  }

  function completeDropoff(orderId) {
    const order = clientOrders.find((item) => item.id === orderId)
    if (!order || order.clientStatus !== 'Pedido enviado') return
    // oxlint-disable-next-line react/purity
    const dropOffCompletedAt = Date.now()
    setClientOrders((current) => current.map((item) => item.id === orderId ? { ...item, dropOffCompleted: true, dropOffCompletedAt, clientStatus: 'Entrega completada' } : item))
    setConfirmationOrder(null)
  }

  function chooseService(nextService) {
    setService(nextService)
    const firstAvailableLocker = selectedDropOff.lockers.find((number) => !usedLockers.has(`${selectedDropOff.id}:${number}`))
    if (firstAvailableLocker) setLocker(firstAvailableLocker)
    setShowDropoffModal(true)
  }

  function updateOrder(updated) {
    setSelectedOrder(updated)
  }

  function saveAndCloseOrder() {
    if (!selectedOrder) return
    setBusinessOrders((current) => current.map((order) => order.id === selectedOrder.id ? selectedOrder : order))
    setClientOrders((current) => current.map((order) => order.id === selectedOrder.id ? { ...order, clientStatus: selectedOrder.status } : order))
    setSelectedOrder(null)
  }

  function orderText(value) {
    return isSpanish ? value : (orderEnglish[value] || statusEnglish[value] || value)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href={`${appBasePath}/client`} onClick={(event) => { event.preventDefault(); navigate('client') }} aria-label="Zurcido home"><span className="brand-mark">z</span><span>zurcido<span className="brand-dot">.</span></span></a>
        <div className="profile"><div className="language-switch"><button className={isSpanish ? 'active' : ''} onClick={() => setLanguage('es')} type="button">ES</button><button className={!isSpanish ? 'active' : ''} onClick={() => setLanguage('en')} type="button">EN</button></div>{view === 'client' && <><button className={`order-link ${clientOrders.length ? 'has-order' : ''}`} type="button" onClick={() => setShowClientOrder(true)}>{copy.yourOrder}{clientOrders.length > 0 && <span className="notification">{clientOrders.length}</span>}</button><span className="avatar">AM</span><span className="profile-name">Ana Martín</span><span className="chevron">⌄</span></>}</div>
      </header>

      {view === 'client' ? (
        <main className="client-page" id="top">
          <section className="client-intro">
            <div className="eyebrow">{copy.clientEyebrow}</div>
            <h1>{copy.clientTitle}</h1>
            <p>{copy.clientIntro}</p>
            <div className="intro-meta"><span><b className="meta-icon">✳</b> {copy.metaLocal}</span><span><b className="meta-icon">◷</b> {copy.metaTurnaround}</span></div>
          </section>

          <section className="booking-layout">
            <div className="booking-form">
              <div className="section-heading"><span className="step">01</span><div><h2>{copy.help}</h2><p>{copy.helpNote}</p></div></div>
              <div className="service-grid">
                {services.map((item) => <button key={item.id} type="button" className="service-card" onClick={() => chooseService(item.id)}><span className="service-icon">{item.icon}</span><span className="service-copy"><strong>{isSpanish ? item.nameEs : item.name}</strong><small>{isSpanish ? item.detailEs : item.detail}</small><small className="service-time">{item.time} <i>{item.price}</i></small></span></button>)}
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="tailor-page" id="top">
          <div className="tailor-header"><div><div className="eyebrow">{copy.tailorEyebrow}</div><h1>{copy.tailorTitle}<span className="heading-dot">.</span></h1><p>{copy.tailorIntro}</p></div></div>
          <div className="stats-row"><div><span>ACTIVE ORDERS</span><strong>12</strong><small>↑ 2 from yesterday</small></div><div><span>DUE THIS WEEK</span><strong>7</strong><small className="warning-text">2 due tomorrow</small></div><div><span>READY FOR PICKUP</span><strong>4</strong><small>Awaiting customers</small></div><div className="capacity"><span>WEEKLY CAPACITY</span><strong>68%</strong><div className="capacity-bar"><i></i></div><small>19 of 28 slots used</small></div></div>
          <section className="orders-section"><div className="orders-toolbar"><div><h2>{copy.orders}</h2><p>{isSpanish ? 'Miércoles, 14 de octubre de 2026' : 'Wednesday, October 14, 2026'}</p></div><div className="toolbar-actions"><button className="filter-button" type="button">{copy.all} <span>⌄</span></button><button className="filter-button icon-button" type="button">☷</button></div></div><div className="business-status-flow"><span>{isSpanish ? 'FLUJO DEL PEDIDO' : 'ORDER FLOW'}</span>{['Recibida', 'Trabajo iniciado', 'Lista para recoger'].map((status) => <span className={`status ${statusTones[status]}`} key={status}>{orderText(status)}</span>)}</div><div className="order-table"><div className="table-head"><span>{isSpanish ? 'PEDIDO' : 'ORDER'}</span><span>{isSpanish ? 'PRENDA Y SERVICIO' : 'GARMENT & SERVICE'}</span><span>{isSpanish ? 'LLEGADA' : 'ARRIVAL'}</span><span>{isSpanish ? 'FECHA LÍMITE' : 'DEADLINE'}</span><span>{isSpanish ? 'RECOGIDA' : 'PICKUP'}</span><span>{isSpanish ? 'ESTADO' : 'STATUS'}</span><span></span></div>{businessOrders.map((order) => <button className="order-row order-row-button" key={order.id} type="button" onClick={() => setSelectedOrder(order)}><div className="order-person"><span className={`order-avatar ${order.tone}`}>{order.initials}</span><span><strong>{order.id}</strong><small>{orderText(order.name)}</small></span></div><div className="garment"><strong>{orderText(order.item)}</strong><small>{orderText(order.service)}</small></div><span className="date">{orderText(order.arrival)}</span><span className="date deadline">{orderText(order.deadline)}</span><span className="date">{orderText(order.pickup)}</span><span className={`status ${statusTones[order.status] || 'received'}`}>{orderText(order.status)}</span><span className="more-button">•••</span></button>)}</div></section>
          <section className="tailor-bottom"><div className="attention-card"><span className="attention-icon">!</span><div><strong>2 deadlines tomorrow</strong><p>AT-1047 and AT-1046 need an update before 5pm.</p></div><button type="button">Review ↗</button></div><div className="quote-card"><span className="quote-mark">“</span><p>Small repairs are a quiet form of care.</p><span>— Studio note</span></div></section>
        </main>
      )}
      <footer><span>© 2026 zurcido.</span><span>{copy.footer}</span></footer>
      {showDropoffModal && <div className="modal-backdrop" onClick={() => setShowDropoffModal(false)}><section className="dropoff-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowDropoffModal(false)}>×</button><div className="eyebrow">02 / {isSpanish ? 'ENTREGA' : 'DROP-OFF'}</div><h2>{copy.drop}</h2><p className="modal-subtitle">{copy.dropHint}</p><div className="modal-drop-list">{dropOffs.map((item) => { const itemLockers = item.lockers.filter((number) => !usedLockers.has(`${item.id}:${number}`)); return <button key={item.id} type="button" className={`dropoff-card ${dropOff === item.id ? 'selected' : ''}`} onClick={() => { setDropOff(item.id); setLocker(itemLockers[0] || '') }}><span className="pin">⌖</span><span className="drop-copy"><strong>{item.name}</strong><small>{isSpanish ? item.address : item.addressEn}</small><small className="open-hours">● {isSpanish ? item.hours : item.hoursEn}</small></span><span className="distance">{item.distance}<span className="radio">{dropOff === item.id ? '✓' : ''}</span></span></button> })}</div><div className="locker-heading"><strong>{copy.locker}</strong><span>{availableLockers.length ? copy.lockerHint : copy.noLockers}</span></div><div className="locker-grid">{availableLockers.map((number) => <button key={number} type="button" className={locker === number ? 'selected' : ''} onClick={() => setLocker(number)}>{number}</button>)}</div><button className="primary-button" type="button" disabled={!locker || !availableLockers.includes(locker)} onClick={() => { setShowDropoffModal(false); setShowDetails(true) }}>{copy.next} <span>↗</span></button></section></div>}
      {showDetails && <div className="modal-backdrop" onClick={() => setShowDetails(false)}><section className="details-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowDetails(false)}>×</button><div className="eyebrow">03 / {isSpanish ? 'DETALLES' : 'DETAILS'}</div><h2>{copy.more}</h2><p className="modal-subtitle">{isSpanish ? 'Añade una foto y una descripción para que el sastre pueda preparar tu pedido.' : 'Add a photo and description so your tailor can prepare your order.'}</p><label className={`upload-box ${photo ? 'has-photo' : ''}`}><input type="file" accept="image/*" onChange={handlePhoto} />{photo ? <><img src={photo.data} alt="Vista previa de la prenda" /><span><strong>{photo.name}</strong><small>{isSpanish ? 'Foto lista. Haz clic para cambiarla.' : 'Photo ready. Click to change it.'}</small></span></> : <><span className="upload-icon">＋</span><span><strong>{isSpanish ? 'Añadir una foto' : 'Add a photo'}</strong><small>JPG o PNG</small></span></>}</label><div className="client-fields"><input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder={isSpanish ? 'Tu nombre' : 'Your name'} /><textarea value={clientNotes} onChange={(event) => setClientNotes(event.target.value)} placeholder={isSpanish ? 'Descripción para el sastre (opcional)' : 'Description for your tailor (optional)'} rows="4" /></div><button type="button" className="primary-button" onClick={submitOrder}>{isSpanish ? 'Enviar pedido' : 'Submit order'} <span>↗</span></button></section></div>}
      {showClientOrder && <div className="modal-backdrop" onClick={() => setShowClientOrder(false)}><section className="client-order-modal queue-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setShowClientOrder(false)}>×</button>{confirmationOrder && <div className="confirmation-banner"><div className="eyebrow">{copy.orderSaved}</div><h2>{copy.dropoffConfirmation} <span>{confirmationOrder.locker}</span> {copy.byClient}</h2><p className="modal-subtitle">{orderText(confirmationOrder.item)} · {orderText(confirmationOrder.service)}</p></div>}<div className="eyebrow">{copy.yourOrder}</div>{clientOrders.length ? <div className="client-order-queue">{clientOrders.map((order) => <article className={`queued-order ${order.dropOffCompleted ? 'completed' : ''}`} key={order.id}><div className="queued-order-heading"><strong>{order.id}</strong><span>{orderText(order.clientStatus || order.status)}</span></div><h3>{orderText(order.item)}</h3><p>{orderText(order.service)}</p><div className="queued-order-location"><b>{order.locker}</b><span>{order.dropOffName}<small>{isSpanish ? order.dropOffAddress : order.dropOffAddressEn}</small></span></div>{order.dropOffCompleted ? <div className="completed-label">✓ {order.clientStatus === 'Entrega completada' ? copy.completedDropoff : orderText(order.clientStatus)}</div> : <button className="complete-dropoff-button" type="button" disabled={order.clientStatus !== 'Pedido enviado'} onClick={() => completeDropoff(order.id)}>{copy.completeDropoff} <span>✓</span></button>}</article>)}</div> : <><h2>{copy.noOrder}</h2><p className="modal-subtitle">{copy.detailHint}</p></>}</section></div>}
      {selectedOrder && <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}><section className="order-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setSelectedOrder(null)}>×</button><div className="eyebrow">{copy.orderDetail}</div><h2>{selectedOrder.id} · {orderText(selectedOrder.name)}</h2><p className="modal-subtitle">{orderText(selectedOrder.item)} · {orderText(selectedOrder.service)}</p>{selectedOrder.photos?.length > 0 && <div className="order-photos">{selectedOrder.photos.map((image) => <img key={image.name} src={image.data} alt={`${orderText(selectedOrder.item)} ${isSpanish ? 'foto' : 'photo'}`} />)}</div>}<div className="detail-grid"><div><span>{copy.arrival}</span><strong>{orderText(selectedOrder.arrival)}</strong></div><div><span>{copy.deadline}</span><strong>{orderText(selectedOrder.deadline)}</strong></div><div><span>{copy.pickupDate}</span><strong>{orderText(selectedOrder.pickup)}</strong></div></div><div className="status-field"><span>{copy.status}</span><div className="status-action"><span className={`status ${statusTones[selectedOrder.status] || 'received'}`}>{orderText(selectedOrder.status)}</span><div className="status-controls">{previousBusinessStatus(selectedOrder.status) ? <button type="button" className="advance-status-button back-status-button" onClick={() => updateOrder({ ...selectedOrder, status: previousBusinessStatus(selectedOrder.status) })}><span>←</span> {orderText(previousBusinessStatus(selectedOrder.status))}</button> : null}{nextBusinessStatus(selectedOrder.status) ? <button type="button" className="advance-status-button" onClick={() => updateOrder({ ...selectedOrder, status: nextBusinessStatus(selectedOrder.status) })}>{orderText(nextBusinessStatus(selectedOrder.status))} <span>→</span></button> : null}</div></div></div><div className="modal-notes"><span>{copy.customerNotes}</span><p>{orderText(selectedOrder.notes) || (isSpanish ? 'Sin notas.' : 'No notes.')}</p></div><button className="primary-button" type="button" onClick={saveAndCloseOrder}>{copy.close}</button></section></div>}
    </div>
  )
}

export default App
