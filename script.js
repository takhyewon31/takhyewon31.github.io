// 1. 클릭 시 새로운 브라우저 팝업 창 대신, iframe 모달로 project.html 열기 (전체 화면 전환 방지)
function openProjectPopup(project = 'playhouse') {
    const iframe = document.getElementById('projectModalIframe');
    const overlay = document.getElementById('projectModalOverlay');
    
    if (iframe && overlay) {
        iframe.src = `project.html?project=${encodeURIComponent(project)}&t=${Date.now()}`;
        overlay.style.display = 'flex';
        // 강제 reflow 유도하여 transition 애니메이션 적용
        overlay.offsetHeight; 
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // 부모 스크롤 방지
    } else {
        // Fallback: 엘리먼트가 없으면 기존처럼 window.open으로 열기
        const popupOptions = "width=1100,height=750,scrollbars=yes,resizable=yes";
        window.open(`project.html?project=${encodeURIComponent(project)}`, "projectPopup", popupOptions);
    }
}

function closeProjectModal() {
    const overlay = document.getElementById('projectModalOverlay');
    const iframe = document.getElementById('projectModalIframe');
    
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (!overlay.classList.contains('active')) {
                overlay.style.display = 'none';
                if (iframe) iframe.src = ''; // 리소스 정리
            }
        }, 300);
        document.body.style.overflow = ''; // 부모 스크롤 복원
    }
}

// 2. 팝업 이미지 줌 모달 오픈 펑션
function openModal(el) {
    const imgPath = el.getAttribute('data-img');
    const title = el.innerText;
    
    document.getElementById('modal-img').src = imgPath;
    
    // 이력서 내에 modal-title 엘리먼트가 있다면 제목도 매핑
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.innerText = title;
    
    document.getElementById('projectModal').style.display = 'flex';
}

// 3. 팝업 이미지 줌 모달 닫기 펑션
function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
}

// 3. ✨ 마우스 오버 및 무브 실시간 미리보기 로직 ✨
document.addEventListener('DOMContentLoaded', () => {
    // iframe 내부 렌더링 감지하여 클래스 추가
    if (window.self !== window.top) {
        document.body.classList.add('in-iframe');
    }

    const hoverPreview = document.getElementById('hover-preview');
    
    // 만약 HTML에 hover-preview 엘리먼트가 없다면 동적으로 생성
    if (!hoverPreview) {
        const previewDiv = document.createElement('div');
        previewDiv.id = 'hover-preview';
        const previewImg = document.createElement('img');
        previewDiv.appendChild(previewImg);
        document.body.appendChild(previewDiv);
    }

    // .sub-project 클래스를 가진 모든 요소에 이벤트 바인딩
    document.querySelectorAll('.sub-project').forEach(el => {
        
        // 마우스가 텍스트 위에서 움직일 때
        el.addEventListener('mousemove', (e) => {
            const imgPath = el.getAttribute('data-img');
            const targetPreview = document.getElementById('hover-preview');
            
            if (targetPreview && imgPath) {
                targetPreview.style.display = 'block';
                const img = targetPreview.querySelector('img');
                if (img) {
                    const currentSrc = img.getAttribute('src');
                    if (currentSrc !== imgPath) {
                        img.setAttribute('src', imgPath);
                    }
                }
                
                // 마우스 커서 옆에 살짝 여백(15px)을 두고 따라다니도록 좌표 설정
                targetPreview.style.left = (e.clientX + 15) + 'px';
                targetPreview.style.top = (e.clientY + 15) + 'px';
            }
        });

        // 마우스가 텍스트를 벗어났을 때 숨기기
        el.addEventListener('mouseleave', () => {
            const targetPreview = document.getElementById('hover-preview');
            if (targetPreview) {
                targetPreview.style.display = 'none';
            }
        });
    });
});

// 4. 웹 배너 detail 이미지 자동 이동
document.addEventListener('DOMContentLoaded', () => {
    const detailColumns = document.querySelectorAll('.detail-column');

    detailColumns.forEach((column) => {
        const img = column.querySelector('img');
        if (!img) return;

        let rafId = null;
        let start = null;
        let fromY = 0;
        let toY = 0;
        const cycleMs = 18000;

        const setTransform = (value) => {
            img.style.transform = `translateY(${value}px)`;
        };

        const recalcRange = () => {
            const renderedHeight = img.getBoundingClientRect().height;
            const maxOffset = Math.max(0, renderedHeight - column.clientHeight);
            fromY = 0;
            toY = -maxOffset;
            if (maxOffset === 0) {
                setTransform(0);
                return false;
            }
            return true;
        };

        const tick = (ts) => {
            if (!start) start = ts;
            recalcRange();

            const elapsed = (ts - start) % (cycleMs * 2);
            const progress = elapsed / cycleMs;
            const direction = progress <= 1 ? progress : 2 - progress;
            const eased = direction < 0.5
                ? 4 * direction * direction * direction
                : 1 - Math.pow(-2 * direction + 2, 3) / 2;
            const currentY = fromY + (toY - fromY) * eased;
            setTransform(currentY);

            rafId = requestAnimationFrame(tick);
        };

        const startAnimation = () => {
            if (rafId) cancelAnimationFrame(rafId);
            start = null;
            rafId = requestAnimationFrame(() => {
                if (!recalcRange()) return;
                rafId = requestAnimationFrame(tick);
            });
        };

        img.addEventListener('load', startAnimation, { once: true });
        if (img.complete) startAnimation();

        window.addEventListener('resize', startAnimation);
    });
});

