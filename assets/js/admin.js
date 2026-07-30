import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  collection,
  getDoc,
  getDocs,
  doc,
  limit,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const loginView = document.querySelector('#login-view');
const dashboardView = document.querySelector('#dashboard-view');
const loginForm = document.querySelector('#admin-login-form');
const loginStatus = document.querySelector('#login-status');
const userLabel = document.querySelector('#admin-user');
const logoutButton = document.querySelector('#cerrar-sesion');
const refreshButton = document.querySelector('#actualizar-datos');
const exportButton = document.querySelector('#exportar-csv');
const tableBody = document.querySelector('#tabla-evaluaciones-body');
const emptyState = document.querySelector('#sin-resultados');
const loadingState = document.querySelector('#cargando-datos');
const searchInput = document.querySelector('#filtro-texto');
const mechanismFilter = document.querySelector('#filtro-mecanismo');
const dateFilter = document.querySelector('#filtro-fecha');
const clearFiltersButton = document.querySelector('#limpiar-filtros');
const detailDialog = document.querySelector('#detalle-dialog');
const detailContent = document.querySelector('#detalle-contenido');
const closeDetailButton = document.querySelector('#cerrar-detalle');

let records = [];
let filteredRecords = [];

const SUPER_ROLES = new Set([
  'super_admin',
  'superadmin',
  'super_administrador',
  'superadministrador',
  'administrador_principal'
]);

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function roleFromData(data = {}) {
  return normalizeRole(data.role || data.rol || data.tipoUsuario || data.userRole || 'guest');
}

async function userIsSuperAdmin(user) {
  const token = await user.getIdTokenResult(true);
  const tokenRole = normalizeRole(
    token.claims.role ||
    token.claims.userRole ||
    (token.claims.super_admin === true ? 'super_admin' : '')
  );
  if (SUPER_ROLES.has(tokenRole)) return true;

  const paths = [`users/${user.uid}`];
  if (user.email) paths.push(`users/${user.email}`);

  for (const path of paths) {
    try {
      const snapshot = await getDoc(doc(db, path));
      if (!snapshot.exists()) continue;
      const data = snapshot.data();
      if (data.active === false) continue;
      if (SUPER_ROLES.has(roleFromData(data))) return true;
    } catch (error) {
      console.warn(`No fue posible revisar ${path}:`, error);
    }
  }
  return false;
}

function setLoginStatus(message, type = 'info') {
  loginStatus.textContent = message;
  loginStatus.className = `form-status ${type}`;
  loginStatus.hidden = false;
}

function showLogin() {
  dashboardView.hidden = true;
  loginView.hidden = false;
  userLabel.textContent = '';
}

function showDashboard(user) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  userLabel.textContent = user.email || user.uid;
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-CO');
}

function formatActivityDate(value) {
  if (!value) return 'Sin fecha';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function renderStats(data) {
  document.querySelector('#kpi-total').textContent = data.length.toLocaleString('es-CO');
  const satisfaction = average(data.map((item) => Number(item.satisfaccionGeneral)));
  document.querySelector('#kpi-promedio').textContent = satisfaction ? satisfaction.toFixed(1) : '—';
  const recommendations = data.filter((item) => item.recomendaria === true).length;
  document.querySelector('#kpi-recomendacion').textContent = data.length
    ? `${Math.round((recommendations / data.length) * 100)}%`
    : '—';
  document.querySelector('#kpi-ultima').textContent = data.length ? formatDate(data[0].createdAt) : '—';
}

function addCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.appendChild(cell);
}

