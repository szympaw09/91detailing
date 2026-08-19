// =========================================================
// 91 DETAILING — interactions
// =========================================================
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Przewijanie — natywne scrollIntoView (szybkie, bez blokowania) ---------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollToEl = (el) => {
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? 'instant' : 'smooth', block: 'start' });
  };
  window.__scrollToEl = scrollToEl;

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const initialHash = a.getAttribute('href');
    if (!initialHash || initialHash.length < 2) return;
    a.addEventListener('click', (e) => {
      // przyciski .cta-call-mobile mogą mieć w tym momencie podmieniony href na "tel:..." — wtedy nie przechwytujemy kliknięcia
      const hash = a.getAttribute('href');
      if (!hash || !hash.startsWith('#') || hash.length < 2) return;
      let target;
      try { target = document.querySelector(hash); } catch (err) { target = null; }
      if (!target) return;
      e.preventDefault();
      scrollToEl(target);
      history.pushState(null, '', hash);
    });
  });

  /* ---------- CTA "Umów wizytę / konsultację / porozmawiajmy" — na mobile dzwonią wprost do studia ---------- */
  // EDYTUJ TU: numer telefonu (ten sam, co w sekcji Kontakt / szybkim kontakcie)
  const CTA_PHONE = 'tel:+48534315315';
  const CTA_BREAKPOINT = '(max-width:780px)';
  const mobileCallLinks = Array.from(document.querySelectorAll('.cta-call-mobile'));
  if (mobileCallLinks.length) {
    const mq = window.matchMedia(CTA_BREAKPOINT);
    const applyMobileCta = () => {
      mobileCallLinks.forEach(a => {
        if (!a.dataset.hrefDefault) a.dataset.hrefDefault = a.getAttribute('href');
        if (mq.matches) {
          a.setAttribute('href', CTA_PHONE);
        } else {
          a.setAttribute('href', a.dataset.hrefDefault);
        }
      });
    };
    applyMobileCta();
    if (mq.addEventListener) mq.addEventListener('change', applyMobileCta);
    else mq.addListener(applyMobileCta); // starsze przeglądarki
  }

  /* ---------- Sticky header ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  navToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Marquee – ciągły scroll + przeciąganie ---------- */
  const marqueeWrap  = document.querySelector('.marquee');
  const marqueeTrack = document.querySelector('.marquee-track');

  if (marqueeWrap && marqueeTrack) {
    const DURATION_S = 32;          // sekundy na jeden pełny obrót (jak było w CSS)

    let pos          = 0;           // aktualna pozycja (px) – może być dowolna liczba
    let speed        = 0;           // px/klatkę – obliczane po pierwszym zmierzeniu szerokości
    let dragging     = false;
    let dragStartX   = 0;
    let dragStartPos = 0;

    /* Zwraca połowę szerokości tracka (treść × 2 kopie → 50% = jedna pętla) */
    const halfW = () => marqueeTrack.scrollWidth / 2;

    /* Bezszwowe zawijanie: mapuje dowolną liczbę na przedział [-h, 0) */
    const wrap = (p) => {
      const h = halfW();
      return ((p % h) + h) % h - h;
    };

    const tick = () => {
      if (!speed) speed = halfW() / (DURATION_S * 60);

      if (!dragging) pos -= speed;

      marqueeTrack.style.transform = `translateX(${wrap(pos)}px)`;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    /* ---- Mysz ---- */
    marqueeWrap.addEventListener('mousedown', (e) => {
      dragging     = true;
      dragStartX   = e.clientX;
      dragStartPos = pos;
      marqueeWrap.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      pos = dragStartPos + (e.clientX - dragStartX);
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      marqueeWrap.style.cursor = 'grab';
    });

    /* ---- Dotyk (mobile) ---- */
    marqueeWrap.addEventListener('touchstart', (e) => {
      dragging     = true;
      dragStartX   = e.touches[0].clientX;
      dragStartPos = pos;
    }, { passive: true });

    marqueeWrap.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      pos = dragStartPos + (e.touches[0].clientX - dragStartX);
    }, { passive: true });

    marqueeWrap.addEventListener('touchend', () => { dragging = false; });
  }

  /* ---------- Count-up animacja statystyk ---------- */
  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length && 'IntersectionObserver' in window) {
    const animateCount = (el) => {
      const target   = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const valEl    = el.querySelector('.count-val');
      if (!valEl) return;
      const duration = 1600;
      const startTime = performance.now();

      const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      const step = (now) => {
        const elapsed  = Math.min(now - startTime, duration);
        const progress = easeOutExpo(elapsed / duration);
        const current  = target * progress;
        valEl.textContent = decimals > 0
          ? current.toFixed(decimals)
          : Math.floor(current).toString();
        if (elapsed < duration) requestAnimationFrame(step);
        else valEl.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
      };

      requestAnimationFrame(step);
    };

    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    countEls.forEach(el => {
      const valEl = el.querySelector('.count-val');
      if (valEl) valEl.textContent = el.dataset.decimals ? '0.0' : '0';
      countObserver.observe(el);
    });
  }

  /* ---------- Before / After slider ---------- */
  const ba = document.getElementById('baSlider');
  if (ba) {
    const handle = ba.querySelector('.ba-handle');
    let dragging = false;

    const setPos = (clientX) => {
      const rect = ba.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty('--pos', pct + '%');
      handle.style.left = pct + '%';
    };

    const start = (e) => {
      dragging = true;
      setPos(e.touches ? e.touches[0].clientX : e.clientX);
    };
    const move = (e) => {
      if (!dragging) return;
      setPos(e.touches ? e.touches[0].clientX : e.clientX);
    };
    const end = () => { dragging = false; };

    ba.addEventListener('mousedown', start);
    ba.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);

    // click anywhere on the strip to jump
    ba.addEventListener('click', (e) => setPos(e.clientX));

    // keyboard support
    ba.setAttribute('tabindex', '0');
    ba.setAttribute('role', 'slider');
    ba.setAttribute('aria-label', 'Suwak porównania przed i po mrożeniu lakieru');
    ba.addEventListener('keydown', (e) => {
      const current = parseFloat(getComputedStyle(ba).getPropertyValue('--pos')) || 50;
      const rect = ba.getBoundingClientRect();
      if (e.key === 'ArrowLeft') setPos(rect.left + (rect.width * (current - 5) / 100));
      if (e.key === 'ArrowRight') setPos(rect.left + (rect.width * (current + 5) / 100));
    });

    // reset to center helper (used when switching cars)
    ba.resetPos = () => {
      ba.style.setProperty('--pos', '50%');
      handle.style.left = '50%';
    };
  }

  /* ---------- Samoregeneracja PPF ---------- */
  const healBtn = document.getElementById('healBtn');
  const healPanel = document.getElementById('healPanel');
  if (healBtn && healPanel) {
    let healed = false;
    healBtn.addEventListener('click', () => {
      if (!healed) {
        healPanel.classList.add('healing');
        healPanel.classList.add('healed');
        healed = true;
        healBtn.textContent = 'Zresetuj panel';
      } else {
        healPanel.classList.remove('healing');
        healPanel.classList.remove('healed');
        healed = false;
        healBtn.textContent = '🔥 Aktywuj samoregenerację (Użyj ciepła)';
        // wymuś reflow, aby animacja mogła wystartować od nowa przy kolejnym kliknięciu
        void healPanel.offsetWidth;
      }
    });
  }

  /* ---------- Interaktywna lupa ---------- */
  const loupeWrap = document.getElementById('loupeWrap');
  if (loupeWrap) {
    const loupeImg = document.getElementById('loupeImg');
    const loupeGlass = document.getElementById('loupeGlass');
    const ZOOM = 2.5;

    const positionGlass = (clientX, clientY) => {
      const rect = loupeWrap.getBoundingClientRect();
      let x = clientX - rect.left;
      let y = clientY - rect.top;
      x = Math.max(0, Math.min(x, rect.width));
      y = Math.max(0, Math.min(y, rect.height));

      const glassSize = loupeGlass.offsetWidth;
      loupeGlass.style.left = (x - glassSize / 2) + 'px';
      loupeGlass.style.top = (y - glassSize / 2) + 'px';
      loupeGlass.style.backgroundImage = `url(${loupeImg.currentSrc || loupeImg.src})`;

      // ramka ma teraz stałe proporcje (dopasowane do panelu samoregeneracji), a zdjęcie jest
      // przycinane przez object-fit:cover — trzeba to uwzględnić, żeby podgląd w lupie się nie rozjeżdżał
      const naturalW = loupeImg.naturalWidth || rect.width;
      const naturalH = loupeImg.naturalHeight || rect.height;
      const coverScale = Math.max(rect.width / naturalW, rect.height / naturalH);
      const renderedW = naturalW * coverScale;
      const renderedH = naturalH * coverScale;
      const offsetLeft = (rect.width - renderedW) / 2;   // object-position: center (poziomo)
      const offsetTop = (rect.height - renderedH) * 0.3; // object-position: 30% (pionowo)
      const imgX = x - offsetLeft;
      const imgY = y - offsetTop;

      loupeGlass.style.backgroundSize = (renderedW * ZOOM) + 'px ' + (renderedH * ZOOM) + 'px';
      loupeGlass.style.backgroundPosition = `-${imgX * ZOOM - glassSize / 2}px -${imgY * ZOOM - glassSize / 2}px`;
    };

    loupeWrap.addEventListener('mouseenter', () => loupeWrap.classList.add('active'));
    loupeWrap.addEventListener('mouseleave', () => loupeWrap.classList.remove('active'));
    loupeWrap.addEventListener('mousemove', (e) => positionGlass(e.clientX, e.clientY));

    loupeWrap.addEventListener('touchstart', (e) => {
      loupeWrap.classList.add('active');
      const t = e.touches[0];
      if (t) positionGlass(t.clientX, t.clientY);
    }, { passive: true });
    loupeWrap.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (t) positionGlass(t.clientX, t.clientY);
    }, { passive: true });
    loupeWrap.addEventListener('touchend', () => loupeWrap.classList.remove('active'));

    const loupeMobileBtn = document.getElementById('loupeMobileBtn');
    if (loupeMobileBtn) {
      loupeMobileBtn.addEventListener('click', () => {
        const isActive = loupeWrap.classList.toggle('active');
        if (isActive) {
          const rect = loupeWrap.getBoundingClientRect();
          positionGlass(rect.left + rect.width / 2, rect.top + rect.height / 2);
          loupeMobileBtn.textContent = 'Zmniejsz';
        } else {
          loupeMobileBtn.textContent = 'Powiększ detale';
        }
      });
    }
  }

  /* ---------- FAQ akordeon (płynne rozwijanie/zwijanie) ---------- */
  const faqList = document.getElementById('faqList');
  if (faqList) {
    const questions = Array.from(faqList.querySelectorAll('.faq-question'));

    const closeAnswer = (answer) => {
      if (!answer) return;
      answer.classList.remove('is-open');
      answer.setAttribute('aria-hidden', 'true');
    };
    const openAnswer = (answer) => {
      if (!answer) return;
      answer.classList.add('is-open');
      answer.setAttribute('aria-hidden', 'false');
    };

    questions.forEach(btn => {
      btn.addEventListener('click', () => {
        const answer = document.getElementById(btn.getAttribute('aria-controls'));
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        questions.forEach(other => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            closeAnswer(document.getElementById(other.getAttribute('aria-controls')));
          }
        });
        btn.setAttribute('aria-expanded', String(!isOpen));
        if (isOpen) closeAnswer(answer);
        else openAnswer(answer);
      });
    });
  }

  /* ---------- Wybór auta do porównania mrożenia ---------- */
  const frostCarSelect = document.getElementById('frostCarSelect');
  if (frostCarSelect && ba) {
    // EDYTUJ TU: pliki i opisy dla każdego auta w porównaniu mrożenia
    const FROST_CARS = {
      porsche: {
        after: 'frost-porsche-after.jpg',
        before: 'frost-porsche-before.jpg',
        caption: 'Porsche Macan — zmiana wykończenia lakieru z połysku na mat (frost), zabieg w pełni odwracalny.'
      },
      maybach: {
        after: 'frost-maybach-after.jpg',
        before: 'frost-maybach-before.jpg',
        caption: 'Mercedes-Maybach GLS — zmiana wykończenia lakieru z połysku na mat (frost), zabieg w pełni odwracalny.'
      },
      vw: {
        after: 'frost-vw-after.jpg',
        before: 'frost-vw-before.jpg',
        caption: 'Volkswagen Tiguan — zmiana wykończenia lakieru z połysku na mat (frost), zabieg w pełni odwracalny.'
      }
    };

    const afterImg = document.getElementById('baAfterImg');
    const beforeImg = document.getElementById('baBeforeImg');
    const caption = document.getElementById('frostCaption');
    const carChips = Array.from(frostCarSelect.querySelectorAll('.chip'));

    carChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const car = FROST_CARS[chip.dataset.car];
        if (!car) return;
        carChips.forEach(c => c.classList.toggle('active', c === chip));
        afterImg.src = car.after;
        beforeImg.src = car.before;
        caption.textContent = car.caption;
        if (ba.resetPos) ba.resetPos();
      });
    });
  }

  /* ---------- Podgląd wideo w galerii po najechaniu ---------- */
  document.querySelectorAll('.gallery-item-video').forEach(item => {
    const video = item.querySelector('.gallery-video');
    if (!video) return;
    item.addEventListener('mouseenter', () => { video.play().catch(() => {}); });
    item.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
  });

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const videoSrc = item.dataset.video;
      if (videoSrc) {
        lightboxImg.style.display = 'none';
        lightboxVideo.style.display = 'block';
        lightboxVideo.src = videoSrc;
        lightboxVideo.muted = false;
        lightboxVideo.currentTime = 0;
        lightboxVideo.play().catch(() => {});
      } else {
        const img = item.querySelector('img');
        lightboxVideo.pause();
        lightboxVideo.removeAttribute('src');
        lightboxVideo.style.display = 'none';
        lightboxImg.style.display = 'block';
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
      }
      lightboxCaption.textContent = item.dataset.caption || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lightboxVideo.pause();
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------- Zakładki formularza: pełny vs. szybki kontakt (tylko numer) ---------- */
  const tabFull = document.getElementById('tabFull');
  const tabQuick = document.getElementById('tabQuick');
  const carRow = document.getElementById('carRow');
  const msgRow = document.getElementById('msgRow');
  const fContact = document.getElementById('f-contact');
  const fMsg = document.getElementById('f-msg');
  const contactSubmitBtnEl = document.getElementById('contactSubmitBtn');
  const QUICK_MESSAGE = 'Proszę o kontakt telefoniczny — zostawiam tylko numer, oddzwońcie do mnie.';
  let quickMode = false;

  if (tabFull && tabQuick) {
    const setMode = (quick) => {
      quickMode = quick;
      tabFull.classList.toggle('active', !quick);
      tabQuick.classList.toggle('active', quick);
      tabFull.setAttribute('aria-selected', String(!quick));
      tabQuick.setAttribute('aria-selected', String(quick));
      carRow.classList.toggle('is-hidden', quick);
      msgRow.classList.toggle('is-hidden', quick);
      if (fMsg) fMsg.required = !quick;
      if (fContact) {
        fContact.placeholder = quick ? 'Twój numer telefonu' : '';
        fContact.setAttribute('autocomplete', 'tel');
      }
      if (contactSubmitBtnEl) contactSubmitBtnEl.textContent = quick ? 'Oddzwonimy do Ciebie' : 'Wyślij zapytanie';
    };
    tabFull.addEventListener('click', () => setMode(false));
    tabQuick.addEventListener('click', () => setMode(true));
  }

  /* ---------- Contact form (Web3Forms — wysyłka bez przeładowania strony) ---------- */
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  const submitBtn = document.getElementById('contactSubmitBtn');
  if (form) {
    form.addEventListener('submit', () => {
      // w trybie "tylko numer" wiadomość jest opcjonalna — wypełnij ją domyślną treścią przed wysyłką
      if (quickMode && fMsg && !fMsg.value.trim()) fMsg.value = QUICK_MESSAGE;
    }, true);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // prosty honeypot antyspamowy — jeśli wypełniony, to bot
      if (form.botcheck && form.botcheck.value) return;

      const accessKey = form.access_key ? form.access_key.value : '';
      const name = form.name.value.trim();
      const contact = form.contact.value.trim();
      const car = form.car.value.trim();
      const message = form.message.value.trim();

      // Fallback: klucz Web3Forms nie został jeszcze wklejony — użyj mailto, żeby formularz działał od razu
      if (!accessKey || accessKey.indexOf('WKLEJ_TU') === 0) {
        const subject = encodeURIComponent(`Zapytanie ze strony — ${name}`);
        const body = encodeURIComponent(
          `Imię i nazwisko: ${name}\nKontakt: ${contact}\nAuto: ${car || '—'}\n\nWiadomość:\n${message}`
        );
        window.location.href = `mailto:91detailing@gmail.com?subject=${subject}&body=${body}`;
        formNote.textContent = 'Otworzyliśmy program pocztowy z gotową wiadomością — wystarczy ją wysłać. (Podłącz Web3Forms, aby wysyłać bez tego kroku.)';
        formNote.classList.remove('error');
        formNote.classList.add('success');
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wysyłanie…'; }
      formNote.classList.remove('error', 'success');
      formNote.textContent = 'Wysyłanie wiadomości…';

      try {
        const payload = {
          access_key: accessKey,
          subject: form.subject ? form.subject.value : 'Nowe zapytanie ze strony 91 Detailing',
          from_name: form.from_name ? form.from_name.value : 'Formularz — 91 Detailing',
          name,
          contact,
          car: car || '—',
          message
        };
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
          form.reset();
          formNote.textContent = 'Dziękujemy! Wiadomość została wysłana — odezwiemy się najszybciej, jak to możliwe.';
          formNote.classList.add('success');
        } else {
          throw new Error(data.message || 'Nieznany błąd wysyłki');
        }
      } catch (err) {
        formNote.textContent = 'Nie udało się wysłać formularza. Zadzwoń lub napisz na 91detailing@gmail.com.';
        formNote.classList.add('error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Wyślij zapytanie'; }
      }
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- QUIZ: dobierz usługę ---------- */
  const quizCard = document.getElementById('quizCard');
  if (quizCard) {
    const steps = Array.from(quizCard.querySelectorAll('.quiz-step'));
    const dots = Array.from(quizCard.querySelectorAll('.quiz-progress .dot'));
    const result = document.getElementById('quizResult');
    const resultTitle = document.getElementById('quizResultTitle');
    const resultDesc = document.getElementById('quizResultDesc');
    const resultLink = document.getElementById('quizResultLink');
    const restartBtn = document.getElementById('quizRestart');

    // EDYTUJ TU: treści rekomendacji wyświetlanych po quizie
    const SERVICE_INFO = {
      ppf: {
        title: 'Folie ochronne PPF',
        desc: 'Przy Twoim stylu jeżdżenia priorytetem jest ochrona przed odpryskami i rysami — folia PPF to najlepsza inwestycja w trwały wygląd lakieru.'
      },
      detailing: {
        title: 'Detailing',
        desc: 'Najbardziej zależy Ci na czystości i pielęgnacji — pełny detailing wnętrza i karoserii odświeży auto od podstaw.'
      },
      rysy: {
        title: 'Usuwanie rys',
        desc: 'Korekta lakieru zredukuje mikrorysy i przywróci głębię koloru — idealne rozwiązanie dla auta w tym wieku.'
      },
      renowacja: {
        title: 'Renowacja i polerowanie',
        desc: 'Twój lakier zasługuje na pełną renowację — wielostopniowe polerowanie przywróci mu fabryczny, a czasem lepszy niż fabryczny, wygląd.'
      },
      mrozenie: {
        title: 'Mrożenie lakieru',
        desc: 'Skoro zależy Ci na wyróżniającym się wyglądzie na zlotach i wyjazdach — mrożenie da Twojemu autu głęboki, satynowy charakter.'
      }
    };

    let currentStep = 0;
    const tally = { ppf: 0, detailing: 0, rysy: 0, renowacja: 0, mrozenie: 0 };

    const showStep = (i) => {
      steps.forEach((s, idx) => { s.hidden = idx !== i; });
      dots.forEach((d, idx) => d.classList.toggle('active', idx <= i));
    };

    const showResult = () => {
      let best = 'ppf', bestScore = -1;
      Object.keys(tally).forEach(key => {
        if (tally[key] > bestScore) { bestScore = tally[key]; best = key; }
      });
      const info = SERVICE_INFO[best];
      resultTitle.textContent = info.title;
      resultDesc.textContent = info.desc;
      resultLink.setAttribute('href', '#realizacje');
      quizCard.querySelector('.quiz-progress').hidden = true;
      steps.forEach(s => { s.hidden = true; });
      result.hidden = false;
    };

    quizCard.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-service]');
      if (!btn) return;
      tally[btn.dataset.service] += 1;
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        showStep(currentStep);
      } else {
        showResult();
      }
    });

    restartBtn.addEventListener('click', () => {
      Object.keys(tally).forEach(k => { tally[k] = 0; });
      currentStep = 0;
      result.hidden = true;
      quizCard.querySelector('.quiz-progress').hidden = false;
      showStep(0);
    });
  }

  /* ---------- KALKULATOR / KONFIGURATOR PPF ---------- */
  const calcBlock = document.getElementById('kalkulator');
  if (calcBlock) {
    const segmentChipsCheck = document.querySelectorAll('#segmentChips .chip');
    const zoneChipsCheck = document.querySelectorAll('#zoneChips .chip');
    const sensitiveChipCheck = document.querySelector('#zoneChips [data-zone="sensitive"]');
    const frostChipCheck = document.getElementById('frostChip');
    const colorChangeChipCheck = document.getElementById('colorChangeChip');
    const frostHintCheck = document.getElementById('frostHint');
    const priceElCheck = document.getElementById('calcPrice');
    const calcCtaCheck = document.getElementById('calcCta');
    const carBodyCheck = document.getElementById('carBody');

    if (!segmentChipsCheck.length || !zoneChipsCheck.length || !sensitiveChipCheck || !frostChipCheck
        || !colorChangeChipCheck || !frostHintCheck || !priceElCheck || !calcCtaCheck || !carBodyCheck) {
      console.warn('Konfigurator PPF: brak wymaganych elementów w HTML — sprawdź, czy index.html jest aktualny (zgodny ze script.js).');
    } else {
    // EDYTUJ TU: ceny orientacyjne (PLN, widełki niska–wysoka) wg segmentu — wartości poglądowe do potwierdzenia
    const SEGMENTS = {
      kompakt: { label: 'Kompakt',       front: [2800, 3500], fullfront: [4000, 4500], fullbody: [11000, 13000] },
      sedan:   { label: 'Sedan / Kombi', front: [3200, 3900], fullfront: [4500, 5000], fullbody: [12000, 14000] },
      suv:     { label: 'SUV',           front: [3600, 4300], fullfront: [5000, 5500], fullbody: [13000, 18000] },
    };
    // Elementy newralgiczne — jedna, stała cena dla wszystkich segmentów, dostępna tylko razem z pakietem Front
    const SENSITIVE = [1000, 1500];
    // Dodatki liczone od pakietu Full Body: mrożenie lakieru, zmiana koloru = mrożenie + 500 zł
    const FROST_ADD = 1500;
    const COLOR_ADD = FROST_ADD + 500;
    const ZONE_LABELS = { sensitive: 'Elementy newralgiczne', front: 'Front', fullfront: 'Full Front', fullbody: 'Full Body' };

    const segmentChips = Array.from(document.querySelectorAll('#segmentChips .chip'));
    const zoneChips = Array.from(document.querySelectorAll('#zoneChips .chip'));
    const sensitiveChip = document.querySelector('#zoneChips [data-zone="sensitive"]');
    const frostChip = document.getElementById('frostChip');
    const colorChangeChip = document.getElementById('colorChangeChip');
    const frostHint = document.getElementById('frostHint');
    const priceEl = document.getElementById('calcPrice');
    const calcCta = document.getElementById('calcCta');
    const svgZones = Array.from(document.querySelectorAll('#carDiagram .zone'));
    const carBody = document.getElementById('carBody');

    let segment = null;
    const selectedZones = new Set();
    let frost = false;
    let colorChange = false;

    const money = (n) => n.toLocaleString('pl-PL') + ' zł';

    const isFull = () => selectedZones.has('fullbody');
    // Elementy newralgiczne: samodzielnie lub razem z "Front" — niedostępne z "Full Front" / "Full Body"
    const sensitiveAllowed = () => !selectedZones.has('fullfront') && !isFull();
    // Mrożenie / zmiana koloru: tylko przy wybranym "Full Body"
    const addonsAllowed = () => isFull();

    const updateVisual = () => {
      const fullOn = isFull();
      carBody.classList.toggle('full-active', fullOn);
      svgZones.forEach(z => {
        const tokens = (z.dataset.zone || '').split(' ').filter(Boolean);
        const on = fullOn || tokens.some(t => selectedZones.has(t));
        z.classList.toggle('active', on);
      });
    };

    const updateChips = () => {
      segmentChips.forEach(c => c.classList.toggle('active', c.dataset.segment === segment));
      const fullOn = isFull();
      zoneChips.forEach(c => {
        if (c.dataset.zone === 'fullbody') {
          c.classList.toggle('active', fullOn);
        } else {
          c.classList.toggle('active', !fullOn && selectedZones.has(c.dataset.zone));
        }
      });
      const allowSensitive = sensitiveAllowed();
      sensitiveChip.disabled = !allowSensitive;
      sensitiveChip.classList.toggle('chip-disabled', !allowSensitive);

      const allowAddons = addonsAllowed();
      frostChip.disabled = !allowAddons;
      frostChip.classList.toggle('chip-disabled', !allowAddons);
      colorChangeChip.disabled = !allowAddons;
      colorChangeChip.classList.toggle('chip-disabled', !allowAddons);
      frostChip.classList.toggle('active', frost);
      colorChangeChip.classList.toggle('active', colorChange);
      frostHint.hidden = allowAddons;
    };

    const updatePrice = () => {
      if (!segment) { priceEl.textContent = 'wybierz segment i zakres'; return; }
      const s = SEGMENTS[segment];
      let low = 0, high = 0;
      if (isFull()) {
        low = s.fullbody[0]; high = s.fullbody[1];
      } else if (selectedZones.size > 0) {
        selectedZones.forEach(z => {
          const range = z === 'sensitive' ? SENSITIVE : s[z];
          if (!range) return;
          low += range[0]; high += range[1];
        });
      } else {
        priceEl.textContent = 'wybierz zakres ochrony';
        return;
      }
      if (frost) { low += FROST_ADD; high += FROST_ADD; }
      if (colorChange) { low += COLOR_ADD; high += COLOR_ADD; }
      const lowR = Math.round(low / 50) * 50;
      const highR = Math.round(high / 50) * 50;
      priceEl.textContent = `${money(lowR)} – ${money(highR)}`;
    };

    const update = () => { updateChips(); updateVisual(); updatePrice(); };

    segmentChips.forEach(chip => {
      chip.addEventListener('click', () => {
        segment = chip.dataset.segment;
        update();
      });
    });

    zoneChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const zone = chip.dataset.zone;
        if (zone === 'fullbody') {
          if (isFull()) {
            selectedZones.delete('fullbody');
          } else {
            selectedZones.clear();
            selectedZones.add('fullbody');
          }
        } else {
          selectedZones.delete('fullbody');
          if (selectedZones.has(zone)) {
            selectedZones.delete(zone);
          } else {
            // "Front" i "Full Front" wzajemnie się wykluczają
            if (zone === 'front') selectedZones.delete('fullfront');
            if (zone === 'fullfront') selectedZones.delete('front');
            selectedZones.add(zone);
          }
        }
        // "Elementy newralgiczne" nie łączy się z "Full Front" ani "Full Body"
        if (!sensitiveAllowed()) selectedZones.delete('sensitive');
        // Mrożenie / zmiana koloru wymagają "Full Body"
        if (!isFull()) { frost = false; colorChange = false; }
        update();
      });
    });

    frostChip.addEventListener('click', () => {
      if (frostChip.disabled) return;
      frost = !frost;
      if (frost) colorChange = false;
      update();
    });

    colorChangeChip.addEventListener('click', () => {
      if (colorChangeChip.disabled) return;
      colorChange = !colorChange;
      if (colorChange) frost = false;
      update();
    });

    calcCta.addEventListener('click', () => {
      const kontakt = document.getElementById('kontakt');
      const msgEl = document.getElementById('f-msg');
      const carEl = document.getElementById('f-car');
      const msgRowEl = document.getElementById('msgRow');
      const carRowEl = document.getElementById('carRow');
      // upewnij się, że widoczny jest pełny formularz, a nie wariant "tylko numer"
      const tabFullBtn = document.getElementById('tabFull');
      if (tabFullBtn && !tabFullBtn.classList.contains('active')) tabFullBtn.click();

      if (segment && msgEl) {
        const s = SEGMENTS[segment];
        const zoneList = isFull()
          ? ['Full Body']
          : Array.from(selectedZones).map(z => ZONE_LABELS[z]);
        if (frost) zoneList.push('Mrożenie lakieru');
        if (colorChange) zoneList.push('Zmiana koloru');
        const summary = `Interesuje mnie wycena PPF.\nSegment: ${s.label}\nZakres: ${zoneList.join(', ') || '—'}\nOrientacyjna wycena ze strony: ${priceEl.textContent}`;
        // konfiguracja z kalkulatora zawsze nadpisuje pola — to najświeższe i najdokładniejsze dane leada
        msgEl.value = summary;
        if (carEl) carEl.value = s.label;
        [msgRowEl, carRowEl].forEach(row => {
          if (!row) return;
          row.classList.remove('flash');
          void row.offsetWidth;
          row.classList.add('flash');
        });
      }
      if (kontakt) (window.__scrollToEl ? window.__scrollToEl(kontakt) : kontakt.scrollIntoView({ behavior: 'smooth' }));
    });

    update();
    }
  }

  /* ---------- Przycisk szybkiego kontaktu ---------- */
  const quickContact = document.getElementById('quickContact');
  const quickToggle = document.getElementById('quickToggle');
  if (quickContact && quickToggle) {
    quickToggle.addEventListener('click', () => {
      const open = quickContact.classList.toggle('open');
      quickToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!quickContact.contains(e.target)) {
        quickContact.classList.remove('open');
        quickToggle.setAttribute('aria-expanded', 'false');
      }
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        quickContact.classList.remove('open');
        quickToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

});
