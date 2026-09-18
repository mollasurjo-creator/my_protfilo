(function () {
  'use strict';

  const TOTAL_FRAMES = 209;
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  if (!canvas || !ctx) return;

  const frames = new Array(TOTAL_FRAMES);
  const loadedFrames = new Set();
  
  // Section & Element References
  const stageHero = document.getElementById('stage-hero');
  const stageServices = document.getElementById('stage-services');
  const stageMetrics = document.getElementById('stage-metrics');
  const stageProjects = document.getElementById('stage-projects');
  const stageMilestones = document.getElementById('stage-milestones');
  const serviceCards = document.querySelectorAll('.service-card');
  const projectCards = document.querySelectorAll('.project-glass-card');
  const indicator = document.getElementById('scroll-indicator');
  const trackNodes = document.querySelectorAll('.track-node');
  const glowRed = document.querySelector('.glow-red');
  const glowCyan = document.querySelector('.glow-cyan');
  const hudStatusText = document.getElementById('hud-status-text');

  let targetFrame = 0;
  let currentFrame = 0;
  let fallbackImage = null;

  // Frame URL resolver pointing directly to the workspace images directory
  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(3, '0');
    return `images/ezgif-frame-${padded}.jpg`;
  }

  // Handle high-density Retina / 4K displays with optimal scaling
  function resizeCanvas() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawInterpolatedFrame(currentFrame);
  }

  // Retrieve exact or closest loaded frame
  function getLoadedFrame(clampedIndex) {
    const img = frames[clampedIndex];
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    if (loadedFrames.size === 0) {
      return fallbackImage && fallbackImage.complete ? fallbackImage : null;
    }

    let closestDist = Infinity;
    let resolvedIndex = clampedIndex;
    for (const loadedIndex of loadedFrames) {
      const dist = Math.abs(loadedIndex - clampedIndex);
      if (dist < closestDist) {
        closestDist = dist;
        resolvedIndex = loadedIndex;
      }
    }
    return frames[resolvedIndex] || fallbackImage || null;
  }

  // Draw frame with aspect-fill and sub-frame crossfading
  function drawInterpolatedFrame(pos) {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, pos));
    const idx1 = Math.floor(clamped);
    const idx2 = Math.min(TOTAL_FRAMES - 1, idx1 + 1);
    const frac = clamped - idx1;

    const img1 = getLoadedFrame(idx1);
    if (!img1) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img1.naturalWidth || 854;
    const imgHeight = img1.naturalHeight || 480;

    // Cover canvas while preserving aspect ratio and center subject alignment
    const ratio = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const drawW = imgWidth * ratio;
    const drawH = imgHeight * ratio;
    const drawX = (canvasWidth - drawW) / 2;
    const drawY = (canvasHeight - drawH) / 2;

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw primary frame
    ctx.globalAlpha = 1.0;
    ctx.drawImage(img1, 0, 0, imgWidth, imgHeight, drawX, drawY, drawW, drawH);

    // Dual-frame interpolation crossfade for seamless cinematic feel
    if (frac > 0.005 && idx2 !== idx1) {
      const img2 = getLoadedFrame(idx2);
      if (img2 && img2.complete && img2.naturalWidth > 0 && img2 !== img1) {
        const ease = frac * frac * (3 - 2 * frac);
        ctx.globalAlpha = ease;
        ctx.drawImage(img2, 0, 0, img2.naturalWidth, img2.naturalHeight, drawX, drawY, drawW, drawH);
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // Window easing calculation helper
  function getWindowEase(p, start, enterEnd, exitStart, end) {
    if (p < start || p > end) return 0;
    if (p < enterEnd) {
      const t = (p - start) / (enterEnd - start);
      return t * t * (3 - 2 * t);
    }
    if (p <= exitStart) return 1;
    const t = 1 - (p - exitStart) / (end - exitStart);
    return t * t * (3 - 2 * t);
  }

  // Section Scrollytelling Driver
  function updateSectionsAndLayers(pos) {
    const progress = pos / (TOTAL_FRAMES - 1);

    // 1. Ambient Glow Parallax Shifting
    if (glowRed) glowRed.style.transform = `translate(${(-progress * 80).toFixed(1)}px, ${(progress * 90).toFixed(1)}px)`;
    if (glowCyan) glowCyan.style.transform = `translate(${(progress * 80).toFixed(1)}px, ${(-progress * 90).toFixed(1)}px)`;

    // 2. HUD Telemetry Update
    if (hudStatusText) {
      const currIdxPadded = String(Math.round(pos) + 1).padStart(3, '0');
      const pctFormatted = (progress * 100).toFixed(1);
      hudStatusText.textContent = `SYS.ONLINE // FRAME ${currIdxPadded}/${TOTAL_FRAMES} // ${pctFormatted}%`;
    }

    // 3. Scroll Indicator Fade Out
    if (indicator) {
      indicator.style.opacity = progress > 0.03 ? '0' : '1';
    }

    // 4. Section 1: Hero (0.0 to 0.17)
    const heroEase = getWindowEase(progress, 0.0, 0.01, 0.11, 0.17);
    if (stageHero) {
      stageHero.style.setProperty('--stage-opacity', heroEase.toFixed(3));
      stageHero.style.setProperty('--stage-y', `${((1 - heroEase) * -30).toFixed(1)}px`);
      stageHero.style.setProperty('--stage-blur', `${((1 - heroEase) * 8).toFixed(1)}px`);
      if (heroEase > 0.25) stageHero.classList.add('is-active');
      else stageHero.classList.remove('is-active');
    }

    // 5. Section 2: Services & Pathways (0.16 to 0.45)
    const servEase = getWindowEase(progress, 0.16, 0.21, 0.40, 0.46);
    if (stageServices) {
      stageServices.style.setProperty('--stage-opacity', servEase.toFixed(3));
      stageServices.style.setProperty('--stage-y', `${((1 - servEase) * 35).toFixed(1)}px`);
      stageServices.style.setProperty('--stage-blur', `${((1 - servEase) * 8).toFixed(1)}px`);
      if (servEase > 0.25) stageServices.classList.add('is-active');
      else stageServices.classList.remove('is-active');
    }

    // Services Cards Sequential Stagger
    serviceCards.forEach((card) => {
      const idx = parseInt(card.getAttribute('data-index'), 10) || 0;
      const startP = 0.17 + idx * 0.055;
      const endP = startP + 0.07;

      let cardT = 0;
      if (progress >= endP) cardT = 1;
      else if (progress > startP) cardT = (progress - startP) / (endP - startP);
      else cardT = 0;

      const cardEase = cardT * cardT * (3 - 2 * cardT);
      const cardOpacity = (cardEase * servEase).toFixed(3);
      const cardY = ((1 - cardEase) * 45).toFixed(1);
      const cardScale = (0.94 + cardEase * 0.06).toFixed(3);
      const cardBlur = ((1 - cardEase) * 8).toFixed(1);

      card.style.setProperty('--card-opacity', cardOpacity);
      card.style.setProperty('--card-y', `${cardY}px`);
      card.style.setProperty('--card-scale', cardScale);
      card.style.setProperty('--card-blur', `${cardBlur}px`);

      if (cardEase > 0.4 && servEase > 0.3) card.classList.add('is-card-active');
      else card.classList.remove('is-card-active');
    });

    // 6. Section 3: Metrics & Arsenal (0.44 to 0.65)
    const metricsEase = getWindowEase(progress, 0.44, 0.49, 0.59, 0.65);
    if (stageMetrics) {
      stageMetrics.style.setProperty('--stage-opacity', metricsEase.toFixed(3));
      stageMetrics.style.setProperty('--stage-y', `${((1 - metricsEase) * 35).toFixed(1)}px`);
      stageMetrics.style.setProperty('--stage-blur', `${((1 - metricsEase) * 8).toFixed(1)}px`);
      if (metricsEase > 0.25) stageMetrics.classList.add('is-active');
      else stageMetrics.classList.remove('is-active');
    }

    // 7. Section 4: Projects & Blueprints (0.63 to 0.83)
    const projEase = getWindowEase(progress, 0.63, 0.68, 0.77, 0.83);
    if (stageProjects) {
      stageProjects.style.setProperty('--stage-opacity', projEase.toFixed(3));
      stageProjects.style.setProperty('--stage-y', `${((1 - projEase) * 35).toFixed(1)}px`);
      stageProjects.style.setProperty('--stage-blur', `${((1 - projEase) * 8).toFixed(1)}px`);
      if (projEase > 0.25) stageProjects.classList.add('is-active');
      else stageProjects.classList.remove('is-active');
    }

    // 8. Section 5: Milestones & Connect (0.81 to 1.00)
    const msEase = getWindowEase(progress, 0.81, 0.87, 1.0, 1.0);
    if (stageMilestones) {
      stageMilestones.style.setProperty('--stage-opacity', msEase.toFixed(3));
      stageMilestones.style.setProperty('--stage-y', `${((1 - msEase) * 35).toFixed(1)}px`);
      stageMilestones.style.setProperty('--stage-blur', `${((1 - msEase) * 8).toFixed(1)}px`);
      if (msEase > 0.25) stageMilestones.classList.add('is-active');
      else stageMilestones.classList.remove('is-active');
    }

    // 9. Update Section Tracker Navigation Active Node
    let activeSec = 0;
    if (progress >= 0.81) activeSec = 4;
    else if (progress >= 0.63) activeSec = 3;
    else if (progress >= 0.44) activeSec = 2;
    else if (progress >= 0.16) activeSec = 1;
    else activeSec = 0;

    trackNodes.forEach((node, i) => {
      if (i === activeSec) node.classList.add('is-active');
      else node.classList.remove('is-active');
    });
  }

  function updateScrollTarget() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollTop / maxScroll)) : 0;
    targetFrame = progress * (TOTAL_FRAMES - 1);
  }

  function animationLoop() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.0001) {
      currentFrame += diff * 0.09;
      if (Math.abs(targetFrame - currentFrame) < 0.0005) {
        currentFrame = targetFrame;
      }
      drawInterpolatedFrame(currentFrame);
      updateSectionsAndLayers(currentFrame);
    }

    requestAnimationFrame(animationLoop);
  }

  function preloadImages() {
    // 1. Load high-res fallback poster first
    fallbackImage = new Image();
    fallbackImage.src = 'images/test_sharp.jpg';
    fallbackImage.onload = () => {
      if (loadedFrames.size === 0) {
        drawInterpolatedFrame(0);
      }
    };

    // 2. Load Frame 0 immediately
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);
    const onFirstLoad = () => {
      frames[0] = firstImg;
      loadedFrames.add(0);
      drawInterpolatedFrame(0);
    };
    firstImg.onload = onFirstLoad;
    if (firstImg.decode) {
      firstImg.decode().then(onFirstLoad).catch(() => {});
    }

    // 3. Batch preload remaining frames in progressive order
    const loadFrame = (idx) => {
      if (idx >= TOTAL_FRAMES) return;
      const img = new Image();
      img.src = getFrameUrl(idx);
      const onLoad = () => {
        frames[idx] = img;
        loadedFrames.add(idx);
        const currFloor = Math.floor(currentFrame);
        const currCeil = Math.ceil(currentFrame);
        if (idx === currFloor || idx === currCeil) {
          drawInterpolatedFrame(currentFrame);
        }
      };
      img.onload = onLoad;
      if (img.decode) {
        img.decode().then(onLoad).catch(() => {});
      }
    };

    // Prioritize first 30 frames for immediate smooth interaction
    for (let i = 1; i < Math.min(30, TOTAL_FRAMES); i++) {
      loadFrame(i);
    }

    // Load remaining frames with slight batching to avoid network bottleneck
    setTimeout(() => {
      for (let i = 30; i < TOTAL_FRAMES; i++) {
        loadFrame(i);
      }
    }, 150);
  }

  // 3D Perspective Tilt on Mouse Move for Cards
  function initCardTilt(cards) {
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const tiltX = (y / (rect.height / 2)) * -6;
        const tiltY = (x / (rect.width / 2)) * 6;
        card.style.transform = `translateY(calc(var(--base-y, 0px) + var(--card-y, 0px) - 8px)) scale(1.02) perspective(600px) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // Smooth Navigation Trigger
  function scrollToSection(secIdx) {
    const targetP = [0.04, 0.30, 0.54, 0.72, 0.94][secIdx] || 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: targetP * maxScroll,
      behavior: 'smooth'
    });
  }

  // Modal Management
  const projectModal = document.getElementById('project-modal');
  const contactModal = document.getElementById('contact-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalActionBtn = document.getElementById('modal-action-btn');
  const contactCloseBtn = document.getElementById('contact-close-btn');
  const btnOpenContact = document.getElementById('btn-open-contact-modal');

  const projectDetails = [
    {
      category: "AUTOCAD 3D // INDUSTRIAL BLUEPRINT",
      title: "Parametric Industrial Mechanical Assembly",
      highlight: "Sub-millimeter ISO 128 / ASME Y14.5 Geometric Dimensioning & Tolerancing (GD&T).",
      description: "Comprehensive 3D solid modeling and 2D manufacturing blueprint generation for complex multi-part mechanical assemblies. Includes exploded views, bills of materials (BOM), tolerance stack-up analysis, and parametric section drafts designed for direct CNC tooling.",
      specs: [
        { label: "Drafting Tool", val: "AutoCAD 2024 / 2025 3D" },
        { label: "Standard", val: "ISO 128 & ASME Y14.5M" },
        { label: "Tolerance", val: "±0.02 mm Micron Precision" },
        { label: "Deliverables", val: "DWG, DXF, STEP, PDF Schematics" }
      ]
    },
    {
      category: "GIS & REMOTE SENSING // HYDROLOGY",
      title: "Geospatial Watershed & Terrain Modeling",
      highlight: "Digital Elevation Model (DEM) hydrological flow routing & slope vectorization.",
      description: "Advanced geospatial terrain analysis using satellite synthetic aperture radar (SAR) and multispectral imagery. Built hydrologically conditioned DEM surfaces, delineated flow accumulation corridors, and modeled drainage catchments with automated geoprocessing toolchains.",
      specs: [
        { label: "GIS Platforms", val: "ArcGIS Pro 3.x & QGIS 3.3x" },
        { label: "Coordinate System", val: "UTM Zone 43N / WGS84" },
        { label: "Resolution", val: "12.5m ALOS PALSAR DEM" },
        { label: "Spatial Outputs", val: "GeoTIFF, Shapefiles, GeoJSON" }
      ]
    },
    {
      category: "POSTGIS & PYTHON // SPATIAL ETL",
      title: "Spatial Data Pipeline & Geodatabase",
      highlight: "Scalable PostGIS vector spatial indexing with Python GeoPandas automation.",
      description: "Designed robust spatial databases capable of querying hundreds of thousands of polygon, polyline, and point geometries with GiST indexing. Authored automated Python scripts for spatial joins, buffer generation, coordinate transformation, and automated reporting.",
      specs: [
        { label: "Database", val: "PostgreSQL 16 + PostGIS 3.4" },
        { label: "Scripting", val: "Python 3.11 (GeoPandas, Shapely)" },
        { label: "Performance", val: "<15ms Spatial Query Latency" },
        { label: "Integrations", val: "REST APIs, QGIS DB Manager" }
      ]
    }
  ];

  function openProjectModal(idx) {
    const data = projectDetails[idx];
    if (!data || !projectModal) return;

    document.getElementById('modal-category').textContent = data.category;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-highlight').textContent = data.highlight;
    document.getElementById('modal-description').textContent = data.description;

    const specsGrid = document.getElementById('modal-specs');
    specsGrid.innerHTML = data.specs.map(s => `
      <div class="spec-item">
        <div class="spec-label">${s.label}</div>
        <div class="spec-val">${s.val}</div>
      </div>
    `).join('');

    projectModal.classList.add('is-open');
    projectModal.setAttribute('aria-hidden', 'false');
  }

  function closeModals() {
    if (projectModal) {
      projectModal.classList.remove('is-open');
      projectModal.setAttribute('aria-hidden', 'true');
    }
    if (contactModal) {
      contactModal.classList.remove('is-open');
      contactModal.setAttribute('aria-hidden', 'true');
    }
  }

  // Event Listeners
  trackNodes.forEach((node) => {
    node.addEventListener('click', () => {
      const sec = parseInt(node.getAttribute('data-sec'), 10);
      scrollToSection(sec);
    });
  });

  document.querySelectorAll('[data-target-sec]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const sec = parseInt(el.getAttribute('data-target-sec'), 10);
      scrollToSection(sec);
    });
  });

  document.querySelectorAll('.btn-inspect-project').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-project-idx'), 10);
      openProjectModal(idx);
    });
  });

  if (btnOpenContact) {
    btnOpenContact.addEventListener('click', () => {
      if (contactModal) {
        contactModal.classList.add('is-open');
        contactModal.setAttribute('aria-hidden', 'false');
      }
    });
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModals);
  if (modalActionBtn) modalActionBtn.addEventListener('click', closeModals);
  if (contactCloseBtn) contactCloseBtn.addEventListener('click', closeModals);

  [projectModal, contactModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModals();
      });
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModals();
  });

  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('scroll', updateScrollTarget, { passive: true });

  // Initialize
  resizeCanvas();
  updateScrollTarget();
  preloadImages();
  updateSectionsAndLayers(0);
  initCardTilt(serviceCards);
  initCardTilt(projectCards);
  requestAnimationFrame(animationLoop);
})();
