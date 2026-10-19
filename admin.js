/**
 * 11e HEURE TABERNACLE - BACK OFFICE ADMINISTRATIF
 * Gestion du contenu : Galerie, Horaires, À propos, Pasteur, Annonces
 */

// Clés de stockage
const STORAGE_KEY = '11E_TABERNACLE_DATA_V1';
const AUTH_KEY = '11E_TABERNACLE_ADMIN_AUTH';
const PASS_KEY = '11E_TABERNACLE_ADMIN_PASS';
const DEFAULT_PASS = '11eheure';
const DEFAULT_PIN = '1177';

// Données en mémoire
let appData = null;
let currentEditingPhotoId = null;
let currentEditingProgramId = null;
let serverConfig = null;

async function loadServerConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      serverConfig = await res.json();
    }
  } catch (e) {
    // Mode offline
  }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadData(), loadServerConfig()]);
  initAuth();
  initNavigation();
  initModals();
  initGalleryUploader();
  renderAll();
});

/* ==========================================================================
   1. CHARGEMENT ET SAUVEGARDE DES DONNÉES
   ========================================================================== */
async function loadData() {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      appData = JSON.parse(localData);
      return;
    } catch (e) {
      console.warn('Erreur lecture localStorage, tentative via seed JSON');
    }
  }

  // Tenter de charger data/content.json
  try {
    const res = await fetch('data/content.json');
    if (res.ok) {
      appData = await res.json();
      saveDataLocally(false);
      return;
    }
  } catch (err) {
    console.warn('Impossible de charger data/content.json', err);
  }

  // Fallback de sécurité
  appData = getFallbackData();
  saveDataLocally(false);
}

function saveDataLocally(showToastNotification = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateLastSavedIndicator();
    
    // Tenter également de sauvegarder sur le serveur Node si disponible
    saveToServer(appData);

    if (showToastNotification) {
      showToast('Modifications enregistrées avec succès !', 'success');
    }
  } catch (e) {
    console.error('Erreur sauvegarde locale', e);
    showToast('Erreur lors de la sauvegarde locale', 'error');
  }
}

async function saveToServer(data) {
  try {
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.synced) {
        showToast(json.message || '✅ Synchronisé sur GitHub ! Vercel met à jour le site public.', 'success');
      }
    }
  } catch (e) {
    // Mode offline ou sans backend
  }
}

