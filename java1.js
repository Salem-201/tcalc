// كود بسيط ونظيف للجوال - اختبار الزوم والتنقل الديناميكي
// Mobile Zoom & Dynamic Navigation Test

// متغيرات أساسية
let isLoading = false;
let currentPage = 'home';

// دالة كشف مستوى الزوم
function getZoomLevel() {
    if (window.visualViewport && window.visualViewport.scale) {
        return window.visualViewport.scale;
    }
    const screenWidth = window.screen.width;
    const windowWidth = window.innerWidth;
    const zoom = screenWidth / windowWidth;
    return zoom;
}

// دالة كشف إذا كان المستخدم في وضع زوم
function isZoomedIn() {
    const zoom = getZoomLevel();
    return zoom > 1.1;
}

// دالة إعادة تعيين الزوم
function resetZoom() {
    let viewport = document.querySelector("meta[name=viewport]");
    
    if (viewport) {
        viewport.remove();
    }

    viewport = document.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no";
    document.head.appendChild(viewport);

    document.documentElement.style.transform = "scale(1)";
    document.documentElement.style.transformOrigin = "top left";

    setTimeout(() => {
        viewport.content = "width=device-width, initial-scale=1, maximum-scale=5, minimum-scale=1, user-scalable=yes";
        document.head.appendChild(viewport);
        document.documentElement.style.transform = "";
    }, 200);
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// دالة التنقل الديناميكي (AJAX)
function dynamicLoad(url) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    
    // محاكاة طلب AJAX
    setTimeout(() => {
        updateContent(url);
        showLoading(false);
        isLoading = false;
        logEvent('تم التنقل الديناميكي إلى: ' + url);
    }, 1000);
}

// دالة التنقل الذكي
function smartNavigation(url) {
    if (isZoomedIn()) {
        logEvent('تم كشف الزوم - سيتم إعادة تحميل الصفحة');
        resetZoom();
        setTimeout(() => {
            window.location.href = url;
        }, 100);
    } else {
        logEvent('الزوم طبيعي - سيتم التنقل الديناميكي');
        dynamicLoad(url);
    }
}

// دالة تحديث المحتوى
function updateContent(url) {
    const content = document.getElementById('content');
    if (!content) return;
    
    let newContent = '';
    
    switch(url) {
        case 'page1':
            newContent = 'PAGE 1 TEST';
            break;
        case 'page2':
            newContent = 'PAGE 2 TEST';
            break;
        case 'page3':
            newContent = 'PAGE 3 TEST';
            break;
        default:
            newContent ='HOME PAGE 💡 TEST';
    }
    
    content.innerHTML = newContent;
    currentPage = url;
}

// دالة إظهار/إخفاء التحميل
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// دالة تسجيل الأحداث
function logEvent(message) {
    const log = document.getElementById('log');
    if (!log) return;
    
    const time = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.innerHTML = `[${time}] ${message}`;
    log.appendChild(logEntry);
    log.scrollTop = log.scrollHeight;
}

// دالة تحديث معلومات الزوم
function updateZoomInfo() {
    const zoomLevel = document.getElementById('zoomLevel');
    const zoomStatus = document.getElementById('zoomStatus');
    
    if (zoomLevel) {
        const level = Math.round(getZoomLevel() * 100);
        zoomLevel.textContent = level + '%';
    }
    
    if (zoomStatus) {
        zoomStatus.textContent = isZoomedIn() ? 'مكبر' : 'طبيعي';
        zoomStatus.style.color = isZoomedIn() ? '#d32f2f' : '#388e3c';
    }
}

// تهيئة الصفحة
function init() {
    logEvent('تم تحميل الصفحة');
    updateZoomInfo();
    

    
    // تحديث معلومات الزوم كل ثانية
    setInterval(updateZoomInfo, 1000);
    
    // ربط الأحداث
    document.addEventListener('click', function(e) {
        if (e.target.matches('a[data-page]')) {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            logEvent('تم النقر على: ' + page);
            smartNavigation(page);
        }
    });
    
    // ربط النماذج
    document.addEventListener('submit', function(e) {
        console.log('تم إرسال نموذج:', e.target);
        if (e.target.matches('form[data-action]')) {
            e.preventDefault();
            const action = e.target.getAttribute('data-action');
            logEvent('تم إرسال النموذج: ' + action);
            
            if (isZoomedIn()) {
                logEvent('تم كشف الزوم في النموذج - سيتم إعادة تحميل الصفحة');
                resetZoom();
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            } else {
                logEvent('الزوم طبيعي في النموذج - سيتم التنقل الديناميكي');
                dynamicLoad(action);
            }
        } else {
            console.log('النموذج لا يحتوي على data-action');
        }
    });
}

// تشغيل التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);

