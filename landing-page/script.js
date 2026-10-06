/**
 * 베네피온 도난방지 슬링백 랜딩 페이지 스크립트
 * 기능:
 * 1. 쿠팡 파트너스 다이렉트 링크 아웃바운드 지원
 * 2. Before / After 이미지 대조 인터랙티브 슬라이더 (포인터 드래그 & 자동 시각 안내 모션)
 * 3. FAQ 아코디언 접근성 및 단일 오픈 모드
 * 4. 헤더 IntersectionObserver 스크롤 최적화
 * 5. 스크롤 넛지 및 내부 앵커 부드러운 스크롤
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 헤더 스크롤 효과 (강제 리플로우 완전 제거: IntersectionObserver 사용)
  const header = document.getElementById('site-header');
  const sentinel = document.getElementById('scroll-sentinel');

  if (header && sentinel && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // 센티넬이 뷰포트 상단을 벗어나면 스크롤된 상태로 전환
        if (!entry.isIntersecting) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0 });

    observer.observe(sentinel);
  } else if (header) {
    // 구형 환경 폴백: requestAnimationFrame을 통한 쓰로틀링 (동기 리플로우 방지)
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 20) {
            header.classList.add('is-scrolled');
          } else {
            header.classList.remove('is-scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // 2. CTA 버튼 클릭 처리 (쿠팡 파트너스 제휴 링크 연결)
  const ctaButtons = document.querySelectorAll('.cta-btn');

  ctaButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const location = btn.getAttribute('data-cta-location') || 'unknown';
      if (window.console && console.debug) {
        console.debug(`[CTA Clicked] Location: ${location}`);
      }
    });
  });

  // 3. Before / After 이미지 대조 비교 인터랙티브 슬라이더 모션
  const compareSlider = document.getElementById('compare-slider');
  const compareHandle = document.getElementById('compare-handle');

  if (compareSlider && compareHandle) {
    let isDragging = false;
    let autoMotionCancelled = false;
    let currentPos = 50;

    function setSliderPosition(percentage, smooth = false) {
      const clamped = Math.max(3, Math.min(97, percentage));
      currentPos = clamped;

      if (smooth) {
        compareSlider.style.transition = '--slider-pos 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        compareHandle.style.transition = 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      } else {
        compareSlider.style.transition = 'none';
        compareHandle.style.transition = 'none';
      }

      compareSlider.style.setProperty('--slider-pos', `${clamped}%`);
      compareHandle.setAttribute('aria-valuenow', Math.round(clamped));
    }

    function updateFromPointer(clientX) {
      const rect = compareSlider.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage, false);
    }

    function onPointerDown(e) {
      autoMotionCancelled = true;
      isDragging = true;
      compareHandle.classList.add('is-dragging');
      compareSlider.classList.add('is-dragging');
      try {
        compareHandle.setPointerCapture(e.pointerId);
      } catch (err) {
        // Fallback for older browsers
      }
      updateFromPointer(e.clientX);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      updateFromPointer(e.clientX);
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      compareHandle.classList.remove('is-dragging');
      compareSlider.classList.remove('is-dragging');
      try {
        if (compareHandle.hasPointerCapture(e.pointerId)) {
          compareHandle.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    }

    // 포인터 이벤트 등록 (마우스 & 터치 통합 지원)
    compareHandle.addEventListener('pointerdown', onPointerDown);
    compareSlider.addEventListener('pointerdown', (e) => {
      if (e.target !== compareHandle && !compareHandle.contains(e.target)) {
        onPointerDown(e);
      }
    });

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 키보드 접근성 지원
    compareHandle.addEventListener('keydown', (e) => {
      autoMotionCancelled = true;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSliderPosition(currentPos - 5, true);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSliderPosition(currentPos + 5, true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setSliderPosition(5, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        setSliderPosition(95, true);
      }
    });

    // 뷰포트 진입 시 인터랙션 안내 모션 애니메이션 (50% -> 35% -> 65% -> 50%)
    if ('IntersectionObserver' in window) {
      let motionPlayed = false;
      const compareObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !motionPlayed && !autoMotionCancelled) {
            motionPlayed = true;
            playDemoMotion();
          }
        });
      }, { threshold: 0.35 });

      compareObserver.observe(compareSlider);

      function playDemoMotion() {
        const keyframes = [
          { pos: 50, duration: 250 },
          { pos: 35, duration: 650 },
          { pos: 65, duration: 800 },
          { pos: 50, duration: 650 }
        ];

        let index = 0;
        function runNext() {
          if (autoMotionCancelled || index >= keyframes.length) {
            if (!autoMotionCancelled) setSliderPosition(50, true);
            return;
          }
          const { pos, duration } = keyframes[index++];
          setSliderPosition(pos, true);
          setTimeout(runNext, duration);
        }

        setTimeout(runNext, 400);
      }
    }
  }

  // 4. 히어로 스크롤 넛지 동작 (#fit-check으로 부드럽게 스크롤 & 제목 포커스)
  const scrollNudge = document.getElementById('scroll-nudge');
  const fitSection = document.getElementById('fit-check');

  if (scrollNudge && fitSection) {
    scrollNudge.addEventListener('click', (e) => {
      e.preventDefault();
      fitSection.scrollIntoView({ behavior: 'smooth' });
      // 스크롤 후 섹션에 포커스 주어 키보드 탐색 지원
      setTimeout(() => {
        fitSection.focus();
      }, 500);
    });
  }

  // 4. FAQ 아코디언 동작
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    const panel = item.querySelector('.faq-panel');

    if (!trigger || !panel) return;

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      // 모바일이거나 단일 모드일 때 다른 아코디언 닫기
      if (isMobile && !isExpanded) {
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            const otherTrigger = otherItem.querySelector('.faq-trigger');
            const otherPanel = otherItem.querySelector('.faq-panel');
            if (otherTrigger && otherPanel) {
              otherTrigger.setAttribute('aria-expanded', 'false');
              otherPanel.setAttribute('hidden', '');
              otherItem.classList.remove('is-open');
            }
          }
        });
      }

      // 현재 아코디언 토글
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
        item.classList.remove('is-open');
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
        item.classList.add('is-open');
      }
    });
  });

  // 5. 이미지 에러 시 '이미지 준비 중' 대체 처리
  const allImages = document.querySelectorAll('img');
  allImages.forEach((img) => {
    img.addEventListener('error', function () {
      const altText = this.getAttribute('alt') || '제품 이미지';
      const placeholder = document.createElement('div');
      placeholder.className = 'image-fallback-placeholder';
      placeholder.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background-color: #f1f5f9;
        border: 2px dashed #cbd5e1;
        border-radius: 16px;
        padding: 32px;
        min-height: 220px;
        color: #64748b;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
      `;
      placeholder.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="opacity:0.6;">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>이미지 준비 중</span>
        <span style="font-size: 12px; color: #94a3b8; font-weight: normal;">${altText}</span>
      `;
      if (this.parentNode) {
        this.parentNode.replaceChild(placeholder, this);
      }
    });
  });

  // 6. 맨 위로 가기 부드러운 스크롤
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
