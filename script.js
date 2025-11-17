let architectureData = null;
let currentScale = 1;
let posX = 0, posY = 0;
let startX = 0, startY = 0;
let isDragging = false;
async function loadArchitectureData() {
    try {
        const response = await fetch('project3.json');
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu');
        }
        architectureData = await response.json();
        renderArchitecture();
        renderUMLDiagrams();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        document.getElementById('layers').innerHTML =
            '<div class="error">Lỗi khi tải dữ liệu: ' + error.message + '</div>';
        document.getElementById('uml-content-container').innerHTML =
            '<div class="error">Lỗi khi tải dữ liệu: ' + error.message + '</div>';
    }
}

function renderArchitecture() {
    const container = document.getElementById('layers');

    if (!architectureData || !architectureData.layers) {
        container.innerHTML = '<div class="error">Dữ liệu không hợp lệ</div>';
        return;
    }

    let layersHTML = '';
    architectureData.layers.forEach(layer => {
        let foldersHTML = '';
        layer.folders.forEach(folder => {
            let filesHTML = '';
            if (folder.files) {
                folder.files.forEach(file => {
                    filesHTML += `
                                <div class="file-item">
                                    <span class="file-icon">📄</span>
                                    <strong>${file.name}</strong>
                                    <div class="responsibility">${file.responsibility}</div>
                                </div>
                            `;
                });
            }

            foldersHTML += `
                        <div class="folder-item">
                            <div class="folder-header" onclick="toggleFolder(this)">
                                <span class="folder-icon">📁</span>
                                <h3>${folder.name}</h3>
                            </div>
                            <div class="folder-content">
                                <p><em>${folder.description}</em></p>
                                ${filesHTML}
                            </div>
                        </div>
                    `;
        });

        layersHTML += `
                    <div class="layer layer-${layer.type}">
                        <h2>${layer.name}</h2>
                        <p>${layer.description}</p>
                        ${foldersHTML}
                    </div>
                `;
    });

    container.innerHTML = layersHTML;
}