function updateLastSavedIndicator() {
  const el = document.getElementById('last-saved-time');
  if (el) {
    const now = new Date();
    el.textContent = `Dernière sauvegarde : ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
}

/* ==========================================================================
   2. AUTHENTIFICATION DU BACK OFFICE
   ========================================================================== */
function initAuth() {
  const authModal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('admin-password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  const isAuthenticated = sessionStorage.getItem(AUTH_KEY) === 'true';

  if (!isAuthenticated) {
    authModal?.classList.remove('hidden');
  } else {
    authModal?.classList.add('hidden');
  }

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = passwordInput.value.trim();
    const storedPass = localStorage.getItem(PASS_KEY) || DEFAULT_PASS;

    if (entered === storedPass || entered === DEFAULT_PIN) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      authModal?.classList.add('hidden');
      loginError?.classList.add('hidden');
      passwordInput.value = '';
      showToast('Bienvenue dans l\'Espace Pastoral', 'success');
      renderAll();
    } else {
      loginError?.classList.remove('hidden');
      passwordInput.focus();
    }
  });

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    authModal?.classList.remove('hidden');
    showToast('Déconnexion effectuée', 'info');
  });
}

/* ==========================================================================
   3. NAVIGATION PAR ONGLETS DU BACK OFFICE
   ========================================================================== */
function initNavigation() {
  const navButtons = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');

  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');

      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      sections.forEach(sec => {
        if (sec.id === targetId) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      });

      // Fermer le menu mobile s'il est ouvert
      const sidebar = document.getElementById('admin-sidebar');
      if (window.innerWidth < 1024 && sidebar) {
        sidebar.classList.add('-translate-x-full');
      }
    });
  });

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  const sidebarClose = document.getElementById('sidebar-close');

  mobileToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('-translate-x-full');
  });

  sidebarClose?.addEventListener('click', () => {
    sidebar?.classList.add('-translate-x-full');
  });
}

/* ==========================================================================
   4. RENDU GLOBAL & STATISTIQUES
   ========================================================================== */
function renderAll() {
  if (!appData) return;
  renderDashboardStats();
  renderGalleryList();
  renderHorairesList();
  renderAproposForm();
  renderMissionForm();
  renderPasteurForm();
  renderAnnouncementForm();
  renderSiteInfoForm();
}

function renderDashboardStats() {
  const photoCountEl = document.getElementById('stat-photos-count');
  const horairesCountEl = document.getElementById('stat-horaires-count');
  const announcementStatusEl = document.getElementById('stat-announcement-status');

  if (photoCountEl) photoCountEl.textContent = appData.gallery?.length || 0;
  if (horairesCountEl) horairesCountEl.textContent = appData.horaires?.length || 0;
  if (announcementStatusEl) {
    if (appData.announcement?.active) {
      announcementStatusEl.innerHTML = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-purple-950">Active</span>';
    } else {
      announcementStatusEl.innerHTML = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">Désactivée</span>';
    }
  }
}

/* ==========================================================================
   5. GESTION DE LA GALERIE PHOTOS (TÉLÉVERSEMENT TRANSPARENT VIA .ENV)
   ========================================================================== */
function renderGalleryList() {
  const container = document.getElementById('gallery-items-container');
  const countLabel = document.getElementById('gallery-count-label');
  if (!container) return;

  const photos = appData.gallery || [];
  if (countLabel) countLabel.textContent = photos.length;

  if (photos.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 admin-glass-panel rounded-2xl border-2 border-dashed border-purple-800">
        <div class="w-16 h-16 rounded-full mx-auto mb-3 bg-purple-900/60 flex items-center justify-center text-amber-300">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
        <p class="text-slate-300 font-semibold mb-1">Aucune photo dans la galerie pour le moment.</p>
        <p class="text-xs text-slate-400 mb-4">Téléversez vos photos ci-dessus pour les ajouter instantanément.</p>
        <button onclick="document.getElementById('gallery-multi-upload').click()" class="px-5 py-2.5 rounded-full btn-gold-primary text-xs font-bold shadow-md cursor-pointer">
          Sélectionner des photos
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = photos.map((item, index) => `
    <div class="group relative rounded-2xl overflow-hidden bg-slate-900 border border-purple-800/80 hover:border-amber-400 transition-all shadow-lg flex flex-col justify-between">
      <div class="relative aspect-square overflow-hidden bg-black/60">
        <img src="${escapeHtml(item.image)}" alt="Photo ${index + 1}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
        
        <!-- Badge index -->
        <div class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-amber-300 text-[10px] font-bold font-mono">
          #${photos.length - index}
        </div>

        <!-- Boutons d'action rapides (Voir & Supprimer) -->
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-2 backdrop-blur-[2px]">
          <a href="${escapeHtml(item.image)}" target="_blank" rel="noopener noreferrer" class="p-2.5 rounded-xl bg-purple-900/90 hover:bg-purple-700 text-amber-300 border border-amber-400/40 shadow-lg transition-transform hover:scale-110" title="Voir l'image en grand">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </a>

          <button onclick="confirmDeletePhoto('${item.id}')" class="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer" title="Supprimer définitivement de la galerie">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>

      <!-- Bas de carte simple avec date et bouton supprimer -->
      <div class="p-2.5 bg-brand-purpleDark/95 flex items-center justify-between border-t border-purple-900/60">
        <span class="text-[10px] text-slate-400 font-mono">${escapeHtml(item.date || '')}</span>
        <button onclick="confirmDeletePhoto('${item.id}')" class="text-xs text-red-400 hover:text-red-300 font-bold inline-flex items-center gap-1 cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          <span>Supprimer</span>
        </button>
      </div>
    </div>
  `).join('');
}

function confirmDeletePhoto(id) {
  const photo = appData.gallery.find(p => p.id === id);
  if (!photo) return;

  if (confirm(`Voulez-vous vraiment supprimer cette photo de la galerie ?`)) {
    appData.gallery = appData.gallery.filter(p => p.id !== id);
    saveDataLocally();
    renderGalleryList();
    renderDashboardStats();
    showToast('Photo supprimée avec succès de la galerie', 'info');
  }
}

function initGalleryUploader() {
  const dropzone = document.getElementById('gallery-dropzone');
  const fileInput = document.getElementById('gallery-multi-upload');
  const statusContainer = document.getElementById('gallery-upload-status');
  const statusText = document.getElementById('upload-status-text');
  const statusPercent = document.getElementById('upload-status-percent');
  const progressBar = document.getElementById('upload-progress-bar');

  if (!dropzone || !fileInput) return;

  // Clic sur la dropzone ouvre le sélecteur de fichier
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('input')) return;
    fileInput.click();
  });

  // Glisser-déposer (Drag & Drop)
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('border-amber-400', 'bg-purple-900/50', 'scale-[1.01]');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('border-amber-400', 'bg-purple-900/50', 'scale-[1.01]');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt ? dt.files : null;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFilesUpload(fileInput.files);
    }
  });

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFilesUpload(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      alert('Veuillez sélectionner au moins un fichier image valide (JPG, PNG, WEBP).');
      return;
    }

    if (statusContainer) {
      statusContainer.classList.remove('hidden');
    }

    let successCount = 0;
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      const percent = Math.round((i / total) * 100);

      if (statusText) {
        statusText.innerHTML = `
          <svg class="w-4 h-4 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Téléversement de la photo ${i + 1} sur ${total}...
        `;
      }
      if (statusPercent) statusPercent.textContent = `${percent}%`;
      if (progressBar) progressBar.style.width = `${percent}%`;

      try {
        const base64Data = await readFileAsBase64(file);
        let finalImageUrl = base64Data;
        let uploaded = false;

        // 1. Tenter l'envoi direct depuis le navigateur vers ImgBB avec la clé du .env
        const imgKey = serverConfig?.imgbbKey || '';
        if (imgKey && imgKey.trim() && imgKey !== 'votre_cle_api_imgbb_ici') {
          try {
            const form = new FormData();
            form.append('image', file);
            const directRes = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgKey.trim())}`, {
              method: 'POST',
              body: form
            });
            const directJson = await directRes.json();
            if (directJson.success && directJson.data) {
              finalImageUrl = directJson.data.url || directJson.data.display_url;
              uploaded = true;
            }
          } catch (directErr) {
            console.warn('Upload direct échoué, passage par /api/upload', directErr);
          }
        }

        // 2. Si non envoyé directement, passer par le backend /api/upload
        if (!uploaded) {
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: base64Data,
                name: file.name
              })
            });

            const json = await res.json();
            if (json.success && json.url) {
              finalImageUrl = json.url;
            }
          } catch (apiErr) {
            console.warn('API /api/upload indisponible, conservation en mémoire locale', apiErr);
          }
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
        const newPhoto = {
          id: 'gal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          title: cleanName || "11e Heure Tabernacle",
          category: "assemblee",
          badge: "Photo",
          subtitle: "Pointe-Noire • Congo",
          caption: "",
          image: finalImageUrl,
          date: new Date().toISOString().split('T')[0]
        };

        if (!appData.gallery) appData.gallery = [];
        appData.gallery.unshift(newPhoto);
        successCount++;

      } catch (err) {
        console.error('Erreur lecture fichier:', err);
        showToast(`Erreur (${file.name})`, 'error');
      }
    }

    if (progressBar) progressBar.style.width = '100%';
    if (statusPercent) statusPercent.textContent = '100%';
    if (statusText) {
      statusText.innerHTML = `✅ ${successCount} photo(s) ajoutée(s) avec succès !`;
    }

    saveDataLocally();
    renderGalleryList();
    renderDashboardStats();

    setTimeout(() => {
      if (statusContainer) statusContainer.classList.add('hidden');
      if (fileInput) fileInput.value = '';
    }, 2000);

    if (successCount > 0) {
      showToast(`${successCount} photo(s) ajoutée(s) à la galerie !`, 'success');
    }
  }
}


