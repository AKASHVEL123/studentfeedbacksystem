/**
 * Student Feedback Management System
 * College Mini Project - Vanilla JavaScript Frontend
 * Communicates with FastAPI REST API via fetch()
 */

// Determine API Base URL:
// - If running on Live Server (e.g. port 5500 or 5501) or file://, default to FastAPI on http://localhost:8000
// - If running on the same server (e.g. dev server port 3000), use relative path ""
const isLocalFileOrLiveServer =
  window.location.protocol === 'file:' ||
  window.location.port === '5500' ||
  window.location.port === '5501';

const API_BASE_URL = isLocalFileOrLiveServer ? 'http://localhost:8000' : '';

// Global State
let allFeedbacks = [];
let pendingDeleteId = null;
let currentViewingFeedback = null;

// DOM Elements
const feedbackTableBody = document.getElementById('feedbackTableBody');
const searchInput = document.getElementById('searchInput');
const departmentFilter = document.getElementById('departmentFilter');
const ratingFilter = document.getElementById('ratingFilter');
const tableCountBadge = document.getElementById('tableCountBadge');
const apiStatusBadge = document.getElementById('apiStatusBadge');

// Stat Elements
const statTotalCount = document.getElementById('statTotalCount');
const statAvgRating = document.getElementById('statAvgRating');
const statTopRatings = document.getElementById('statTopRatings');
const statDeptCount = document.getElementById('statDeptCount');

// Form Modal Elements
const feedbackModal = document.getElementById('feedbackModal');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeFormModalBtn = document.getElementById('closeFormModalBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const feedbackForm = document.getElementById('feedbackForm');
const modalTitle = document.getElementById('modalTitle');
const saveFeedbackBtn = document.getElementById('saveFeedbackBtn');

// Form Field Elements
const feedbackIdInput = document.getElementById('feedbackId');
const studentNameInput = document.getElementById('studentNameInput');
const registerNumberInput = document.getElementById('registerNumberInput');
const departmentSelect = document.getElementById('departmentSelect');
const emailInput = document.getElementById('emailInput');
const ratingValueInput = document.getElementById('ratingValue');
const feedbackTextInput = document.getElementById('feedbackTextInput');
const starRatingGroup = document.getElementById('starRatingGroup');
const ratingLabelHint = document.getElementById('ratingLabelHint');

// View Modal Elements
const viewModal = document.getElementById('viewModal');
const closeViewModalBtn = document.getElementById('closeViewModalBtn');
const closeViewBottomBtn = document.getElementById('closeViewBottomBtn');
const editFromViewBtn = document.getElementById('editFromViewBtn');
const viewDetailContent = document.getElementById('viewDetailContent');

// Delete Modal Elements
const deleteModal = document.getElementById('deleteModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteStudentNameText = document.getElementById('deleteStudentNameText');
const deleteRegNumText = document.getElementById('deleteRegNumText');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// Rating text labels
const ratingLabels = {
  1: '1 Star - Poor',
  2: '2 Stars - Fair',
  3: '3 Stars - Good',
  4: '4 Stars - Very Good',
  5: '5 Stars - Excellent'
};

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initStarRating();
  initEventListeners();
  loadAllFeedbacks();
});

/* ==========================================================================
   Event Listeners Setup
   ========================================================================== */
function initEventListeners() {
  // Add Feedback Modal Trigger
  openAddModalBtn.addEventListener('click', () => openFormModal('add'));

  // Close Form Modal
  closeFormModalBtn.addEventListener('click', closeFormModal);
  cancelFormBtn.addEventListener('click', closeFormModal);

  // Close View Modal
  closeViewModalBtn.addEventListener('click', closeViewModal);
  closeViewBottomBtn.addEventListener('click', closeViewModal);

  // Edit from View Modal
  editFromViewBtn.addEventListener('click', () => {
    if (currentViewingFeedback) {
      closeViewModal();
      openFormModal('edit', currentViewingFeedback);
    }
  });

  // Delete Modal Buttons
  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', executeDelete);

  // Search & Filter Listeners
  searchInput.addEventListener('input', applyFilters);
  departmentFilter.addEventListener('change', applyFilters);
  ratingFilter.addEventListener('change', applyFilters);

  // Form Submit Listener
  feedbackForm.addEventListener('submit', handleFormSubmit);

  // Close Modals on Backdrop Click
  window.addEventListener('click', (e) => {
    if (e.target === feedbackModal) closeFormModal();
    if (e.target === viewModal) closeViewModal();
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Close Modals on ESC Key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFormModal();
      closeViewModal();
      closeDeleteModal();
    }
  });
}

