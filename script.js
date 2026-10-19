/**
 * 11e HEURE TABERNACLE - LOGIQUE INTERACTIVE & API
 * Église chrétienne de réveil & de restauration - Pointe-Noire, Congo
 * Auteur : Développeur Full Stack & UI/UX
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollProgressBar();
  initLiveWorshipTicker();
  initVerseOfTheDay();
  initVerseActions();
  initGalleryAndLightbox();
  initContactForm();
  initFaqAccordion();
  initScrollReveal();
  initBackToTop();
  initCurrentYear();
  initSmoothScrollSpy();
});

/* ==========================================================================
   1. NAVIGATION & MENU MOBILE
   ========================================================================== */
function initNavbar() {
  const navbar = document.getElementById('main-header');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  // Sticky blur header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }, { passive: true });

  function closeMobileDrawer() {
    if (!mobileMenu || mobileMenu.classList.contains('hidden')) return;
    mobileMenu.classList.add('hidden');
    mobileMenuBtn?.setAttribute('aria-expanded', 'false');
    menuIcon?.classList.remove('hidden');
    closeIcon?.classList.add('hidden');
  }

  function openMobileDrawer() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('hidden');
    mobileMenuBtn?.setAttribute('aria-expanded', 'true');
    menuIcon?.classList.add('hidden');
    closeIcon?.classList.remove('hidden');
  }

  // Toggle mobile drawer
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      if (!isExpanded) {
        openMobileDrawer();
      } else {
        closeMobileDrawer();
      }
    });

    // Close mobile menu on link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMobileDrawer();
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        closeMobileDrawer();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileDrawer();
      }
    });

    // Reset when resizing window to desktop/tablet breakpoint (>= 768px)
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        closeMobileDrawer();
      }
    }, { passive: true });
  }
}

/* ==========================================================================
   1.B. BARRE DYNAMIQUE DE PROGRESSION DE DÉFILEMENT (SCROLL PROGRESS)
   ========================================================================== */
function initScrollProgressBar() {
  const bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;

  function updateProgressBar() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  window.addEventListener('scroll', updateProgressBar, { passive: true });
  window.addEventListener('resize', updateProgressBar, { passive: true });
  updateProgressBar();
}

/* ==========================================================================
   1.C. TICKER DYNAMIQUE EN DIRECT & COMPTE À REBOURS DU PROCHAIN CULTE (POINTE-NOIRE UTC+1)
   ========================================================================== */