/* ==========================================================================
   6. GESTION DES PROGRAMMES ET HORAIRES DES CULTES
   ========================================================================== */
function renderHorairesList() {
  const container = document.getElementById('horaires-list-container');
  if (!container) return;

  const horaires = appData.horaires || [];
  container.innerHTML = horaires.map(item => `
    <div class="p-5 rounded-2xl bg-white border ${item.isHighlighted ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-purple-100'} shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex-1">
        <div class="flex items-center gap-2.5">
          <span class="px-3 py-1 rounded-full text-xs font-heading font-extrabold ${item.isHighlighted ? 'bg-amber-400 text-purple-950' : 'bg-purple-100 text-brand-purpleDark'}">
            ${escapeHtml(item.day)}
          </span>
          <span class="text-xs font-bold text-slate-500">${escapeHtml(item.time)}</span>
          ${item.isHighlighted ? '<span class="text-[11px] font-bold text-amber-600 uppercase tracking-wider">★ Mis en valeur</span>' : ''}
        </div>
        <h4 class="font-heading font-bold text-slate-900 text-base mt-2">${escapeHtml(item.title)}</h4>
        <p class="text-xs text-slate-600 mt-0.5">${escapeHtml(item.description)}</p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button onclick="openEditProgramModal('${item.id}')" class="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-brand-purpleDark text-xs font-bold transition-all">
          Modifier
        </button>
        <button onclick="confirmDeleteProgram('${item.id}')" class="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all" title="Supprimer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function openAddProgramModal() {
  currentEditingProgramId = null;
  const modal = document.getElementById('program-modal');
  const title = document.getElementById('program-modal-title');
  const form = document.getElementById('program-form');
  
  if (title) title.textContent = 'Ajouter un culte / programme';
  if (form) form.reset();

  modal?.classList.remove('hidden');
}

function openEditProgramModal(id) {
  currentEditingProgramId = id;
  const item = appData.horaires.find(h => h.id === id);
  if (!item) return;

  const modal = document.getElementById('program-modal');
  const title = document.getElementById('program-modal-title');

  if (title) title.textContent = 'Modifier le programme';

  document.getElementById('program-day').value = item.day || '';
  document.getElementById('program-time').value = item.time || '';
  document.getElementById('program-type').value = item.type || '';
  document.getElementById('program-title').value = item.title || '';
  document.getElementById('program-desc').value = item.description || '';
  document.getElementById('program-highlight').checked = !!item.isHighlighted;

  modal?.classList.remove('hidden');
}

function confirmDeleteProgram(id) {
  if (appData.horaires.length <= 1) {
    alert('Vous devez conserver au moins un programme de culte.');
    return;
  }
  const item = appData.horaires.find(h => h.id === id);
  if (!item) return;

  if (confirm(`Confirmez-vous la suppression du culte « ${item.title} » ?`)) {
    appData.horaires = appData.horaires.filter(h => h.id !== id);
    saveDataLocally();
    renderHorairesList();
    renderDashboardStats();
    showToast('Programme supprimé', 'info');
  }
}

// Formulaire Programmes
document.getElementById('program-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const day = document.getElementById('program-day').value.trim();
  const time = document.getElementById('program-time').value.trim();
  const type = document.getElementById('program-type').value.trim();
  const title = document.getElementById('program-title').value.trim();
  const description = document.getElementById('program-desc').value.trim();
  const isHighlighted = document.getElementById('program-highlight').checked;

  if (!day || !time || !title) {
    alert('Veuillez remplir les champs obligatoires.');
    return;
  }

  if (currentEditingProgramId) {
    const item = appData.horaires.find(h => h.id === currentEditingProgramId);
    if (item) {
      item.day = day;
      item.time = time;
      item.type = type;
      item.title = title;
      item.description = description;
      item.isHighlighted = isHighlighted;
    }
    showToast('Programme mis à jour avec succès', 'success');
  } else {
    const newProgram = {
      id: 'culte-' + Date.now(),
      day,
      time,
      type,
      title,
      description,
      isHighlighted
    };
    appData.horaires.push(newProgram);
    showToast('Nouveau programme de culte ajouté', 'success');
  }

  saveDataLocally();
  renderHorairesList();
  renderDashboardStats();
  document.getElementById('program-modal')?.classList.add('hidden');
});

/* ==========================================================================
   7. GESTION DES SECTIONS À PROPOS, MISSION & PASTEUR
   ========================================================================== */
function renderAproposForm() {
  const p = appData.apropos;
  if (!p) return;

  const titleInput = document.getElementById('apropos-title');
  const p1Input = document.getElementById('apropos-p1');
  const p2Input = document.getElementById('apropos-p2');
  const scripQuoteInput = document.getElementById('apropos-scripture-quote');
  const scripRefInput = document.getElementById('apropos-scripture-ref');

  if (titleInput) titleInput.value = p.title || '';
  if (p1Input) p1Input.value = p.paragraph1 || '';
  if (p2Input) p2Input.value = p.paragraph2 || '';
  if (scripQuoteInput) scripQuoteInput.value = p.scriptureQuote || '';
  if (scripRefInput) scripRefInput.value = p.scriptureRef || '';

  // Piliers
  if (p.pillars && p.pillars.length >= 3) {
    document.getElementById('pillar-1-title').value = p.pillars[0].title || '';
    document.getElementById('pillar-1-desc').value = p.pillars[0].description || '';
    document.getElementById('pillar-2-title').value = p.pillars[1].title || '';
    document.getElementById('pillar-2-desc').value = p.pillars[1].description || '';
    document.getElementById('pillar-3-title').value = p.pillars[2].title || '';
    document.getElementById('pillar-3-desc').value = p.pillars[2].description || '';
  }
}

document.getElementById('apropos-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.apropos = {
    ...appData.apropos,
    title: document.getElementById('apropos-title').value.trim(),
    paragraph1: document.getElementById('apropos-p1').value.trim(),
    paragraph2: document.getElementById('apropos-p2').value.trim(),
    scriptureQuote: document.getElementById('apropos-scripture-quote').value.trim(),
    scriptureRef: document.getElementById('apropos-scripture-ref').value.trim(),
    pillars: [
      {
        id: 'foi',
        title: document.getElementById('pillar-1-title').value.trim(),
        description: document.getElementById('pillar-1-desc').value.trim()
      },
      {
        id: 'amour',
        title: document.getElementById('pillar-2-title').value.trim(),
        description: document.getElementById('pillar-2-desc').value.trim()
      },
      {
        id: 'esperance',
        title: document.getElementById('pillar-3-title').value.trim(),
        description: document.getElementById('pillar-3-desc').value.trim()
      }
    ]
  };

  saveDataLocally();
  showToast('Section À propos mise à jour !', 'success');
});

function renderMissionForm() {
  const m = appData.mission;
  if (!m) return;

  const titleInput = document.getElementById('mission-title');
  const quoteInput = document.getElementById('mission-quote');
  const p1Input = document.getElementById('mission-p1');
  const p2Input = document.getElementById('mission-p2');

  if (titleInput) titleInput.value = m.title || '';
  if (quoteInput) quoteInput.value = m.quote || '';
  if (p1Input) p1Input.value = m.paragraph1 || '';
  if (p2Input) p2Input.value = m.paragraph2 || '';
}

document.getElementById('mission-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.mission = {
    ...appData.mission,
    title: document.getElementById('mission-title').value.trim(),
    quote: document.getElementById('mission-quote').value.trim(),
    paragraph1: document.getElementById('mission-p1').value.trim(),
    paragraph2: document.getElementById('mission-p2').value.trim()
  };

  saveDataLocally();
  showToast('Mission et Vision mises à jour !', 'success');
});

function renderPasteurForm() {
  const p = appData.pasteur;
  if (!p) return;

  const nameInput = document.getElementById('pasteur-name');
  const roleInput = document.getElementById('pasteur-role');
  const bioInput = document.getElementById('pasteur-bio');
  const quoteInput = document.getElementById('pasteur-quote');
  const photoInput = document.getElementById('pasteur-photo');

  if (nameInput) nameInput.value = p.name || '';
  if (roleInput) roleInput.value = p.role || '';
  if (bioInput) bioInput.value = p.bio || '';
  if (quoteInput) quoteInput.value = p.quote || '';
  if (photoInput) photoInput.value = p.photo || '';
}

document.getElementById('pasteur-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.pasteur = {
    ...appData.pasteur,
    name: document.getElementById('pasteur-name').value.trim(),
    role: document.getElementById('pasteur-role').value.trim(),
    bio: document.getElementById('pasteur-bio').value.trim(),
    quote: document.getElementById('pasteur-quote').value.trim(),
    photo: document.getElementById('pasteur-photo').value.trim()
  };

  saveDataLocally();
  showToast('Informations pastorales enregistrées !', 'success');
});

/* ==========================================================================
   8. GESTION DE LA BANNIÈRE D'ANNONCE SPÉCIALE
   ========================================================================== */
function renderAnnouncementForm() {
  const a = appData.announcement;
  if (!a) return;

  const activeToggle = document.getElementById('announcement-active');
  const badgeInput = document.getElementById('announcement-badge');
  const messageInput = document.getElementById('announcement-message');
  const linkTextInput = document.getElementById('announcement-link-text');
  const linkUrlInput = document.getElementById('announcement-link-url');

  if (activeToggle) activeToggle.checked = !!a.active;
  if (badgeInput) badgeInput.value = a.badge || 'Annonce Spéciale';
  if (messageInput) messageInput.value = a.message || '';
  if (linkTextInput) linkTextInput.value = a.linkText || 'Consulter';
  if (linkUrlInput) linkUrlInput.value = a.linkUrl || '#horaires';
}

document.getElementById('announcement-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  appData.announcement = {
    active: document.getElementById('announcement-active').checked,
    badge: document.getElementById('announcement-badge').value.trim() || 'Annonce Spéciale',
    message: document.getElementById('announcement-message').value.trim(),
    linkText: document.getElementById('announcement-link-text').value.trim() || 'En savoir plus',
    linkUrl: document.getElementById('announcement-link-url').value.trim() || '#horaires'
  };

  saveDataLocally();
  renderDashboardStats();
  showToast('Bannière d\'annonce mise à jour !', 'success');
});

/* ==========================================================================
   9. GESTION DES COORDONNÉES GÉNÉRALES
   ========================================================================== */
function renderSiteInfoForm() {
  const s = appData.siteInfo;
  if (!s) return;

  const phoneInput = document.getElementById('info-phone');
  const landmarkInput = document.getElementById('info-landmark');
  const fbInput = document.getElementById('info-facebook');
  const ytInput = document.getElementById('info-youtube');

  if (phoneInput) phoneInput.value = s.phone || '';
  if (landmarkInput) landmarkInput.value = s.addressLandmark || '';
  if (fbInput) fbInput.value = s.facebookUrl || '';
  if (ytInput) ytInput.value = s.youtubeUrl || '';
}

document.getElementById('siteinfo-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawPhone = document.getElementById('info-phone').value.replace(/\D/g, '');
  appData.siteInfo = {
    ...appData.siteInfo,
    phone: document.getElementById('info-phone').value.trim(),
    phoneRaw: rawPhone || '242069376967',
    addressLandmark: document.getElementById('info-landmark').value.trim(),
    facebookUrl: document.getElementById('info-facebook').value.trim(),
    youtubeUrl: document.getElementById('info-youtube').value.trim()
  };

  saveDataLocally();
  showToast('Coordonnées enregistrées !', 'success');
});

/* ==========================================================================
   10. SAUVEGARDE, EXPORT, IMPORT & RÉINITIALISATION
   ========================================================================== */
function initModals() {
  // Fermeture des modales
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-modal').forEach(m => m.classList.add('hidden'));
    });
  });

  // Export JSON
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `11e-tabernacle-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Fichier de sauvegarde téléchargé', 'success');
  });

  // Import JSON
  const importInput = document.getElementById('import-json-input');
  importInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && imported.gallery && imported.horaires) {
          appData = imported;
          saveDataLocally();
          renderAll();
          showToast('Données importées et restaurées avec succès !', 'success');
        } else {
          alert('Fichier JSON invalide. Structure non reconnue.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  });

  // Réinitialisation aux valeurs par défaut
  document.getElementById('reset-defaults-btn')?.addEventListener('click', () => {
    if (confirm('Attention : Cette action réinitialisera toutes vos modifications personnalisées avec les valeurs initiales. Confirmer ?')) {
      localStorage.removeItem(STORAGE_KEY);
      appData = getFallbackData();
      saveDataLocally();
      renderAll();
      showToast('Données réinitialisées aux valeurs initiales', 'info');
    }
  });

  // Changement de mot de passe admin
  document.getElementById('change-pass-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = document.getElementById('new-admin-password').value.trim();
    if (newPass.length < 4) {
      alert('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    localStorage.setItem(PASS_KEY, newPass);
    document.getElementById('new-admin-password').value = '';
    showToast('Mot de passe administrateur modifié avec succès', 'success');
  });
}

/* ==========================================================================
   UTILITAIRES
   ========================================================================== */
function showToast(message, type = 'info') {
  const toast = document.getElementById('admin-toast');
  const toastMsg = document.getElementById('admin-toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('hidden', 'translate-y-10', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getFallbackData() {
  return {
    siteInfo: {
      name: "11e HEURE TABERNACLE",
      city: "Pointe-Noire, Congo",
      slogan: "« Au Temps du Soir, la Lumière Paraîtra » • Zacharie 14:7",
      hookSubtitle: "Sous la direction pastorale du Pasteur Odilon Detchibs",
      hookDescription: "Église du Message du Temps de la Fin • Pointe-Noire, Congo. Un sanctuaire de révélation, de foi apostolique, de communion fraternelle et d'adoration en Esprit et en Vérité.",
      phone: "+242 06 937 69 67",
      phoneRaw: "242069376967",
      addressQuarter: "Voungou 1",
      addressLandmark: "Bank de Vie, arrêt 1er Pont, en face d'Emanuel Photo",
      addressCity: "Pointe-Noire, République du Congo",
      facebookUrl: "https://www.facebook.com/search/top?q=Odilon%20Tchibounga",
      facebookName: "Odilon Tchibounga",
      youtubeUrl: "https://www.youtube.com/results?search_query=odilon+de+tchib",
      youtubeName: "odilon de tchib"
    },
    announcement: {
      active: false,
      badge: "Annonce Spéciale",
      message: "Bienvenue à tous nos frères et visiteurs pour nos cultes de réveil spirituel et d'édification !",
      linkText: "Horaires des cultes",
      linkUrl: "#horaires"
    },
    apropos: {
      badge: "Fondement & Identité",
      title: "Un Sanctuaire Bâti sur le Roc de la Parole Vivante",
      paragraph1: "Située à Pointe-Noire au quartier Voungou 1, l'assemblée de 11e Heure Tabernacle est une communauté chrétienne fervente engagée dans la proclamation intégrale de la Parole de Dieu.",
      paragraph2: "Sous la direction pastorale du pasteur Odilon Detchibs, notre communauté réunit des croyants animés d'un même zèle : vivre la foi chrétienne dans sa pureté apostolique originelle.",
      scriptureQuote: "« Vous avez été édifiés sur le fondement des apôtres et des prophètes, Jésus-Christ lui-même étant la pierre angulaire. »",
      scriptureRef: "Éphésiens 2:20",
      pillars: [
        { id: "foi", title: "Foi Apostolique", description: "L'attachement absolu aux Écritures sacrées et au message de restauration pour le temps de la fin." },
        { id: "amour", title: "Amour & Communion", description: "Une fraternité chaleureuse où chaque croyant est soutenu, fortifié et encouragé dans la marche chrétienne." },
        { id: "esperance", title: "Espérance de l'Enlèvement", description: "La sanctification quotidienne et la préparation vivante dans l'attente du retour glorieux de notre Sauveur." }
      ]
    },
    mission: {
      badge: "Vision Apostolique & Préparation",
      title: "Notre Mission : Préparer un Peuple Prêt pour l'Époux",
      quote: "« Que celui qui a des oreilles entende ce que l'Esprit dit aux Églises. » — Apocalypse 3:22",
      paragraph1: "Notre mission à 11e Heure Tabernacle s'enracine dans la conviction profonde que nous vivons à l'heure la plus solennelle de l'histoire humaine : la onzième heure.",
      paragraph2: "Nous œuvrons sans relâche à l'évangélisation, au perfectionnement des saints par l'enseignement doctrinal, à l'édification de notre sanctuaire à Voungou 1 et à l'épanouissement de chaque famille dans la sanctification."
    },
    horaires: [
      { id: "mardi", day: "Mardi Soir", time: "18h00 – 19h30", type: "Culte de Prière", title: "Prière & Intercession", description: "Moments de ferveur pour rechercher la face de Dieu et le réveil des familles.", isHighlighted: false },
      { id: "jeudi", day: "Jeudi Soir", time: "18h00 – 19h30", type: "Étude Biblique", title: "Enseignement & Doctrine", description: "Approfondissement des vérités bibliques pour l'enracinement dans la sainte doctrine.", isHighlighted: false },
      { id: "dimanche-ecole", day: "Dimanche Matin", time: "08h00 – 09h30", type: "Jeunesse & Enfants", title: "École du Dimanche", description: "Formation spirituelle et biblique structurée adaptée aux enfants et aux adolescents.", isHighlighted: false },
      { id: "dimanche-culte", day: "Dimanche Matin", time: "10h00 – 12h30", type: "Rassemblement Solennel", title: "Grand Culte d'Adoration", description: "Célébration générale, louange fervente, cantiques d'édification et proclamation vivante.", isHighlighted: true }
    ],
    pasteur: {
      name: "Pasteur Odilon Detchibs",
      role: "Pasteur Principal de 11e Heure Tabernacle",
      badge: "Bergerie & Ministère",
      bio: "Animé par un profond amour pour l’œuvre du Seigneur et le salut des âmes, le pasteur Odilon Detchibs guide l'assemblée de 11e Heure Tabernacle avec fidélité, humilité et ferveur spirituelle à Pointe-Noire.",
      quote: "« Notre prière est que chaque âme qui franchit les portes de cette assemblée découvre la profondeur de l'amour de Dieu, reçoive la force de surmonter les épreuves et soit préparée dans la sanctification pour le retour glorieux de notre Sauveur. »",
      photo: "assets/images/pastor-odilon.jpg"
    },
    gallery: []
  };
}
