const acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
const savedKey = 'techpulseEnrollment';

function setStep(step) {
  const panels = document.querySelectorAll('[data-panel]');
  const steps = document.querySelectorAll('[data-step-indicator]');

  panels.forEach((panel) => {
    const shouldShow = Number(panel.dataset.panel) === step;
    panel.classList.toggle('hidden', !shouldShow);
  });

  steps.forEach((stepEl) => {
    const value = Number(stepEl.dataset.stepIndicator);
    const num = stepEl.querySelector('.num');
    stepEl.classList.remove('is-active', 'is-complete');

    if (value < step) {
      stepEl.classList.add('is-complete');
      if (num) num.textContent = '✓';
    } else if (value === step) {
      stepEl.classList.add('is-active');
      if (num) num.textContent = String(value);
    } else {
      if (num) num.textContent = String(value);
    }
  });
}

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (field) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  if (errorEl) {
    errorEl.textContent = message || '';
  }
}

function validateDetailsForm() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const whatsapp = document.getElementById('whatsapp').value.trim();
  let isValid = true;

  if (!name) {
    showError('name', 'Full name is required.');
    isValid = false;
  } else {
    showError('name', '');
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    showError('email', 'Email is required.');
    isValid = false;
  } else if (!emailPattern.test(email)) {
    showError('email', 'Please enter a valid email address.');
    isValid = false;
  } else {
    showError('email', '');
  }

  if (!whatsapp) {
    showError('whatsapp', 'WhatsApp number is required.');
    isValid = false;
  } else {
    showError('whatsapp', '');
  }

  return isValid;
}

function persistEnrollment(data) {
  const existing = JSON.parse(localStorage.getItem(savedKey) || '{}');
  localStorage.setItem(savedKey, JSON.stringify({ ...existing, ...data }));
}

function hydrateEnrollment() {
  const saved = JSON.parse(localStorage.getItem(savedKey) || '{}');
  if (!saved || !Object.keys(saved).length) return;

  if (saved.fullName) {
    const field = document.getElementById('name');
    if (field) field.value = saved.fullName;
  }

  if (saved.email) {
    const field = document.getElementById('email');
    if (field) field.value = saved.email;
  }

  if (saved.whatsapp) {
    const field = document.getElementById('whatsapp');
    if (field) field.value = saved.whatsapp;
  }
}

function bindDetailForm() {
  const form = document.getElementById('detailsForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateDetailsForm()) return;

    const payload = {
      fullName: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      whatsapp: document.getElementById('whatsapp').value.trim(),
      step: 2,
    };

    persistEnrollment(payload);
    setStep(2);
  });
}

function copyToClipboard(value, button) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(value)
      .then(() => {
        button.textContent = 'Copied ✓';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 1400);
      })
      .catch(() => {
        fallbackCopy(value, button);
      });
    return;
  }

  fallbackCopy(value, button);
}

function fallbackCopy(value, button) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    button.textContent = 'Copied ✓';
  } catch (error) {
    button.textContent = 'Failed';
  }

  setTimeout(() => {
    button.textContent = 'Copy';
    button.classList.remove('copied');
  }, 1400);

  document.body.removeChild(textarea);
}

function bindCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.copy || '';
      if (!value) return;
      copyToClipboard(value, button);
    });
  });
}

function bindFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!button || !answer) return;

    button.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');

      items.forEach((faqItem) => {
        const faqButton = faqItem.querySelector('.faq-question');
        const faqAnswer = faqItem.querySelector('.faq-answer');
        faqItem.classList.remove('is-open');
        faqButton?.setAttribute('aria-expanded', 'false');
        if (faqAnswer) faqAnswer.hidden = true;
      });

      if (willOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
      }
    });
  });
}

function bindPaymentStep() {
  const btn = document.getElementById('paymentDone');
  const backBtn = document.getElementById('backToStepOne');

  if (btn) {
    btn.addEventListener('click', () => {
      persistEnrollment({ step: 3 });
      setStep(3);
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      persistEnrollment({ step: 1 });
      setStep(1);
    });
  }
}

function bindUploadStep() {
  const fileInput = document.getElementById('proof');
  const fileName = document.getElementById('fileName');
  const proofError = document.getElementById('proofError');
  const finishBtn = document.getElementById('finish');
  const successState = document.getElementById('successState');
  const successDetails = document.getElementById('successDetails');

  if (!fileInput || !finishBtn) return;

  fileInput.addEventListener('change', () => {
    const selected = fileInput.files && fileInput.files[0];
    if (!selected) {
      fileName.textContent = 'No file selected.';
      proofError.textContent = '';
      return;
    }

    const isAllowed = acceptedTypes.includes(selected.type) || /\.(jpg|jpeg|png|pdf)$/i.test(selected.name);
    if (!isAllowed) {
      fileName.textContent = 'No file selected.';
      proofError.textContent = 'Please select a JPG, JPEG, PNG, or PDF file.';
      fileInput.value = '';
      return;
    }

    fileName.textContent = selected.name;
    proofError.textContent = '';
  });

  finishBtn.addEventListener('click', () => {
    const selected = fileInput.files && fileInput.files[0];
    if (!selected) {
      proofError.textContent = 'Please select a payment proof file before continuing.';
      return;
    }

    const isAllowed = acceptedTypes.includes(selected.type) || /\.(jpg|jpeg|png|pdf)$/i.test(selected.name);
    if (!isAllowed) {
      proofError.textContent = 'Please select a valid JPG, JPEG, PNG, or PDF file.';
      return;
    }

    const saved = JSON.parse(localStorage.getItem(savedKey) || '{}');
    const name = saved.fullName || 'Student';
    const email = saved.email || 'Not provided';

    successState.classList.remove('hidden');
    successDetails.textContent = `${name} • ${email}`;
    proofError.textContent = '';
    finishBtn.disabled = true;
    finishBtn.style.opacity = '0.7';
    finishBtn.textContent = 'Submitted';
  });
}

function initEnrollment() {
  const startFresh = new URLSearchParams(window.location.search).get('start') === '1';
  hydrateEnrollment();
  const saved = JSON.parse(localStorage.getItem(savedKey) || '{}');
  if (startFresh) {
    persistEnrollment({ step: 1 });
    setStep(1);
  } else if (saved.step === 2) {
    setStep(2);
  } else if (saved.step === 3) {
    setStep(3);
  } else {
    setStep(1);
  }

  bindDetailForm();
  bindPaymentStep();
  bindUploadStep();
  bindCopyButtons();
  bindFaqAccordion();
}

function initLandingInteractions() {
  document.querySelectorAll('.module').forEach((item) => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
      const icon = item.querySelector('i');
      if (icon) {
        icon.textContent = item.classList.contains('active') ? '−' : '+';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLandingInteractions();
  initEnrollment();
});
