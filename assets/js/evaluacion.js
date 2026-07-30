import { db } from './firebase-config.js';
import {
  addDoc,
  collection,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const form = document.querySelector('#form-evaluacion');
const submitButton = document.querySelector('#enviar-evaluacion');
const clearButton = document.querySelector('#limpiar-evaluacion');
const statusBox = document.querySelector('#estado-envio');
const receiptBox = document.querySelector('#comprobante-evaluacion');
const receiptCode = document.querySelector('#codigo-evaluacion');

function generateCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `EV-2026-${Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('')}`;
}

function setStatus(message, type = 'info') {
  statusBox.textContent = message;
  statusBox.className = `form-status ${type}`;
  statusBox.hidden = false;
  statusBox.focus();
}

function readInteger(name) {
  return Number.parseInt(form.elements[name].value, 10);
}

function readBoolean(name) {
  return form.elements[name].value === 'true';
}

function saveDraft() {
  const draft = {};
  const data = new FormData(form);
  data.forEach((value, key) => {
    if (key !== 'autorizacionTratamiento') draft[key] = value;
  });
  localStorage.setItem('participa_evaluacion_draft', JSON.stringify(draft));
}

function restoreDraft() {
  const raw = localStorage.getItem('participa_evaluacion_draft');
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    Object.entries(draft).forEach(([name, value]) => {
      const field = form.elements[name];
      if (!field) return;
      if (field instanceof RadioNodeList) {
        const option = form.querySelector(`[name="${CSS.escape(name)}"][value="${CSS.escape(String(value))}"]`);
        if (option) option.checked = true;
      } else {
        field.value = value;
      }
    });
  } catch (error) {
    console.warn('No fue posible recuperar el borrador:', error);
  }
}

function buildPayload() {
  const codigo = generateCode();
  return {
    codigo,
    tipoFormulario: 'evaluacion_participacion_2026',
    vigencia: 2026,
    actividad: form.elements.actividad.value.trim(),
    fechaActividad: form.elements.fechaActividad.value,
    mecanismo: form.elements.mecanismo.value,
    territorio: form.elements.territorio.value.trim(),
    tipoParticipante: form.elements.tipoParticipante.value,
    modalidad: form.elements.modalidad.value,
    informacionPrevia: readInteger('informacionPrevia'),
    facilidadAcceso: readInteger('facilidadAcceso'),
    claridadMetodologia: readInteger('claridadMetodologia'),
    oportunidadParticipar: readInteger('oportunidadParticipar'),
    calidadRespuesta: readInteger('calidadRespuesta'),
    satisfaccionGeneral: readInteger('satisfaccionGeneral'),
    recomendaria: readBoolean('recomendaria'),
    aspectosPositivos: form.elements.aspectosPositivos.value.trim(),
    aspectosMejorar: form.elements.aspectosMejorar.value.trim(),
    compromisoSeguimiento: form.elements.compromisoSeguimiento.value.trim(),
    autorizacionTratamiento: form.elements.autorizacionTratamiento.checked,
    estado: 'recibida',
    origen: 'github_pages',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

function friendlyError(error) {
  const code = error?.code || '';
  if (code.includes('permission-denied')) {
    return 'Firebase rechazó el registro. Verifique que las reglas nuevas estén publicadas exactamente como se entregan en la carpeta firebase.';
  }
  if (code.includes('unavailable')) {
    return 'No fue posible conectarse con Firebase. Revise la conexión a internet e intente nuevamente.';
  }
  return 'No se pudo guardar la evaluación. Intente nuevamente o comuníquese con la Alcaldía.';
}

form?.addEventListener('input', saveDraft);
form?.addEventListener('change', saveDraft);

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  receiptBox.hidden = true;
  statusBox.hidden = true;

  if (!form.reportValidity()) return;
  if (!navigator.onLine) {
    setStatus('No hay conexión a internet. El borrador permanece guardado en este dispositivo.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Guardando…';

  try {
    const payload = buildPayload();
    await addDoc(collection(db, 'evaluacionesParticipacion'), payload);
    localStorage.removeItem('participa_evaluacion_draft');
    receiptCode.textContent = payload.codigo;
    receiptBox.hidden = false;
    form.reset();
    setStatus('La evaluación fue guardada correctamente en Firebase.', 'success');
  } catch (error) {
    console.error('Error al guardar la evaluación:', error);
    setStatus(friendlyError(error), 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Enviar evaluación';
  }
});

clearButton?.addEventListener('click', () => {
  form.reset();
  localStorage.removeItem('participa_evaluacion_draft');
  receiptBox.hidden = true;
  statusBox.hidden = true;
});

restoreDraft();
