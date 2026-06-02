// 1. 클릭 시 새로운 브라우저 팝업 창으로 project.html 열기
function openProjectPopup() {
    // 팝업 창의 크기 및 옵션 설정 (가로 1100px, 세로 750px 권장) - 가로로 긴 비율
    const popupOptions = "width=1100,height=750,scrollbars=yes,resizable=yes";
    window.open("project.html", "projectPopup", popupOptions);
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
                targetPreview.style.backgroundImage = `url('${imgPath}')`;
                
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