/* ==========================================================================
   Star Rating Interaction
   ========================================================================== */
function initStarRating() {
  const stars = starRatingGroup.querySelectorAll('span[data-value]');

  stars.forEach((star) => {
    // Click to select
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'), 10);
      setStarRating(val);
    });

    // Hover effect
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.getAttribute('data-value'), 10);
      highlightStars(val);
    });
  });

  starRatingGroup.addEventListener('mouseleave', () => {
    const currentVal = parseInt(ratingValueInput.value, 10) || 5;
    highlightStars(currentVal);
  });

  // Default value
  setStarRating(5);
}

function setStarRating(val) {
  ratingValueInput.value = val;
  highlightStars(val);
  ratingLabelHint.textContent = ratingLabels[val] || `${val} Stars`;
  hideFieldError('rating');
}

function highlightStars(val) {
  const stars = starRatingGroup.querySelectorAll('span[data-value]');
  stars.forEach((star) => {
    const starVal = parseInt(star.getAttribute('data-value'), 10);
    if (starVal <= val) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });
}

/* ==========================================================================
   CRUD Operation 1: READ / View All Feedback (GET /feedback)
   ========================================================================== */
async function loadAllFeedbacks() {
  showLoadingInTable();

  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    allFeedbacks = await response.json();
    apiStatusBadge.textContent = 'API Connected';
    apiStatusBadge.parentElement.style.borderColor = '#bfdbfe';

    updateStats(allFeedbacks);
    applyFilters();
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    apiStatusBadge.textContent = 'Backend Offline';
    apiStatusBadge.parentElement.style.borderColor = '#fecaca';
    showToast('Failed to load feedbacks. Make sure FastAPI backend is running.', 'error');
    showErrorInTable('Failed to connect to backend server. Please check FastAPI on http://localhost:8000.');
  }
}

/* ==========================================================================
   CRUD Operation 2: READ / View One Feedback (GET /feedback/{id})
   ========================================================================== */
async function viewFeedback(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        showToast(`Feedback #${id} not found`, 'error');
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    currentViewingFeedback = data;
    renderViewModal(data);
    openViewModal();
  } catch (error) {
    console.error('Error viewing feedback:', error);
    showToast('Unable to fetch feedback details.', 'error');
  }
}

function renderViewModal(item) {
  const starsStr = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
  const formattedDate = formatDate(item.created_at);

  viewDetailContent.innerHTML = `
    <div class="detail-header-info">
      <div class="detail-student-title">
        <h3>${escapeHtml(item.student_name)}</h3>
        <span class="reg-badge">${escapeHtml(item.register_number)}</span>
      </div>
      <div>
        <span class="table-id-badge">ID #${item.id}</span>
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Department:</div>
      <div class="detail-value"><span class="dept-badge">${escapeHtml(item.department)}</span></div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Email Address:</div>
      <div class="detail-value">${item.email ? escapeHtml(item.email) : '<span style="color:#94a3b8">Not provided</span>'}</div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Rating:</div>
      <div class="detail-value">
        <span class="rating-stars">${starsStr}</span>
        <span class="rating-score">(${item.rating} / 5 &bull; ${ratingLabels[item.rating]})</span>
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Submitted On:</div>
      <div class="detail-value date-text">${formattedDate}</div>
    </div>

    <div>
      <div class="detail-label" style="margin-bottom: 0.35rem;">Feedback Comments:</div>
      <div class="detail-feedback-box">${escapeHtml(item.feedback)}</div>
    </div>
  `;
}