function renderTable(data) {
  tableBody.replaceChildren();
  emptyState.hidden = data.length > 0;
  data.forEach((item) => {
    const row = document.createElement('tr');
    addCell(row, item.codigo || item.id);
    addCell(row, item.actividad || 'Sin actividad');
    addCell(row, item.mecanismo || 'Sin mecanismo');
    addCell(row, formatActivityDate(item.fechaActividad));
    addCell(row, `${item.satisfaccionGeneral || '—'} / 5`);
    addCell(row, item.recomendaria === true ? 'Sí' : 'No');
    addCell(row, formatDate(item.createdAt));

    const actionCell = document.createElement('td');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn secondary small';
    button.textContent = 'Ver detalle';
    button.addEventListener('click', () => openDetail(item));
    actionCell.appendChild(button);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

function addDetail(label, value) {
  const item = document.createElement('div');
  item.className = 'detail-item';
  const title = document.createElement('strong');
  title.textContent = label;
  const content = document.createElement('p');
  content.textContent = value === '' || value == null ? 'No informado' : String(value);
  item.append(title, content);
  detailContent.appendChild(item);
}

function openDetail(item) {
  detailContent.replaceChildren();
  addDetail('Código', item.codigo || item.id);
  addDetail('Actividad', item.actividad);
  addDetail('Fecha de la actividad', formatActivityDate(item.fechaActividad));
  addDetail('Mecanismo', item.mecanismo);
  addDetail('Territorio', item.territorio);
  addDetail('Tipo de participante', item.tipoParticipante);
  addDetail('Modalidad', item.modalidad);
  addDetail('Información previa', `${item.informacionPrevia} / 5`);
  addDetail('Facilidad de acceso', `${item.facilidadAcceso} / 5`);
  addDetail('Claridad de la metodología', `${item.claridadMetodologia} / 5`);
  addDetail('Oportunidad de participar', `${item.oportunidadParticipar} / 5`);
  addDetail('Calidad de la respuesta', `${item.calidadRespuesta} / 5`);
  addDetail('Satisfacción general', `${item.satisfaccionGeneral} / 5`);
  addDetail('Recomendaría el espacio', item.recomendaria === true ? 'Sí' : 'No');
  addDetail('Aspectos positivos', item.aspectosPositivos);
  addDetail('Aspectos por mejorar', item.aspectosMejorar);
  addDetail('Seguimiento esperado', item.compromisoSeguimiento);
  addDetail('Fecha de registro', formatDate(item.createdAt));
  detailDialog.showModal();
}

function applyFilters() {
  const text = searchInput.value.trim().toLowerCase();
  const mechanism = mechanismFilter.value;
  const activityDate = dateFilter.value;

  filteredRecords = records.filter((item) => {
    const haystack = [item.codigo, item.actividad, item.territorio, item.tipoParticipante]
      .join(' ')
      .toLowerCase();
    return (!text || haystack.includes(text))
      && (!mechanism || item.mecanismo === mechanism)
      && (!activityDate || item.fechaActividad === activityDate);
  });

  renderStats(filteredRecords);
  renderTable(filteredRecords);
  exportButton.disabled = filteredRecords.length === 0;
}

async function loadRecords() {
  loadingState.hidden = false;
  emptyState.hidden = true;
  refreshButton.disabled = true;

  try {
    const snapshot = await getDocs(query(
      collection(db, 'evaluacionesParticipacion'),
      orderBy('createdAt', 'desc'),
      limit(1000)
    ));
    records = snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
    applyFilters();
  } catch (error) {
    console.error('Error al consultar evaluaciones:', error);
    tableBody.replaceChildren();
    emptyState.hidden = false;
    emptyState.textContent = error.code?.includes('permission-denied')
      ? 'La cuenta inició sesión, pero las reglas no reconocen el rol super_admin.'
      : 'No fue posible cargar las evaluaciones.';
  } finally {
    loadingState.hidden = true;
    refreshButton.disabled = false;
  }
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
  const columns = [
    ['codigo', 'Código'],
    ['actividad', 'Actividad'],
    ['fechaActividad', 'Fecha actividad'],
    ['mecanismo', 'Mecanismo'],
    ['territorio', 'Territorio'],
    ['tipoParticipante', 'Tipo participante'],
    ['modalidad', 'Modalidad'],
    ['informacionPrevia', 'Información previa'],
    ['facilidadAcceso', 'Facilidad de acceso'],
    ['claridadMetodologia', 'Claridad metodología'],
    ['oportunidadParticipar', 'Oportunidad de participar'],
    ['calidadRespuesta', 'Calidad de respuesta'],
    ['satisfaccionGeneral', 'Satisfacción general'],
    ['recomendaria', 'Recomendaría'],
    ['aspectosPositivos', 'Aspectos positivos'],
    ['aspectosMejorar', 'Aspectos por mejorar'],
    ['compromisoSeguimiento', 'Seguimiento esperado'],
    ['estado', 'Estado'],
    ['createdAt', 'Fecha de registro']
  ];

  const lines = [columns.map(([, label]) => csvEscape(label)).join(',')];
  filteredRecords.forEach((item) => {
    lines.push(columns.map(([key]) => {
      if (key === 'createdAt') return csvEscape(formatDate(item[key]));
      if (key === 'recomendaria') return csvEscape(item[key] === true ? 'Sí' : 'No');
      return csvEscape(item[key]);
    }).join(','));
  });

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `evaluaciones-participacion-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1000);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginStatus.hidden = true;
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Ingresando…';

  try {
    await signInWithEmailAndPassword(
      auth,
      loginForm.elements.email.value.trim(),
      loginForm.elements.password.value
    );
  } catch (error) {
    console.error('Error de autenticación:', error);
    setLoginStatus('Correo, contraseña o configuración de Authentication incorrectos.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Ingresar';
  }
});

logoutButton.addEventListener('click', () => signOut(auth));
refreshButton.addEventListener('click', loadRecords);
exportButton.addEventListener('click', exportCsv);
searchInput.addEventListener('input', applyFilters);
mechanismFilter.addEventListener('change', applyFilters);
dateFilter.addEventListener('change', applyFilters);
clearFiltersButton.addEventListener('click', () => {
  searchInput.value = '';
  mechanismFilter.value = '';
  dateFilter.value = '';
  applyFilters();
});
closeDetailButton.addEventListener('click', () => detailDialog.close());
detailDialog.addEventListener('click', (event) => {
  if (event.target === detailDialog) detailDialog.close();
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showLogin();
    return;
  }

  try {
    if (!(await userIsSuperAdmin(user))) {
      await signOut(auth);
      showLogin();
      setLoginStatus('Acceso denegado: esta cuenta no tiene rol super_admin activo.', 'error');
      return;
    }
    showDashboard(user);
    await loadRecords();
  } catch (error) {
    console.error('No fue posible validar el rol:', error);
    await signOut(auth);
    showLogin();
    setLoginStatus('No fue posible validar el rol administrativo.', 'error');
  }
});