function initLiveWorshipTicker() {
  const tickerEl = document.getElementById('live-worship-ticker');
  const dotEl = document.getElementById('live-worship-dot');
  const textEl = document.getElementById('live-worship-text');
  if (!tickerEl || !textEl) return;

  // Horaires officiels de culte à Pointe-Noire (GMT+1)
  // 0 = Dimanche, 2 = Mardi, 4 = Jeudi
  const SERVICES = [
    { day: 0, startH: 8, startM: 0, endH: 9, endM: 30, name: "École du Dimanche" },
    { day: 0, startH: 10, startM: 0, endH: 12, endM: 30, name: "Culte Principal d'Adoration" },
    { day: 2, startH: 18, startM: 0, endH: 19, endM: 30, name: "Culte en Semaine" },
    { day: 4, startH: 18, startM: 0, endH: 19, endM: 30, name: "Culte de la Semaine" }
  ];

  const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  function updateTicker() {
    // Calcul de l'heure locale à Pointe-Noire (UTC+1)
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const pnDate = new Date(utcMs + (3600000 * 1)); // Heure Congo (UTC+1)

    const currentDay = pnDate.getDay();
    const currentMin = pnDate.getHours() * 60 + pnDate.getMinutes();

    // 1. Vérification si un culte est en cours en ce moment
    let ongoingService = null;
    for (const s of SERVICES) {
      if (s.day === currentDay) {
        const sStart = s.startH * 60 + s.startM;
        const sEnd = s.endH * 60 + s.endM;
        if (currentMin >= sStart && currentMin < sEnd) {
          ongoingService = s;
          break;
        }
      }
    }

    if (ongoingService) {
      if (dotEl) {
        dotEl.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0';
      }
      textEl.innerHTML = `<span class="text-emerald-300 font-extrabold uppercase tracking-wide">🔴 EN CE MOMENT :</span> ${ongoingService.name} &bull; Bienvenue à Voungou 1 !`;
      tickerEl.classList.remove('border-amber-400/60');
      tickerEl.classList.add('border-emerald-400/80');
      return;
    }

    // 2. Recherche du prochain culte dans les 7 prochains jours
    let nextMatch = null;
    for (let offset = 0; offset <= 7; offset++) {
      const targetDay = (currentDay + offset) % 7;
      const dayServices = SERVICES.filter(s => s.day === targetDay).sort((a, b) => (a.startH * 60 + a.startM) - (b.startH * 60 + b.startM));

      for (const s of dayServices) {
        const sMin = s.startH * 60 + s.startM;
        if (offset === 0 && sMin <= currentMin) {
          continue; // Déjà passé aujourd'hui
        }
        nextMatch = { service: s, offsetDays: offset };
        break;
      }
      if (nextMatch) break;
    }

    if (!nextMatch) return;

    if (dotEl) {
      dotEl.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0';
    }
    tickerEl.classList.add('border-amber-400/60');
    tickerEl.classList.remove('border-emerald-400/80');

    const s = nextMatch.service;
    const timeFormatted = `${String(s.startH).padStart(2, '0')}h${String(s.startM).padStart(2, '0')}`;

    if (nextMatch.offsetDays === 0) {
      const sMin = s.startH * 60 + s.startM;
      const diffMin = sMin - currentMin;
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      const timeRemaining = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
      textEl.innerHTML = `<span class="text-amber-300 font-bold">Aujourd'hui à ${timeFormatted} :</span> ${s.name} <span class="text-xs text-sky-200">(dans ${timeRemaining})</span>`;
    } else if (nextMatch.offsetDays === 1) {
      textEl.innerHTML = `<span class="text-amber-300 font-bold">Demain à ${timeFormatted} :</span> ${s.name}`;
    } else {
      const dayName = DAYS_FR[s.day];
      textEl.innerHTML = `<span class="text-amber-300 font-bold">Prochain culte : ${dayName} à ${timeFormatted}</span> &bull; ${s.name}`;
    }
  }

  updateTicker();
  setInterval(updateTicker, 30000);
}

/* ==========================================================================
   2. VERSET BIBLIQUE DU JOUR (API HELLOAO + POINTE-NOIRE TIMEZONE & FALLBACK)
   ========================================================================== */
const VERSE_STORAGE_KEY = 'e11_daily_bible_verse';
const POINTE_NOIRE_TZ = 'Africa/Brazzaville'; // UTC+1 (Congo-Brazzaville)