/* ==========================================================================
   CRUD Operation 3: CREATE & 4: UPDATE (POST /feedback & PUT /feedback/{id})
   ========================================================================== */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Validate form
  const isValid = validateForm();
  if (!isValid) return;

  const id = feedbackIdInput.value;
  const isEditMode = Boolean(id);

  const payload = {
    student_name: studentNameInput.value.trim(),
    register_number: registerNumberInput.value.trim(),
    department: departmentSelect.value.trim(),
    email: emailInput.value.trim() || null,
    rating: parseInt(ratingValueInput.value, 10),
    feedback: feedbackTextInput.value.trim()
  };

  saveFeedbackBtn.disabled = true;
  saveFeedbackBtn.innerHTML = '<span>⏳</span> Saving...';

  try {
    const url = isEditMode ? `${API_BASE_URL}/feedback/${id}` : `${API_BASE_URL}/feedback`;
    const method = isEditMode ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detailMsg = errorData.detail || `Server error (${response.status})`;
      throw new Error(detailMsg);
    }

    closeFormModal();

    if (isEditMode) {
      showToast('Student feedback updated successfully!', 'success');
    } else {
      showToast('New student feedback submitted successfully!', 'success');
    }

    // Refresh feedbacks table
    await loadAllFeedbacks();
  } catch (error) {
    console.error('Submit error:', error);
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    saveFeedbackBtn.disabled = false;
    saveFeedbackBtn.innerHTML = '<span>💾</span> ' + (isEditMode ? 'Update Feedback' : 'Submit Feedback');
  }
}

/* ==========================================================================
   CRUD Operation 5: DELETE (DELETE /feedback/{id})
   ========================================================================== */
function openDeleteConfirm(id, studentName, regNumber) {
  pendingDeleteId = id;
  deleteStudentNameText.textContent = studentName;
  deleteRegNumText.textContent = regNumber;
  deleteModal.classList.add('active');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  deleteModal.classList.remove('active');
}

async function executeDelete() {
  if (!pendingDeleteId) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';

  try {
    const response = await fetch(`${API_BASE_URL}/feedback/${pendingDeleteId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Feedback not found or already deleted');
      }
      throw new Error(`Failed to delete record (${response.status})`);
    }

    showToast(`Feedback #${pendingDeleteId} deleted successfully.`, 'success');
    closeDeleteModal();
    await loadAllFeedbacks();
  } catch (error) {
    console.error('Delete error:', error);
    showToast(`Delete failed: ${error.message}`, 'error');
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = '🗑️ Delete Permanently';
  }
}

/* ==========================================================================
   Edit Operation: Load single feedback into form
   ========================================================================== */
async function editFeedback(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback/${id}`);
    if (!response.ok) {
      throw new Error('Feedback record could not be found');
    }
    const data = await response.json();
    openFormModal('edit', data);
  } catch (error) {
    console.error('Edit load error:', error);
    showToast('Failed to load feedback details for editing.', 'error');
  }
}

/* ==========================================================================
   Form Modal Open / Close & Populate
   ========================================================================== */
function openFormModal(mode, data = null) {
  resetFormErrors();
  feedbackForm.reset();

  if (mode === 'edit' && data) {
    modalTitle.textContent = `Edit Feedback (ID #${data.id})`;
    saveFeedbackBtn.innerHTML = '<span>💾</span> Update Feedback';
    feedbackIdInput.value = data.id;
    studentNameInput.value = data.student_name;
    registerNumberInput.value = data.register_number;
    departmentSelect.value = data.department;
    emailInput.value = data.email || '';
    feedbackTextInput.value = data.feedback;
    setStarRating(data.rating || 5);
  } else {
    modalTitle.textContent = 'Add Student Feedback';
    saveFeedbackBtn.innerHTML = '<span>💾</span> Submit Feedback';
    feedbackIdInput.value = '';
    setStarRating(5);
  }

  feedbackModal.classList.add('active');
  studentNameInput.focus();
}

function closeFormModal() {
  feedbackModal.classList.remove('active');
  feedbackForm.reset();
  resetFormErrors();
}

function openViewModal() {
  viewModal.classList.add('active');
}

function closeViewModal() {
  viewModal.classList.remove('active');
  currentViewingFeedback = null;
}

/* ==========================================================================
   Form Validation
   ========================================================================== */
function validateForm() {
  let isValid = true;
  resetFormErrors();

  const nameVal = studentNameInput.value.trim();
  if (!nameVal || nameVal.length < 2) {
    showFieldError('name');
    isValid = false;
  }

  const regVal = registerNumberInput.value.trim();
  if (!regVal || regVal.length < 2) {
    showFieldError('reg');
    isValid = false;
  }

  const deptVal = departmentSelect.value.trim();
  if (!deptVal) {
    showFieldError('dept');
    isValid = false;
  }

  const emailVal = emailInput.value.trim();
  if (emailVal) {
    // Simple standard email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      showFieldError('email');
      isValid = false;
    }
  }

  const ratingVal = parseInt(ratingValueInput.value, 10);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    showFieldError('rating');
    isValid = false;
  }

  const feedbackVal = feedbackTextInput.value.trim();
  if (!feedbackVal || feedbackVal.length < 5) {
    showFieldError('feedback');
    isValid = false;
  }

  return isValid;
}

