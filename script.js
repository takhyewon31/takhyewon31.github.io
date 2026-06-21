// 1. 클릭 시 새로운 브라우저 팝업 창으로 project.html 열기
function openProjectPopup(project = 'black-rubber-shoes') {
    // 팝업 창의 크기 및 옵션 설정 (가로 1100px, 세로 750px 권장) - 가로로 긴 비율
    const popupOptions = "width=1100,height=750,scrollbars=yes,resizable=yes";
    window.open(`project.html?project=${encodeURIComponent(project)}`, "projectPopup", popupOptions);
}
// 1. 팝업 모달 오픈 펑션
function openModal(el) {
    const imgPath = el.getAttribute('data-img');
    const title = el.innerText;
    
    document.getElementById('modal-img').src = imgPath;
    
    // 이력서 내에 modal-title 엘리먼트가 있다면 제목도 매핑
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.innerText = title;
    
    document.getElementById('projectModal').style.display = 'flex';
}

// 2. 팝업 모달 닫기 펑션
function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
}

// 3. ✨ 마우스 오버 및 무브 실시간 미리보기 로직 ✨
document.addEventListener('DOMContentLoaded', () => {
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
        const autoSlide = setInterval(() => {
            let nextIdx = currentIndex + 1;
            if (nextIdx >= images.length) nextIdx = 0;
            updateSlider(nextIdx);
        }, 1000);
    });
});

// 7. URL의 project 값에 맞춰 사이드바 프로젝트 선택
document.addEventListener('DOMContentLoaded', () => {
    const projectKey = new URLSearchParams(window.location.search).get('project') || 'black-rubber-shoes';
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
        const projectKey = new URLSearchParams(window.location.search).get('project') || 'black-rubber-shoes';
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

            const activeTitleEl = requestedItem.querySelector('.work-title');
            if (activeTitleEl) {
                const activeTitleText = activeTitleEl.textContent.trim();
                document.title = activeTitleText;
                document.querySelectorAll('.dynamic-project-title').forEach(el => el.textContent = activeTitleText);
            }
        }
    });
});