// 4. 스크롤 애니메이션 옵저버 (이미지가 화면에 나타날 때 부드럽게 표시)
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null, // 뷰포트를 기준으로 함
        rootMargin: '0px',
        threshold: 0.15 // 이미지가 15% 보일 때 실행
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // 한 번 애니메이션 후 해제
            }
        });
    }, observerOptions);

    const animImages = document.querySelectorAll('.scroll-anim');
    animImages.forEach(img => {
        imageObserver.observe(img);
    });
});

// 5. 사이드바 드로어 토글 로직
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('projectSidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar && toggleBtn && overlay) {
        // 트리거 바 클릭 시 사이드바 토글 (열기/닫기)
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 이벤트 버블링 차단
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });

        // 사이드바 내부 클릭 시 오버레이 클릭 이벤트가 전파되는 것을 차단
        sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 오버레이 클릭 시 사이드바 닫기
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
});

// 6. 포토 슬라이더 제어 로직
document.addEventListener('DOMContentLoaded', () => {
    const sliderContainers = document.querySelectorAll('.photo-slider-container');
    
    sliderContainers.forEach(container => {
        const images = container.querySelectorAll('.slider-image');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');
        const currentIdxEl = container.querySelector('.current-index');
        const totalIdxEl = container.querySelector('.total-slides');
        
        if (images.length === 0) return;
        
        let currentIndex = 0;
        
        // 총 슬라이드 수 설정
        if (totalIdxEl) {
            totalIdxEl.textContent = images.length;
        }
        
        function updateSlider(index) {
            images.forEach((img, i) => {
                if (i === index) {
                    img.classList.add('active');
                } else {
                    img.classList.remove('active');
                }
            });
            
            currentIndex = index;
            
            if (currentIdxEl) {
                currentIdxEl.textContent = currentIndex + 1;
            }
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                let nextIdx = currentIndex - 1;
                if (nextIdx < 0) {
                    nextIdx = images.length - 1;
                }
                updateSlider(nextIdx);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                let nextIdx = currentIndex + 1;
                if (nextIdx >= images.length) {
                    nextIdx = 0;
                }
                updateSlider(nextIdx);
            });
        }
        
        // 초기화
        updateSlider(0);
        if (container.dataset.autoplay !== 'false') {
            const interval = parseInt(container.dataset.autoplayInterval, 10) || 1000;
            setInterval(() => {
                let nextIdx = currentIndex + 1;
                if (nextIdx >= images.length) nextIdx = 0;
                updateSlider(nextIdx);
            }, interval);
        }
    });

    // 메인(왼쪽) 이미지 섹션 자동 전환 (보이는 프로젝트 하나에 대해서만 동작)
    (function setupMainImageAutoRotate() {
        let mainInterval = null;

        function clearMainInterval() {
            if (mainInterval) {
                clearInterval(mainInterval);
                mainInterval = null;
            }
        }

        function startForVisibleProject() {
            clearMainInterval();
            const visibleContent = document.querySelector('[data-project-content]:not([hidden])');
            if (!visibleContent) return;
            const container = visibleContent.querySelector('.image-section');
            if (!container) return;

            // If the image section uses a photo slider, let the photo slider script handle autoplay
            if (container.querySelector('.photo-slider')) {
                return;
            }

            const imgs = Array.from(container.querySelectorAll('img'));
            if (imgs.length <= 1) return;

            // 초기 상태: 첫 이미지만 보이게
            imgs.forEach((img, i) => {
                img.classList.toggle('visible', i === 0);
            });

            let idx = 0;
            mainInterval = setInterval(() => {
                imgs[idx].classList.remove('visible');
                idx = (idx + 1) % imgs.length;
                imgs[idx].classList.add('visible');
            }, 1000);
        }

        // 초기 실행 (페이지 로드 시 현재 보이는 프로젝트에 대해)
        setTimeout(startForVisibleProject, 100);

        // 프로젝트 전환 시 인터벌 재설정 (사이드바 클릭 및 popstate에서 모두 적용됨)
        document.querySelectorAll('.work-item[data-project]').forEach(item => {
            item.addEventListener('click', () => {
                // 약간의 지연을 두어 DOM이 업데이트된 후 실행
                setTimeout(startForVisibleProject, 60);
            });
        });

        window.addEventListener('popstate', () => {
            setTimeout(startForVisibleProject, 60);
        });
    })();
});