// Base de versets inspirés Louis Segond 1910 (Foi apostolique, Amour divin, Saint-Esprit, Enlèvement)
const CURATED_VERSES = [
  {
    ref: "1 Thessaloniciens 4:16-17",
    text: "Car le Seigneur lui-même, à un signal donné, à la voix d'un archange, et au son de la trompette de Dieu, descendra du ciel, et les morts en Christ ressusciteront premièrement. Ensuite, nous les vivants, qui serons restés, nous serons tous ensemble enlevés avec eux sur des nuées, à la rencontre du Seigneur dans les airs, et ainsi nous serons toujours avec le Seigneur.",
    bookId: "1TH",
    chapter: 4,
    startVerse: 16,
    endVerse: 17,
    theme: "L'Enlèvement de l'Église"
  },
  {
    ref: "Psaume 23:1-3",
    text: "L’Éternel est mon berger: je ne manquerai de rien. Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles. Il restaure mon âme, Il me conduit dans les sentiers de la justice, à cause de son nom.",
    bookId: "PSA",
    chapter: 23,
    startVerse: 1,
    endVerse: 3,
    theme: "Restauration spirituelle"
  },
  {
    ref: "Jean 3:16",
    text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
    bookId: "JHN",
    chapter: 3,
    startVerse: 16,
    endVerse: 16,
    theme: "L'Amour Divin"
  },
  {
    ref: "Actes 1:8",
    text: "Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu'aux extrémités de la terre.",
    bookId: "ACT",
    chapter: 1,
    startVerse: 8,
    endVerse: 8,
    theme: "La puissance du Saint-Esprit"
  },
  {
    ref: "Romains 8:28",
    text: "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.",
    bookId: "ROM",
    chapter: 8,
    startVerse: 28,
    endVerse: 28,
    theme: "La souveraineté de Dieu"
  },
  {
    ref: "Éphésiens 2:8-10",
    text: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu. Non par les œuvres, afin que personne ne se glorifie.",
    bookId: "EPH",
    chapter: 2,
    startVerse: 8,
    endVerse: 10,
    theme: "La foi apostolique"
  },
  {
    ref: "Philippiens 4:13",
    text: "Je puis tout par celui qui me fortifie.",
    bookId: "PHP",
    chapter: 4,
    startVerse: 13,
    endVerse: 13,
    theme: "Force et victoire"
  },
  {
    ref: "Jérémie 29:11",
    text: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.",
    bookId: "JER",
    chapter: 29,
    startVerse: 11,
    endVerse: 11,
    theme: "Espérance vivante"
  },
  {
    ref: "1 Corinthiens 13:13",
    text: "Maintenant donc ces trois choses demeurent: la foi, l'espérance, l'amour; mais la plus grande de ces choses, c'est l'amour.",
    bookId: "1CO",
    chapter: 13,
    startVerse: 13,
    endVerse: 13,
    theme: "L'Amour Parfait"
  },
  {
    ref: "Jean 14:1-3",
    text: "Que votre cœur ne se trouble point. Croyez en Dieu, et croyez en moi. Il y a plusieurs demeures dans la maison de mon Père. Je vais vous préparer une place. Et, lorsque je m'en serai allé, je reviendrai, et je vous prendrai avec moi, afin que là où je suis vous y soyez aussi.",
    bookId: "JHN",
    chapter: 14,
    startVerse: 1,
    endVerse: 3,
    theme: "La Promesse du Retour"
  },
  {
    ref: "Ésaïe 40:31",
    text: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; ils courent, et ne se lassent point; ils marchent, et ne se fatiguent point.",
    bookId: "ISA",
    chapter: 40,
    startVerse: 31,
    endVerse: 31,
    theme: "Renouvellement spirituel"
  },
  {
    ref: "Hébreux 11:1",
    text: "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas.",
    bookId: "HEB",
    chapter: 11,
    startVerse: 1,
    endVerse: 1,
    theme: "La Foi véritable"
  }
];

function getPointeNoireDateString() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: POINTE_NOIRE_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date()); // Format YYYY-MM-DD
  } catch (e) {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }
}

// Calcule un index déterministe pour la date de Pointe-Noire
function getDayDeterministicIndex(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % CURATED_VERSES.length;
}

async function fetchFromHelloAoAPI(verseObj) {
  // Documentation : https://bible.helloao.org/api/fra_lsg/{book}/{chapter}.json
  const url = `https://bible.helloao.org/api/fra_lsg/${verseObj.bookId}/${verseObj.chapter}.json`;
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  const data = await response.json();
  const content = data.chapter?.content || [];
  
  // Extraction des versets cibles
  const matched = content.filter(item => 
    item.type === 'verse' && 
    item.number >= verseObj.startVerse && 
    item.number <= (verseObj.endVerse || verseObj.startVerse)
  );

  if (matched.length > 0) {
    const extractedText = matched.map(v => {
      if (Array.isArray(v.content)) {
        return v.content.map(c => typeof c === 'string' ? c : (c.text || '')).join(' ').trim();
      }
      return typeof v.content === 'string' ? v.content : '';
    }).join(' ').replace(/\s+/g, ' ').trim();

    if (extractedText.length > 5) {
      return {
        ref: verseObj.ref,
        text: extractedText,
        theme: verseObj.theme,
        source: 'API HelloAO (Louis Segond 1910)'
      };
    }
  }
  throw new Error("Format de verset inattendu");
}