function showFieldError(type) {
  const map = {
    name: { input: studentNameInput, msg: document.getElementById('nameErrorMsg') },
    reg: { input: registerNumberInput, msg: document.getElementById('regErrorMsg') },
    dept: { input: departmentSelect, msg: document.getElementById('deptErrorMsg') },
    email: { input: emailInput, msg: document.getElementById('emailErrorMsg') },
    rating: { input: starRatingGroup, msg: document.getElementById('ratingErrorMsg') },
    feedback: { input: feedbackTextInput, msg: document.getElementById('feedbackErrorMsg') }
  };

  const target = map[type];
  if (target) {
    if (target.input.classList) target.input.classList.add('error-field');
    if (target.msg) target.msg.classList.add('visible');
  }
}

function hideFieldError(type) {
  const map = {
    name: { input: studentNameInput, msg: document.getElementById('nameErrorMsg') },
    reg: { input: registerNumberInput, msg: document.getElementById('regErrorMsg') },
    dept: { input: departmentSelect, msg: document.getElementById('deptErrorMsg') },
    email: { input: emailInput, msg: document.getElementById('emailErrorMsg') },
    rating: { input: starRatingGroup, msg: document.getElementById('ratingErrorMsg') },
    feedback: { input: feedbackTextInput, msg: document.getElementById('feedbackErrorMsg') }
  };

  const target = map[type];
  if (target) {
    if (target.input.classList) target.input.classList.remove('error-field');
    if (target.msg) target.msg.classList.remove('visible');
  }
}

function resetFormErrors() {
  ['name', 'reg', 'dept', 'email', 'rating', 'feedback'].forEach(hideFieldError);
}

/* ==========================================================================
   Filter, Search & Render Table
   ========================================================================== */
function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();
  const selectedDept = departmentFilter.value;
  const selectedRating = ratingFilter.value;

  const filtered = allFeedbacks.filter((item) => {
    // Search query matches student name, register number, department, or feedback text
    const matchesSearch =
      !query ||
      item.student_name.toLowerCase().includes(query) ||
      item.register_number.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      item.feedback.toLowerCase().includes(query);

    // Department Filter
    const matchesDept = selectedDept === 'ALL' || item.department === selectedDept;

    // Rating Filter
    const matchesRating = selectedRating === 'ALL' || item.rating.toString() === selectedRating;

    return matchesSearch && matchesDept && matchesRating;
  });

  renderTable(filtered);
}