// 7. URL의 project 값에 맞춰 사이드바 프로젝트 선택
document.addEventListener('DOMContentLoaded', () => {
    const projectKey = new URLSearchParams(window.location.search).get('project') || 'playhouse';
    const mainViewer = document.querySelector('.main-viewer');
    const resetProjectScroll = () => {
        if (mainViewer) mainViewer.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };
    const requestedItem = Array.from(document.querySelectorAll('.work-item[data-project]'))
        .find(item => item.dataset.project === projectKey);
    const requestedContent = Array.from(document.querySelectorAll('[data-project-content]'))
        .find(content => content.dataset.projectContent === projectKey);

    if (requestedItem && requestedContent) {
        document.querySelectorAll('.work-item').forEach(item => item.classList.remove('active'));
        requestedItem.classList.add('active');
        document.querySelectorAll('[data-project-content]').forEach(content => {
            content.hidden = content !== requestedContent;
        });
        resetProjectScroll();
    }

    const activeTitleEl = document.querySelector('.work-item.active .work-title');
    if (activeTitleEl) {
        const activeTitleText = activeTitleEl.textContent.trim();
        document.title = activeTitleText;
        document.querySelectorAll('.dynamic-project-title').forEach(el => {
            el.textContent = activeTitleText;
        });
    }

    document.querySelectorAll('.work-item[data-project]').forEach(item => {
        item.addEventListener('click', () => {
            const projectKey = item.dataset.project;

            // URL을 업데이트하되 페이지를 리로드하지 않음
            try {
                const url = new URL(window.location.href);
                url.searchParams.set('project', projectKey);
                history.pushState({}, '', url.toString());
            } catch (e) {
                // URL 생성에 실패하면 fallback으로 location.search만 교체
                const sep = window.location.href.indexOf('?') === -1 ? '?' : '&';
                window.history.pushState({}, '', window.location.href + sep + 'project=' + encodeURIComponent(projectKey));
            }

            // 사이드바의 active 상태 및 메인 뷰어 전환
            document.querySelectorAll('.work-item').forEach(it => it.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('[data-project-content]').forEach(content => {
                content.hidden = (content.dataset.projectContent !== projectKey);
            });
            resetProjectScroll();

            const activeTitleEl = item.querySelector('.work-title');
            if (activeTitleEl) {
                const activeTitleText = activeTitleEl.textContent.trim();
                document.title = activeTitleText;
                document.querySelectorAll('.dynamic-project-title').forEach(el => {
                    el.textContent = activeTitleText;
                });
            }
        });
    });

    // 브라우저 뒤로/앞으로 버튼으로 이동할 때도 URL의 project 파라미터에 맞춰 뷰를 업데이트
    window.addEventListener('popstate', () => {
        const projectKey = new URLSearchParams(window.location.search).get('project') || 'playhouse';
        const requestedItem = Array.from(document.querySelectorAll('.work-item[data-project]'))
            .find(item => item.dataset.project === projectKey);
        const requestedContent = Array.from(document.querySelectorAll('[data-project-content]'))
            .find(content => content.dataset.projectContent === projectKey);

        if (requestedItem && requestedContent) {
            document.querySelectorAll('.work-item').forEach(item => item.classList.remove('active'));
            requestedItem.classList.add('active');
            document.querySelectorAll('[data-project-content]').forEach(content => {
                content.hidden = (content !== requestedContent);
            });
            resetProjectScroll();

            const activeTitleEl = requestedItem.querySelector('.work-title');
            if (activeTitleEl) {
                const activeTitleText = activeTitleEl.textContent.trim();
                document.title = activeTitleText;
                document.querySelectorAll('.dynamic-project-title').forEach(el => el.textContent = activeTitleText);
            }
        }
    });
});

// 8. 프로젝트 창 닫기/돌아가기 기능
function closeProjectWindow() {
    if (window.parent && window.parent !== window) {
        if (typeof window.parent.closeProjectModal === 'function') {
            window.parent.closeProjectModal();
        } else {
            window.parent.location.reload();
        }
    } else if (window.opener) {
        window.close();
    } else {
        window.location.href = 'index.html';
    }
}

// 9. 사이드바 프로젝트/인디펜던트 스터디 탭 전환 기능
function switchSidebarTab(tabName) {
    const projectList = document.getElementById('list-project');
    const studyList = document.getElementById('list-independent-study');
    const tabs = document.querySelectorAll('.sidebar-tab');
    
    if (tabName === 'PROJECT') {
        if (projectList) projectList.style.display = 'grid';
        if (studyList) studyList.style.display = 'none';
        tabs.forEach(tab => {
            if (tab.innerText === 'PROJECT') tab.classList.add('active');
            else tab.classList.remove('active');
        });
    } else if (tabName === 'INDEPENDENT_STUDY') {
        if (projectList) projectList.style.display = 'none';
        if (studyList) studyList.style.display = 'grid';
        tabs.forEach(tab => {
            if (tab.innerText === 'INDEPENDENT STUDY') tab.classList.add('active');
            else tab.classList.remove('active');
        });
    }
}