let currentVerseIndex = 0;

function initVerseOfTheDay() {
  const verseTextEl = document.getElementById('daily-verse-text');
  const verseRefEl = document.getElementById('daily-verse-ref');
  const verseThemeEl = document.getElementById('daily-verse-theme');
  const refreshBtn = document.getElementById('refresh-verse-btn');
  const verseLoading = document.getElementById('verse-loading');
  const verseCard = document.getElementById('verse-card-content');
  const apiStatusEl = document.getElementById('verse-api-status');

  const todayStr = getPointeNoireDateString();
  currentVerseIndex = getDayDeterministicIndex(todayStr);

  async function displayVerse(index, isManualCycle = false) {
    const targetVerse = CURATED_VERSES[index];
    
    // Si c'est le verset du jour et qu'il est déjà en cache pour aujourd'hui
    if (!isManualCycle) {
      const cached = localStorage.getItem(VERSE_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === todayStr && parsed.verse) {
            renderVerseData(parsed.verse);
            return;
          }
        } catch (e) {
          console.warn("Erreur lecture cache verset:", e);
        }
      }
    }

    // Afficher l'état de chargement
    if (verseLoading && verseCard) {
      verseLoading.classList.remove('hidden');
      verseCard.classList.add('opacity-40');
    }

    let finalVerse = null;

    try {
      // Tentative de récupération depuis l'API officielle HelloAO (Louis Segond 1910)
      const apiResult = await Promise.race([
        fetchFromHelloAoAPI(targetVerse),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
      ]);
      finalVerse = apiResult;
    } catch (err) {
      // Fallback gracieux et direct vers le texte certifié Louis Segond 1910
      finalVerse = {
        ref: targetVerse.ref,
        text: targetVerse.text,
        theme: targetVerse.theme,
        source: 'Louis Segond 1910 (Archive locale certifiée)'
      };
    } finally {
      if (verseLoading && verseCard) {
        verseLoading.classList.add('hidden');
        verseCard.classList.remove('opacity-40');
      }
    }

    renderVerseData(finalVerse);

    // Mettre en cache si c'est le verset du jour
    if (!isManualCycle) {
      try {
        localStorage.setItem(VERSE_STORAGE_KEY, JSON.stringify({
          date: todayStr,
          verse: finalVerse
        }));
      } catch (e) {}
    }
  }

  function renderVerseData(verse) {
    if (verseTextEl) {
      verseTextEl.textContent = `« ${verse.text} »`;
    }
    if (verseRefEl) {
      verseRefEl.textContent = verse.ref;
    }
    if (verseThemeEl) {
      verseThemeEl.textContent = verse.theme || 'Méditation chrétienne';
    }
    if (apiStatusEl) {
      apiStatusEl.textContent = `Version : ${verse.source || 'Louis Segond 1910'} • Fuseau Pointe-Noire (GMT+1)`;
    }
  }

  // Chargement initial du verset du jour
  displayVerse(currentVerseIndex, false);

  // Bouton pour découvrir un autre verset inspirant
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      currentVerseIndex = (currentVerseIndex + 1) % CURATED_VERSES.length;
      displayVerse(currentVerseIndex, true);
    });
  }
}

/* ==========================================================================
   3. GALERIE PHOTOS AVEC FILTRES & VISIONNEUSE (LIGHTBOX)
   ========================================================================== */