function renderUMLDiagrams() {
    const container = document.getElementById('uml-content-container');

    if (!architectureData || !architectureData.umlDiagrams) {
        container.innerHTML = '<div class="error">Dữ liệu UML không hợp lệ</div>';
        return;
    }

    const diagramTypes = ['activity', 'sequence', 'class', 'component','use case'];
    let umlHTML = '';

    diagramTypes.forEach(type => {
        const diagrams = architectureData.umlDiagrams[type] || [];
        let diagramsHTML = '';

        if (diagrams.length > 0) {
            diagrams.forEach((diagram, index) => {
                diagramsHTML += `
                    <div class="diagram-card" onclick="openLightbox('${diagram.imageUrl}', '${diagram.title}')">
                        <img src="${diagram.imageUrl}" alt="${diagram.title}" class="diagram-img" loading="lazy">
                        <div class="diagram-info">
                            <div class="diagram-title">${diagram.title}</div>
                            <div class="diagram-desc">${diagram.description}</div>
                        </div>
                    </div>
                `;
            });
        } else {
            const placeholderImage = 'https://4uy1w3gtlk.ucarecd.net/7bce693a-99d8-4dc4-a9ae-52bd07584f5a/';
            diagramsHTML = `
                <img src="${placeholderImage}" alt="Coming Soon" class="diagram-img" style="width:100%; height:auto;">
        `;
        }

        umlHTML += `
            <div class="uml-content ${type === 'activity' ? 'active' : ''}" id="${type}-content">
                <div class="uml-container">
                    <h2>${getUMLTitle(type)}</h2>
                    <p>${getUMLSubtitle(type)}</p>
                    <div class="diagram-grid">
                        ${diagramsHTML}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = umlHTML;
    setupUMLTabs();
    setupLightbox(); // Khởi tạo lightbox
}


function getUMLTitle(type) {
    const titles = {
        activity: 'Activity Diagrams',
        sequence: 'Sequence Diagrams',
        class: 'Class Diagrams',
        component: 'Component Diagrams'
    };
    return titles[type] || 'UML Diagrams';
}

function getUMLSubtitle(type) {
    const subtitles = {
        activity: 'Mô tả luồng công việc và hoạt động trong hệ thống',
        sequence: 'Mô tả tương tác theo thời gian giữa các đối tượng',
        class: 'Mô tả cấu trúc tĩnh của hệ thống với các lớp và mối quan hệ',
        component: 'Mô tả cấu trúc vật lý và tổ chức của hệ thống'
    };
    return subtitles[type] || 'Mô tả hệ thống';
}

function toggleFolder(element) {
    const folderItem = element.parentElement;
    folderItem.classList.toggle('folder-expanded');
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));

            button.classList.add('active');
            const targetId = button.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function setupUMLTabs() {
    const umlTabs = document.querySelectorAll('.uml-tab');
    const umlContents = document.querySelectorAll('.uml-content');

    umlTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            umlTabs.forEach(t => t.classList.remove('active'));
            umlContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
}
function openLightbox(imageUrl, title) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const indicator = document.getElementById('zoom-indicator');

    img.src = imageUrl;
    document.title = title + " - Zoom View";
    lightbox.classList.add('active');

    currentScale = 1;
    posX = 0; posY = 0;
    updateTransform();
    indicator.textContent = '100%';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.title = "Clean Architecture Visualization";
}

function updateTransform() {
    const img = document.getElementById('lightbox-img');
    img.style.transform = `translateY(${posY}px) scale(${currentScale})`;

}
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const indicator = document.getElementById('zoom-indicator');

    document.getElementById('close-lightbox').onclick = closeLightbox;
    lightbox.onclick = (e) => {
        if (e.target === lightbox) closeLightbox();
    };

    document.getElementById('zoom-in').onclick = () => zoom(0.25);
    document.getElementById('zoom-out').onclick = () => zoom(-0.25);
    document.getElementById('reset-zoom').onclick = () => {
        currentScale = 1;
        posX = 0; posY = 0;
        updateTransform();
        indicator.textContent = '100%';
    };

    img.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        zoom(delta, e.clientX, e.clientY);
    };

    img.onmousedown = (e) => {
        if (currentScale <= 1) return;
        isDragging = true;
        startY = e.clientY;
        startPosY = posY;
        img.style.cursor = 'grabbing';
        e.preventDefault();
    };

    document.onmousemove = (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        posY = startPosY + deltaY;

        const img = document.getElementById('lightbox-img');
        const rect = img.getBoundingClientRect();
        const maxTop = 50;
        const maxBottom = window.innerHeight - 50;

        if (rect.top > maxTop) posY = startPosY + (maxTop - rect.top);
        if (rect.bottom < maxBottom) posY = startPosY + (maxBottom - rect.bottom);

        updateTransform();
    };

    document.onmouseup = () => {
        isDragging = false;
        img.style.cursor = currentScale > 1 ? 'grab' : 'default';
    };

    img.ondragstart = () => false;

    function zoom(delta) {
        const oldScale = currentScale;
        currentScale = Math.min(Math.max(currentScale + delta, 0.5), 5);

        if (oldScale !== currentScale) {
            const img = document.getElementById('lightbox-img');
            const rect = img.getBoundingClientRect();
            const viewportCenterY = window.innerHeight / 2;
            const imgCenterY = rect.top + rect.height / 2;

            const offsetY = viewportCenterY - imgCenterY;
            posY = posY * (currentScale / oldScale) + offsetY * (1 - currentScale / oldScale);
        }

        updateTransform();
        document.getElementById('zoom-indicator').textContent = Math.round(currentScale * 100) + '%';
    }
}

window.openLightbox = openLightbox;
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadArchitectureData();
});