function renderTable(feedbacks) {
  tableCountBadge.textContent = `${feedbacks.length} record${feedbacks.length === 1 ? '' : 's'}`;

  if (feedbacks.length === 0) {
    feedbackTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty-state">
          <div class="empty-icon">📭</div>
          <div style="font-weight: 600; font-size: 1rem; color: #475569;">No feedback records found</div>
          <div style="font-size: 0.85rem; margin-top: 0.25rem;">Try adjusting your search criteria or click "+ Add Feedback" to create one.</div>
        </td>
      </tr>
    `;
    return;
  }

  feedbackTableBody.innerHTML = feedbacks
    .map((item) => {
      const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
      const formattedDate = formatDate(item.created_at);

      return `
        <tr data-id="${item.id}">
          <td>
            <span class="table-id-badge">#${item.id}</span>
          </td>
          <td class="student-col">
            <div class="student-name-text">${escapeHtml(item.student_name)}</div>
            ${item.email ? `<div class="student-email-text">${escapeHtml(item.email)}</div>` : ''}
          </td>
          <td>
            <span class="reg-badge">${escapeHtml(item.register_number)}</span>
          </td>
          <td>
            <span class="dept-badge">${escapeHtml(item.department)}</span>
          </td>
          <td>
            <span class="rating-stars">${stars}</span>
            <span class="rating-score">${item.rating}/5</span>
          </td>
          <td>
            <div class="feedback-snippet" title="${escapeHtml(item.feedback)}">
              ${escapeHtml(item.feedback)}
            </div>
          </td>
          <td>
            <span class="date-text">${formattedDate}</span>
          </td>
          <td>
            <div class="action-buttons">
              <button
                type="button"
                class="btn-action btn-view"
                onclick="viewFeedback(${item.id})"
                title="View complete feedback"
              >
                👁️ View
              </button>
              <button
                type="button"
                class="btn-action btn-edit"
                onclick="editFeedback(${item.id})"
                title="Edit feedback"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                class="btn-action btn-delete"
                onclick="openDeleteConfirm(${item.id}, '${escapeJs(item.student_name)}', '${escapeJs(item.register_number)}')"
                title="Delete feedback"
              >
                🗑️ Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function showLoadingInTable() {
  feedbackTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="table-loading-state">
        <div class="loading-spinner"></div>
        <div>Loading student feedback records...</div>
      </td>
    </tr>
  `;
}

function showErrorInTable(message) {
  feedbackTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="table-empty-state" style="color: #b91c1c;">
        <div class="empty-icon">⚠️</div>
        <div style="font-weight: 600; font-size: 1rem;">Connection Error</div>
        <div style="font-size: 0.85rem; margin-top: 0.25rem;">${escapeHtml(message)}</div>
        <button
          type="button"
          class="btn-secondary"
          style="margin-top: 1rem;"
          onclick="loadAllFeedbacks()"
        >
          🔄 Retry Connection
        </button>
      </td>
    </tr>
  `;
}

/* ==========================================================================
   Statistics Calculations
   ========================================================================== */
function updateStats(feedbacks) {
  const total = feedbacks.length;
  statTotalCount.textContent = total;

  if (total === 0) {
    statAvgRating.textContent = '0.0 / 5';
    statTopRatings.textContent = '0';
    statDeptCount.textContent = '0';
    return;
  }

  const sumRatings = feedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0);
  const avg = (sumRatings / total).toFixed(1);
  statAvgRating.textContent = `${avg} / 5`;

  const topCount = feedbacks.filter((f) => f.rating === 5).length;
  statTopRatings.textContent = topCount;

  const uniqueDepts = new Set(feedbacks.map((f) => f.department).filter(Boolean));
  statDeptCount.textContent = uniqueDepts.size;
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeJs(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" type="button" aria-label="Dismiss">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Make functions accessible to inline onclick table attributes
window.viewFeedback = viewFeedback;
window.editFeedback = editFeedback;
window.openDeleteConfirm = openDeleteConfirm;
window.loadAllFeedbacks = loadAllFeedbacks;