function initGalleryAndLightbox() {
  const filterBtns = document.querySelectorAll('.gallery-tab');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-image');
  const lightboxBadge = document.getElementById('lightbox-badge');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxShare = document.getElementById('lightbox-share');
  const lightboxActionContainer = document.getElementById('lightbox-action-container');

  let activeIndex = 0;
  let visibleItems = Array.from(galleryItems);

  // Mise à jour automatique des badges de comptage dans chaque onglet
  filterBtns.forEach(btn => {
    const filter = btn.getAttribute('data-filter') || 'all';
    const countBadge = btn.querySelector('.count-badge');
    if (countBadge) {
      if (filter === 'all') {
        countBadge.textContent = galleryItems.length;
      } else {
        const matchingCount = Array.from(galleryItems).filter(item => item.getAttribute('data-category') === filter).length;
        countBadge.textContent = matchingCount;
      }
    }
  });

  // Filtrage par catégorie avec transition fluide
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-sky-900', 'text-white');
        const badge = b.querySelector('.count-badge');
        if (badge) {
          badge.classList.remove('bg-white/20');
          badge.classList.add('bg-sky-100', 'text-sky-800');
        }
      });

      btn.classList.add('active', 'bg-sky-900', 'text-white');
      const activeBadge = btn.querySelector('.count-badge');
      if (activeBadge) {
        activeBadge.classList.add('bg-white/20');
        activeBadge.classList.remove('bg-sky-100', 'text-sky-800');
      }

      const filter = btn.getAttribute('data-filter') || 'all';

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.classList.remove('hidden');
          item.style.opacity = '0';
          item.style.transform = 'scale(0.97)';
          setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 30);
        } else {
          item.classList.add('hidden');
        }
      });

      // Mettre à jour la liste des éléments visibles pour la visionneuse
      visibleItems = Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
    });
  });

  // Ouvrir la visionneuse moderne
  function openLightbox(index) {
    if (visibleItems.length === 0) return;
    activeIndex = (index + visibleItems.length) % visibleItems.length;
    const currentItem = visibleItems[activeIndex];
    const imgEl = currentItem.querySelector('img');
    const badgeText = currentItem.getAttribute('data-badge') || '11e Heure Tabernacle';
    const titleText = currentItem.getAttribute('data-title') || imgEl?.alt || 'Galerie';
    const captionText = currentItem.getAttribute('data-caption') || imgEl?.alt || 'Moments précieux à 11e Heure Tabernacle';
    const category = currentItem.getAttribute('data-category') || '';

    if (lightboxImg && imgEl) {
      lightboxImg.style.opacity = '0';
      lightboxImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        lightboxImg.src = imgEl.src;
        lightboxImg.alt = imgEl.alt;
        lightboxImg.style.opacity = '1';
        lightboxImg.style.transform = 'scale(1)';
      }, 100);
    }

    if (lightboxBadge) {
      lightboxBadge.textContent = badgeText;
    }
    if (lightboxTitle) {
      lightboxTitle.textContent = titleText;
    }
    if (lightboxCaption) {
      lightboxCaption.textContent = captionText;
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = `${activeIndex + 1} / ${visibleItems.length}`;
    }

    // Actions spécifiques (par exemple bouton écoute YouTube pour le cantique)
    if (lightboxActionContainer) {
      if (titleText.includes('vision') || category === 'ministere') {
        lightboxActionContainer.innerHTML = `
          <a href="https://wa.me/242069376967?text=${encodeURIComponent('Bonjour Pasteur Odilon, je souhaite en savoir plus sur votre ministère et le chant : ' + titleText)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span>Infos Chant & Ministère</span>
          </a>
        `;
      } else {
        lightboxActionContainer.innerHTML = '';
      }
    }

    lightbox?.classList.add('active');
    document.body.style.overflow = 'hidden'; // Empêcher le défilement d'arrière-plan
  }

  // Fermer la visionneuse
  function closeLightbox() {
    lightbox?.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Navigation dans la visionneuse
  function prevImage() {
    openLightbox(activeIndex - 1);
  }

  function nextImage() {
    openLightbox(activeIndex + 1);
  }

  // Partager la photo active sur WhatsApp
  lightboxShare?.addEventListener('click', () => {
    if (visibleItems.length === 0) return;
    const currentItem = visibleItems[activeIndex];
    const titleText = currentItem.getAttribute('data-title') || 'Photo 11e Heure Tabernacle';
    const captionText = currentItem.getAttribute('data-caption') || '';
    const shareUrl = window.location.origin + window.location.pathname + '#galerie';
    const message = `🕊️ *11e Heure Tabernacle — Pointe-Noire*\n📸 *${titleText}*\n${captionText}\n\nDécouvrez notre assemblée : ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  });

  // Clic sur un item de la grille pour ouvrir
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const index = visibleItems.indexOf(item);
      if (index !== -1) {
        openLightbox(index);
      }
    });
  });

  // Boutons de contrôle Lightbox
  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    prevImage();
  });
  lightboxNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    nextImage();
  });

  // Fermeture par clic sur l'arrière-plan sombre
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Support des touches du clavier (Escape, Flèche Gauche, Flèche Droite)
  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  // Support tactile du glissement (swipe mobile)
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const threshold = 45;
    if (touchEndX < touchStartX - threshold) {
      nextImage(); // glissement vers la gauche
    }
    if (touchEndX > touchStartX + threshold) {
      prevImage(); // glissement vers la droite
    }
  }
}

/* ==========================================================================
   4. FORMULAIRE DE CONTACT & ENVOI VIA WHATSAPP
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('church-contact-form');
  const alertContainer = document.getElementById('contact-alert');
  const directWhatsappBtn = document.getElementById('form-whatsapp-direct');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name')?.value.trim();
    const email = document.getElementById('contact-email')?.value.trim();
    const phone = document.getElementById('contact-phone')?.value.trim();
    const subject = document.getElementById('contact-subject')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();

    // Validation des champs requis
    if (!name || !email || !message) {
      showAlert('Veuillez remplir tous les champs obligatoires (Nom, Email et Message).', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Veuillez saisir une adresse email valide.', 'error');
      return;
    }

    // Message clair de conformité au cahier des charges :
    // Aucun backend d'envoi n'est connecté par défaut dans un site vitrine statique.
    const feedbackHtml = `
      <div class="p-4 rounded-xl bg-sky-50 border border-sky-300 text-sky-950 space-y-3">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-sky-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h4 class="font-bold text-sky-900">Message validé côté client !</h4>
            <p class="text-sm mt-1 text-sky-800">
              Conformément à l'architecture vitrine sans serveur backend, votre message n'a pas été envoyé vers une boîte mail de test. Pour joindre instantanément le pasteur <strong>Odilon Detchibs</strong> avec ces informations, cliquez ci-dessous :
            </p>
          </div>
        </div>
        <div class="pt-2 flex flex-wrap gap-2">
          <a href="${buildWhatsAppLink(name, phone, subject, message)}" target="_blank" rel="noopener noreferrer" 
             class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm shadow-md transition-all">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
            Transmettre sur WhatsApp (+242 06 937 69 67)
          </a>
        </div>
      </div>
    `;

    if (alertContainer) {
      alertContainer.innerHTML = feedbackHtml;
      alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.reset();
  });

  function showAlert(msg, type = 'info') {
    if (!alertContainer) return;
    const isErr = type === 'error';
    alertContainer.innerHTML = `
      <div class="p-4 rounded-xl ${isErr ? 'bg-red-50 border-red-300 text-red-800' : 'bg-sky-50 border-sky-300 text-sky-800'} border text-sm font-medium">
        ${msg}
      </div>
    `;
  }
}

function buildWhatsAppLink(name, phone, subject, message) {
  const churchPhone = "242069376967";
  const text = `*Message pour 11e Heure Tabernacle*\n*Nom :* ${name}\n*Téléphone :* ${phone || 'Non renseigné'}\n*Sujet :* ${subject || 'Prise de contact'}\n*Message :*\n${message}`;
  return `https://wa.me/${churchPhone}?text=${encodeURIComponent(text)}`;
}

/* ==========================================================================
   5. ACTIONS INTERACTIVES SUR LE VERSET (COPIER & PARTAGER) & TOAST
   ========================================================================== */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('dynamic-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast) return;

  if (msgEl) msgEl.textContent = message;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function initVerseActions() {
  const copyBtn = document.getElementById('copy-verse-btn');
  const shareBtn = document.getElementById('share-verse-btn');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const refEl = document.getElementById('daily-verse-ref');
      const textEl = document.getElementById('daily-verse-text');
      const themeEl = document.getElementById('daily-verse-theme');

      const ref = refEl ? refEl.textContent.trim() : 'La Sainte Bible';
      const text = textEl ? textEl.textContent.trim().replace(/^«\s*|\s*»$/g, '') : '';
      const theme = themeEl ? themeEl.textContent.trim() : '';

      const fullShareText = `📖 VERSET DU JOUR — 11e Heure Tabernacle\n\n« ${text} »\n\n📍 Référence : ${ref}${theme ? ' (' + theme + ')' : ''}\n🙏 Église 11e Heure Tabernacle • Pointe-Noire (Congo)\nPasteur Odilon Detchibs\nCultes : Voungou 1 (arrêt 1er Pont)`;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(fullShareText);
        } else {
          const ta = document.createElement('textarea');
          ta.value = fullShareText;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        showToast('Verset copié avec succès ! Prêt à être partagé.');
      } catch (e) {
        showToast('Verset sélectionné pour la copie.');
      }
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const refEl = document.getElementById('daily-verse-ref');
      const textEl = document.getElementById('daily-verse-text');
      const ref = refEl ? refEl.textContent.trim() : 'La Sainte Bible';
      const text = textEl ? textEl.textContent.trim().replace(/^«\s*|\s*»$/g, '') : '';

      const waText = `*📖 VERSET DU JOUR — 11e Heure Tabernacle*\n\n« ${text} »\n\n*${ref}*\n\n_11e Heure Tabernacle • Pointe-Noire (Congo)_\n_Pasteur Odilon Detchibs • Voungou 1_`;
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
}

/* ==========================================================================
   6. ACCORDÉON FAQ FLUIDE (QUESTIONS FRÉQUENTES)
   ========================================================================== */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-accordion-item');
  if (!items.length) return;

  items.forEach(item => {
    const header = item.querySelector('.faq-accordion-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Fermeture des autres questions (accordéon exclusif)
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
        }
      });

      // Bascule de l'élément cliqué
      if (isOpen) {
        item.classList.remove('open');
      } else {
        item.classList.add('open');
      }
    });
  });
}

/* ==========================================================================
   7. SCROLL REVEAL (ANIMATION DOUCE À L'APPARITION AU DÉFILEMENT)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   8. BOUTON FLOTTANT RETOUR EN HAUT (BACK TO TOP)
   ========================================================================== */
function initBackToTop() {
  const btn = document.getElementById('back-to-top-btn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 380) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==========================================================================
   9. ANNÉE COURANTE DYNAMIQUE DANS LE FOOTER
   ========================================================================== */
function initCurrentYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* ==========================================================================
   10. SCROLLSPY & NAVIGATION ACTIVE MAJESTUEUSE
   ========================================================================== */
function initSmoothScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const desktopLinks = document.querySelectorAll('.desktop-nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');

        // Liens Bureau (Desktop)
        desktopLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        // Liens Tiroir Mobile
        mobileLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('text-amber-300', 'bg-white/10', 'border', 'border-amber-400/25');
            link.classList.remove('text-slate-200');
          } else {
            link.classList.remove('text-amber-300', 'bg-white/10', 'border', 'border-amber-400/25');
            link.classList.add('text-slate-200');
          }
        });
      }
    });
  }, {
    threshold: 0.25,
    rootMargin: "-80px 0px -30% 0px"
  });

  sections.forEach(section => observer.observe(section));
}
