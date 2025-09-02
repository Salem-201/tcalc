
let lastUpdateTime;
let gameTimer;
let autoRefreshTimer;
let isLoading = false;
let countdownElements = [];
let resourceElements = [];
let chatEnabled = false;
let backNavigation = 0;
let mreq = true;
let selectedPackageId = null;
let currentCounts = {};
let _previousGoldValue = null;

function getElementById(id) {
    return document.getElementById(id);
}

function _(id) {
	return document.getElementById(id);
}

function addClass(element, className) {
    if (element) element.classList.add(className);
}

function removeClass(element, className) {
    if (element) element.classList.remove(className);
}

function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function init(updateInterval = 1) {
    lastUpdateTime = new Date().getTime();

    document.addEventListener("mouseover", (e) => {
        if (e.target.matches("input[type='image'].dynamic_img")) {
            e.target.className = "dynamic_img over";
        }
    });
    document.addEventListener("mouseout", (e) => {
        if (e.target.matches("input[type='image'].dynamic_img")) {
            e.target.className = "dynamic_img";
        }
    });
    document.addEventListener("mousedown", (e) => {
        if (e.target.matches("input[type='image'].dynamic_img")) {
            e.target.className = "dynamic_img clicked";
        }
    });

    document.querySelectorAll("table.row_table_data").forEach(table => {
        table.addEventListener("mouseover", (e) => {
            if (e.target.matches("tbody tr")) {
                e.target.classList.add("hlight");
            }
        });
        table.addEventListener("mouseout", (e) => {
            if (e.target.matches("tbody tr")) {
                e.target.classList.remove("hlight");
            }
        });
        table.addEventListener("mousedown", (e) => {
            if (e.target.matches("tbody tr")) {
                e.target.classList.toggle("marked");
            }
        });
    });

    resourceElements = [];
    for (let i = 1; i < 5; i++) {
        const element = getElementById(`l${i}`);
        if (element) {
            const granary = getElementById("granary");
            const warehouse = getElementById("warehouse");
            resourceElements.push({
                element: element,
                rate: parseFloat(element.getAttribute("title") || '0'),
                currentValue: parseInt(element.innerHTML) || 0,
                initialValue: parseInt(element.innerHTML) || 0,
                max: element.id === 'l1' ? (granary ? parseInt(granary.innerHTML) || 0 : 0) : (warehouse ? parseInt(warehouse.innerHTML) || 0 : 0)
            });
        }
    }

    function toNumber(value) {
        const num = parseInt(value);
        return isNaN(num) ? 0 : num;
    }

    countdownElements = [];
    const spans = document.getElementsByTagName("span");
    for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        const id = span.getAttribute('id');
        if (id === "timer1" || id === "timer2") {
            const timeParts = span.innerHTML.split(':').reverse().map(toNumber);
            if (timeParts.length > 1) {
                const totalSeconds = timeParts[0] + (timeParts[1] || 0) * 60 + (timeParts[2] || 0) * 3600;
                countdownElements.push({
                    element: span,
                    seconds: totalSeconds,
                    factor: id === "timer1" ? -1 : 1
                });
            }
        }
    }

    window.clearInterval(gameTimer);
    render(updateInterval);

    $("input,textarea").click(function() {
        clearInterval(autoRefreshTimer);
        if ($(this).attr('S') !== 'S') {
            $(this).attr('S', 'S');
            $(this).select();
        }
    });

    let startX = 0, startY = 0, endX = 0, endY = 0, startTime = 0;
    const windowWidth = window.innerWidth;
    document.addEventListener("touchstart", (event) => {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        startTime = new Date().getTime();
    });
    document.addEventListener("touchend", (event) => {
        endX = event.changedTouches[0].clientX;
        endY = event.changedTouches[0].clientY;
        const timeElapsed = new Date().getTime() - startTime;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (startX < windowWidth / 2 && deltaX > 150 && timeElapsed < 600 && deltaY < 30) {
            $(".blackShadow").show();
            $("#side_info").css("display", "block");
        }
    });
}

let lastFrameTime = null;
let rafId = null;
let _isLoading = false;

function render(updateInterval = 1) {
    function update(timestamp) {
        if (_isLoading) return;
        if (!lastFrameTime || (timestamp - lastFrameTime) >= 1000) {
            const elapsedSeconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
            resourceElements.forEach(res => {
                const val = Math.floor(res.initialValue + elapsedSeconds/3600 * res.rate);
                res.currentValue = Math.min(val, res.max);
                res.element.innerHTML = res.currentValue;
            });
            let shouldReload = false;
            countdownElements.forEach(timer => {
                if (shouldReload) return;
                const timeLeft = timer.seconds + elapsedSeconds * timer.factor;
                if (timeLeft < 0) shouldReload = true;
                else {
                    const d = Math.max(timeLeft, 0);
                    const h = Math.floor(d/3600);
                    const m = String(Math.floor((d%3600)/60)).padStart(2,'0');
                    const s = String(Math.floor(d%60)).padStart(2,'0');
                    timer.element.innerHTML = `${h>0? h+':':''}${m}:${s}`;
                }
            });
            if (shouldReload) {
                _isLoading = true;
                clearInterval(gameTimer);
                cancelAnimationFrame(rafId);
                if (typeof quickLoad === "function") {
                    quickLoad(window.location.href);
                } else {
                    window.location.reload();
                }
                return;
            }
            lastFrameTime = timestamp;
        }
        rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
}


function setLang(langCode) {
    document.cookie = `lng=${langCode}; expires=Wed, 1 Jan 2250 00:00:00 GMT`;
}

function toggleLevels() {
    const switchElement = getElementById("lswitch");
    const levelsElement = getElementById("levels");
    const isOn = switchElement.className === 'on';
    switchElement.className = levelsElement.className = isOn ? '' : 'on';
    document.cookie = `${isOn ? "lvl=0" : "lvl=1"}; expires=Wed, 1 Jan 2250 00:00:00 GMT`;
}

function hideManual() {
    const manual = getElementById('ce');
    if (manual) manual.innerHTML = '';
    return false;
}


function showInfo(a, b) {
    if (typeof _mp === "undefined" || !_mp.mtx || !_mp.mtx[a] || !_mp.mtx[a][b]) {
        return;
    }
    if (typeof textb === "undefined" || !textb.t1 || !textb.t2 || !textb.t3 || !textb.t4 || !textb.f) {
        return;
    }

    const c = _mp.mtx[a][b];
    const d = c[5];
    const e = c[6];

    const mapInfobox = _("map_infobox");
    const mbx1 = _("mbx_1");
    const mbx11 = _("mbx_11");
    const mbx12 = _("mbx_12");
    const mbx13 = _("mbx_13");

    if (mapInfobox) {
        mapInfobox.setAttribute("class", d ? "village" : "oasis_empty");
    }

    if (mbx11) mbx11.innerHTML = "-";
    if (mbx12) mbx12.innerHTML = "-";
    if (mbx13) mbx13.innerHTML = "-";

    if (mbx1) {
        if (d) {
            mbx1.innerHTML = e ? textb.t3 : `<span class="tribe tribe${c[7]}">${c[10]}</span>`;
            if (mbx11) mbx11.innerHTML = c[9];
            if (mbx12) mbx12.innerHTML = e ? "-" : c[8];
            if (mbx13) mbx13.innerHTML = c[11] !== "" ? c[11] : "-";
        } else {
            mbx1.innerHTML = e ? textb.t4 : `${textb.t2} ${textb.f[c[7]]}`;
        }
    }
}

function hideInfo() {
    if (typeof textb === "undefined" || !textb.t1) {
        return;
    }

    const mapInfobox = _("map_infobox");
    const mbx1 = _("mbx_1");
    const mbx11 = _("mbx_11");
    const mbx12 = _("mbx_12");
    const mbx13 = _("mbx_13");

    if (mapInfobox) {
        mapInfobox.setAttribute("class", "default");
    }

    if (mbx1) {
        mbx1.innerHTML = textb.t1;
    }

    if (mbx11) mbx11.innerHTML = "-";
    if (mbx12) mbx12.innerHTML = "-";
    if (mbx13) mbx13.innerHTML = "-";
}

function slm () {
var url = "karte?l&id=" + _mp["mtx"][3][3][0];
window.location = url;
return false;
}

function createRequestObject() {
    let xhr = null;
    try {
        xhr = new XMLHttpRequest();
    } catch (e) {
        try {
            xhr = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }
    }
    return xhr;
}

function renderMap(a, b) {
    if (!mreq) return !1;
    var c = createRequestObject(),
        d = "karte?id=" + a.getAttribute("vid") + (b ? "&l" : "");
    if (c == null) return window.location = d, mreq = !0, !1;
    mreq = !1;
    d += "&_a1_";
    c.onreadystatechange = function () {
        if (c.readyState == 4 || c.readyState == "complete") if (mreq = !0, c.responseText.length > 0) {
            eval(c.responseText);
            _("x").innerHTML = _mp.x;
            _("y").innerHTML = _mp.y;
            _("mcx").setAttribute("value", _mp.x);
            _("mcy").setAttribute("value", _mp.y);
            _("ma_n1").setAttribute("vid", _mp.n1);
            _("ma_n2").setAttribute("vid", _mp.n2);
            _("ma_n3").setAttribute("vid", _mp.n3);
            _("ma_n4").setAttribute("vid", _mp.n4);
            _("ma_n1p7").setAttribute("vid", _mp.n1p7);
            _("ma_n2p7").setAttribute("vid", _mp.n2p7);
            _("ma_n3p7").setAttribute("vid", _mp.n3p7);
            _("ma_n4p7").setAttribute("vid", _mp.n4p7);
            for (var a = 0, d = _mp.mtx.length; a < d; a++) for (var b = _mp.mtx[a], g = 0, k = b.length; g < k; g++) {
                var h = b[g];
                _("i_" + a + "_" + g).setAttribute("class", h[3]);
                var j = _("a_" + a + "_" + g);
                j.setAttribute("title", h[4]);
                j.setAttribute("href", "dorf3?id=" + h[0]);
                if (a == 0) _("my" + g).innerHTML = h[2];
                if (g == 0) _("mx" + a).innerHTML = h[1]
            }
        }
    };
    c.open("GET", d, !0);
    c.send(null);
    return !1
}

function switchLanguageMode() {
    let url = window.location.href;
    url += url.includes('?') ? '&l' : '?l';
    window.location = url;
    return false;
}

function initBottomMenu() {
    const menu = getElementById("bottom-menu");
    $("[bottom]:not(div#get [bottom])").click(function(event) {
        event.preventDefault();
        $("#Bottom-content").html('');
        const isActive = $("#bottom-menu").hasClass("active");
        menu.classList.toggle("active");
        if (!isActive) {
            fetch($(this).attr("to"))
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");
                    getElementById("Bottom-content").innerHTML = doc.querySelector("div#content").innerHTML;
                    //refreshBottomMenu();
                })
                .catch(error => console.error("Error loading content:", error));
        }
    });
    getElementById("close-menu").addEventListener("click", () => menu.classList.remove("active"));
}

document.addEventListener("DOMContentLoaded", function () {
  // ==== Bottom Menu Click Handler ====
    document.body.addEventListener("click", function (event) {
        let link = event.target.closest("a[bottom]");
        if (!link) return;
        event.preventDefault();

        let href = link.getAttribute("to");
        if (!href) {
            //console.error("Missing 'to' attribute:", link);
            return;
        }
        let bottomMenu = document.getElementById("bottom-menu");
        let bottomContent = document.getElementById("Bottom-content");
        if (!bottomMenu || !bottomContent) {
            //console.error("Required elements missing");
            return;
        }

        fetch(href)
            .then(response => response.text())
            .then(html => {
                bottomContent.innerHTML = html;
                bottomMenu.classList.add("active");
                bottomMenu.style.bottom = "0";
            })
            .catch(error => {
                //console.error("Error loading content:", error);
                bottomContent.innerHTML = "<p>Failed to load content.</p>";
            });
    });

    // Handle clicks inside dynamically loaded #Bottom-content
    const bottomContent = document.getElementById("Bottom-content");
    if (bottomContent) {
        bottomContent.addEventListener("click", function (event) {
            let innerLink = event.target.closest("a");
            if (!innerLink || innerLink.getAttribute("href") === "#") return;
            event.preventDefault();

            let newHref = innerLink.getAttribute("href");
            if (!newHref) return;

            fetch(newHref)
                .then(response => response.text())
                .then(newHtml => {
                    this.innerHTML = newHtml; // Update only #Bottom-content
                })
                .catch(error => {
                    console.error("Error loading new content:", error);
                    this.innerHTML = "<p>Failed to load new content.</p>";
                });
        });
    }

    // Close menu button
    let closeMenu = document.getElementById("close-menu");
    if (closeMenu) {
        closeMenu.addEventListener("click", function () {
            let bottomMenu = document.getElementById("bottom-menu");
            if (bottomMenu) {
                bottomMenu.style.bottom = "-100%";
                bottomMenu.classList.remove("active");
            }
        });
    }

    // ==== Custom Tooltip Handler (Desktop Only) ====
    
    // Check if screen width is typical desktop/laptop
    if (window.innerWidth >= 1024) {  // adjust breakpoint if needed
      const tooltipBox = document.createElement('div');
      tooltipBox.className = 'tooltip-title';
      document.body.appendChild(tooltipBox);
    
      let currentEl = null;
    
      function showTooltip(el, x = null, y = null) {
        const titleText = el.getAttribute('title');
        if (!titleText) return;
    
        el.setAttribute('data-original-title', titleText);
        el.removeAttribute('title');
    
        tooltipBox.textContent = titleText;
        tooltipBox.style.opacity = '1';
    
        if (x !== null && y !== null) {
          tooltipBox.style.left = x + 12 + 'px';
          tooltipBox.style.top = y + 12 + 'px';
        }
    
        currentEl = el;
      }
    
      function hideTooltip() {
        if (currentEl) {
          const originalTitle = currentEl.getAttribute('data-original-title');
          if (originalTitle) {
            currentEl.setAttribute('title', originalTitle);
            currentEl.removeAttribute('data-original-title');
          }
          tooltipBox.style.opacity = '0';
          currentEl = null;
        }
      }
    
      // ===== Pointer events (desktop only) =====
      document.body.addEventListener('pointerover', e => {
        const el = e.target.closest('[title]');
        if (!el) return;
        if (currentEl && currentEl !== el) hideTooltip();
        if (!currentEl) showTooltip(el, e.pageX, e.pageY);
      });
    
      document.body.addEventListener('pointermove', e => {
        if (currentEl) {
          tooltipBox.style.left = e.pageX + 12 + 'px';
          tooltipBox.style.top = e.pageY + 12 + 'px';
        }
      });
    
      document.body.addEventListener('pointerout', e => {
        if (currentEl && !currentEl.contains(e.relatedTarget)) hideTooltip();
      });
    
      // ===== Reset after AJAX load =====
      if (window.jQuery) {
        $(document).ajaxComplete(() => hideTooltip());
      }
    
      // ===== Safety: MutationObserver only if necessary =====
      const observer = new MutationObserver(() => {
        if (currentEl && !document.body.contains(currentEl)) hideTooltip();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    
      // Optional manual hide
      window.hideCustomTooltip = hideTooltip;
    }

});


function refreshBottomMenu() {
    const menu = getElementById("bottom-menu");
    document.querySelectorAll("div#bottom-menu [bottom], div#bottom-menu [bottomref]").forEach(link => {
        link.addEventListener("click", function(event) {
            event.preventDefault();
            fetch(this.getAttribute("href"))
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");
                    getElementById("Bottom-content").innerHTML = doc.querySelector("#content").innerHTML;
                    refreshBottomMenu();
                })
                .catch(error => console.error("Error loading content:", error));
        });
    });
    getElementById("close-menu").addEventListener("click", () => menu.classList.remove("active"));
}

function clearDynamicScripts() {
    ["dynamic-script-container", "dynamic-script-top-container"].forEach(id => {
        const container = getElementById(id);
        if (container) {
            $(container).off();
            container.parentNode.removeChild(container);
        }
    });
}

function processScript(scriptElement) {
    return new Promise(resolve => {
        if (scriptElement.hasAttribute("processed")) {
            resolve();
            return;
        }

        const newScript = document.createElement("script");
        if (scriptElement.src) {
            if (document.querySelector(`script[src="${scriptElement.src}"]`)) {
                resolve();
                return;
            }
            newScript.src = scriptElement.src;
            if (scriptElement.type) newScript.type = scriptElement.type;
            newScript.async = scriptElement.async;
            newScript.defer = scriptElement.defer;
            newScript.onload = resolve;
            newScript.onerror = resolve;
        } else {
            const wrappedContent = `(function() { ${scriptElement.textContent} })();`;
            newScript.textContent = wrappedContent;
            resolve();
        }

        scriptElement.setAttribute("processed", "true");
        $(scriptElement).off();
        scriptElement.remove();

        const containerId = scriptElement.hasAttribute("start") 
            ? "dynamic-script-top-container" 
            : "dynamic-script-container";

        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            if (containerId === "dynamic-script-top-container") {
                document.body.insertBefore(container, document.body.firstChild);
            } else {
                document.body.appendChild(container);
            }
        }

        container.appendChild(newScript);
    });
}


function updateSectionWithCleanup(selector, content) {
    const section = document.querySelector(selector);
    if (!section) return;

    if (window.jQuery) $(selector).find('*').off();
    while (section.firstChild) section.removeChild(section.firstChild);

    if (typeof content === "string") {
        section.innerHTML = content;
    } else if (content && content.innerHTML) {
        section.innerHTML = content.innerHTML;
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(async () => {
            const scripts = Array.from(section.querySelectorAll("script"));
            for (const script of scripts) {
                await processScript(script);
            }
        });
    });
}


function parseGold(txt) {
    return Number((txt || '').replace(/[^\d]/g, '')) || 0;
}

function animateGold(oldValue, newValue, duration = 800, goldElem) {
    if (!goldElem || oldValue === newValue) return;

    const start = oldValue;
    const end = newValue;
    const range = end - start;
    const startTime = performance.now();

    function step(t) {
        const elapsed = t - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const val = Math.floor(start + range * progress);
        goldElem.textContent = val.toLocaleString('en-US');
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function handleGoldAnimation(oldValues, newGold) {
    if (newGold == null) return;

    requestAnimationFrame(() => {
        const spans = document.querySelectorAll('span.gold-number');
        spans.forEach((el, i) => {
            const old = oldValues[i] != null ? oldValues[i] : oldValues[0];
            if (old != null && old !== newGold) {
                el.textContent = old.toLocaleString('en-US');
                animateGold(old, newGold, 800, el);
            }
        });
    });
}

function quickLoad(url) {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let currentRequest = null;
    let autoRefreshTimer = null;

    function clearPreviousTasks() {
        if (typeof med_closeDescription === "function") med_closeDescription();
        if (chatEnabled) {
            clearInterval(Chating);
            Chating = null;
            chatEnabled = false;
        }
        if (typeof DoS !== "undefined") clearTimeout(DoS);
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    }

    function loadContent(href) {
        return new Promise((resolve, reject) => {
            function handleAjaxResponse(response) {
                
                clearDynamicScripts();
                Ll = href;
                const parser = new DOMParser();
                const doc = parser.parseFromString(response, "text/html");
                const resDiv = doc.querySelector("div#res");
                
                const oldSpans = document.querySelectorAll('span.gold-number');
                const oldValues = Array.from(oldSpans).map(el => parseGold(el.textContent));
                const newGoldEl = doc.querySelector('span.gold-number');
                const newGold = newGoldEl ? parseGold(newGoldEl.textContent) : null;
            
                updateSections(doc);
                if (resDiv) {
                    ["dynamic_header","UBar","mid","mtop","res","SQL"].forEach(id => {
                        updateSectionWithCleanup(`div#${id}`, doc.querySelector(`div#${id}`));
                    });
                    handleGoldAnimation(oldValues, newGold);
                    const noteDiv = doc.querySelector("div.Note");
                    if (noteDiv) {
                        document.querySelectorAll("div.hideNote").forEach(n=>n.remove());
                        const newNote = document.createElement("div");
                        newNote.className = "Note";
                        newNote.style.top = "27%";
                        newNote.innerHTML = noteDiv.innerHTML;
                        document.body.appendChild(newNote);
                        setTimeout(()=>{
                            newNote.classList.add("hideNote");
                            setTimeout(()=>newNote.remove(),2000);
                        },2000);
                    }
                    if ($(document).width() <= 768) {
                        $("#side_info,#side_navi").hide();
                        $(".wrapper,#content,#res,#ltimeWrap,#dynamic_header,#header").css("filter","none");
                        $(".blackShadow,.overlay").hide();
                    }
                    const wrapper = doc.querySelector("div.wrapper");
                    const newUrl = wrapper ? wrapper.getAttribute('h') : href;
                    if (window.location.href !== newUrl) {
                        window.history.pushState({ path: newUrl }, '', newUrl);
                    }
                    if (typeof Chref_Attr === "function") Chref_Attr();
                    if (typeof NumbersKeypad === "function") NumbersKeypad();
                    if (typeof setupTooltips === "function") setupTooltips("[TDa]",true);
                    if (typeof Run_Speed_bares === "function") Run_Speed_bares();
                    if (typeof Run_Speed_attr === "function") Run_Speed_attr(null,',');
                    resolve();
                } else {
                    window.location.href = href;
                }
            }
            function ajaxRequest() {
                currentRequest = $.ajax({
                    url: href,
                    type: "GET",
                    timeout: 15000,
                    success: handleAjaxResponse,
                    error: (xhr,status) => {
                        const isRetryable = (status==='timeout' || (status==='error'&&xhr.status===502));
                        if (isRetryable && retryCount < MAX_RETRIES) {
                            retryCount++;
                            setTimeout(ajaxRequest,1000); 
                            return;
                        }
                        retryCount = 0;
                        const errorMessage = status==='timeout'
                            ? `<h1>وقت الطلب انتهت</h1><h2>لم يتم استلام الرد خلال الوقت المحدد. يرجى التحقق من اتصالك بالإنترنت.</h2>`
                            : `<h1>لقد فقدنا الاتصال بالإنترنت</h1><h2>يبدو أن هناك مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك وإصلاحه</h2>`;
                        updateSectionWithCleanup("div#content",errorMessage);
                    },
                    complete: () => {
                        currentCounts = {};
                        $("#day,#daym").show();
                        $("#loading,#loadingm").hide();
                        resetZoom();
                        init(2);
                        if (typeof QuickForm !== 'undefined' && QuickForm && QuickForm.charAt(0)==='#') {
                            const target = document.querySelector(QuickForm);
                            if (target) {
                                setTimeout(()=>{
                                    $([document.documentElement,document.body]).animate({
                                        scrollTop: target.getBoundingClientRect().top+window.scrollY
                                    });
                                },100);
                            }
                        } else if (window.scrollY>0 && typeof QuickForm!=='undefined' && QuickForm!=='1') {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                    }
                });
            }
            ajaxRequest();
        });
    }
    clearPreviousTasks();
    loadContent(url).finally(() => {
        _isLoading = false;
    });
}

$(document).ready(function(){
    $(document).off("click","a[quick], area[quick]").on("click","a[quick], area[quick]",function(event){
        if (event.ctrlKey || _isLoading || $(this).attr("href")===location.href.split('/').pop()) {
            return event.ctrlKey;
        }
        const href = $(this).attr("href");
        if (!href || href.includes('#')) return false;
        event.preventDefault();
        $("#day,#daym").hide();
        $("#loading,#loadingm").show();
        _isLoading = true;
        quickLoad(href);
        return false;
    });
    window.addEventListener("popstate", function(){
        if (!location.href.includes('#')) window.location.assign(location.href);
    });
});


function resetZoom() {
    try {
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isChrome = /Chrome/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        
        document.querySelectorAll('meta[name="viewport"]').forEach(meta => meta.remove());
        
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no';
        document.head.appendChild(viewport);
        
        if (isSafari || isIOS) {
            document.body.style.zoom = '1';
            document.documentElement.style.zoom = '1';
            document.body.style.display = 'none';
            document.body.offsetHeight;
            document.body.style.display = '';
        }
        
        document.documentElement.style.transform = "scale(1)";
        document.documentElement.style.transformOrigin = "top left";
        
        const timeout = (isSafari || isIOS) ? 500 : 200;
        
        setTimeout(() => {
            viewport.content = "width=device-width, initial-scale=1, maximum-scale=5, minimum-scale=1, user-scalable=yes";
            document.documentElement.style.transform = "";
        }, timeout);
        
        window.scrollTo(0, 0);
        
    } catch (error) {
        console.error('خطأ في resetZoom:', error);
        window.location.reload();
    }
}

function quickPost() {
    let isLoading = false;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    $(document).ready(function() {
        const bottomMenu = document.getElementById("bottom-menu");
        initEventListeners(bottomMenu);
    });

    function initEventListeners(bottomMenu) {
        $(document).off("submit", "form[quick]").on("submit", "form[quick]", function(event) {
            event.preventDefault();
            handleFormSubmit($(this), bottomMenu);
        });

        $(document).off("click", "form[quick] :submit").on("click", "form[quick] :submit", function() {
            const form = $(this).closest("form[quick]");
            const button = $(this);
            if (button.attr("name")) {
                form.append($("<input type='hidden'>").attr({
                    name: button.attr("name"),
                    value: button.attr("value")
                }));
            }
        });
    }

    function handleFormSubmit(form, bottomMenu) {
        if (isLoading || !bottomMenu) return false;
        form.find(':submit').prop('disabled', true);
        $("#day, #daym").hide();
        $("#loading, #loadingm").show();
        isLoading = true;

        if (typeof med_closeDescription === "function") med_closeDescription();
        if (chatEnabled) {
            clearInterval(Chating);
            Chating = null;
            chatEnabled = false;
        }
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
        if (typeof DoS !== "undefined") clearTimeout(DoS);

        bottomMenu.classList.remove("active");
        QuickForm = form.attr("quick") || '0';
        submitForm(form);
    }

    function submitForm(form) {
        $.ajax({
            url: form.attr("action") || Ll,
            type: form.attr("method") || "POST",
            data: new FormData(form[0]),
            processData: false,
            contentType: false,
            timeout: 15000,
            success: function(response) {
                handleSuccessResponse(response);
                handleComplete(form);
            },
            error: function(xhr, status, error) {
                const isTimeout = status === 'timeout';
                const is502Error = status === 'error' && xhr.status === 502;
    
                if ((isTimeout || is502Error) && retryCount < MAX_RETRIES) {
                    retryCount++;
                    setTimeout(() => {
                        submitForm(form);
                    }, 1000);
                    return;
                }
                retryCount = 0;
                handleErrorResponse(status);
                handleComplete(form);
            }
        });
    }

    function handleSuccessResponse(response) {
        clearDynamicScripts();
        const doc = new DOMParser().parseFromString(response, "text/html");
        
        const oldSpans = document.querySelectorAll('span.gold-number');
        const oldValues = Array.from(oldSpans).map(el => parseGold(el.textContent));
        const newGoldEl = doc.querySelector('span.gold-number');
        const newGold = newGoldEl ? parseGold(newGoldEl.textContent) : null;
            
        updateSections(doc);
            
        handleGoldAnimation(oldValues, newGold);
        const noteDiv = doc.querySelector("div.Note");
        if (noteDiv) {
            displayNote(noteDiv);
        }

        handleResponsiveAdjustments();
        updateUrl(doc);
        scrollToTop();

        if (typeof QuickForm !== 'undefined' && QuickForm && QuickForm !== '0' && QuickForm.charAt(0) === '#') {
            scrollToTarget(QuickForm);
        } else if (window.scrollY > 0 && typeof QuickForm !== 'undefined' && QuickForm !== '1') {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        
        handleFunctions();
    }

    function scrollToTarget(targetId) {
        const target = document.querySelector(targetId);
        if (target) {
            setTimeout(() => {
                $([document.documentElement, document.body]).animate({
                    scrollTop: target.getBoundingClientRect().top + window.scrollY
                });
            }, 100);
        }
    }
    
    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }    

    function displayNote(noteDiv) {
        document.querySelectorAll("div.hideNote").forEach(note => note.remove());
        const newNote = document.createElement("div");
        newNote.className = "Note";
        newNote.style.top = "27%";
        newNote.innerHTML = noteDiv.innerHTML;
        document.body.appendChild(newNote);

        setTimeout(() => {
            newNote.classList.add("hideNote");
            setTimeout(() => {
                if (newNote && newNote.parentNode) newNote.parentNode.removeChild(newNote);
            }, 2000);
        }, 2000);
    }

    function handleResponsiveAdjustments() {
        if ($(document).width() <= 768) {
            $("#side_info, #side_navi").css("display", "none");
            $(".wrapper, div#content, #res, #ltimeWrap, div#dynamic_header, div#header").css("filter", "none");
            $(".blackShadow, .overlay").hide();
        }
    }

    function updateUrl(doc) {
        const wrapper = doc.querySelector("div.wrapper");
        const newUrl = wrapper ? wrapper.getAttribute('h') : form.attr("action") || Ll;
        const currentUrl = window.location.href.split('#')[0].replace(/\/$/, '');
        const cleanNewUrl = newUrl.split('#')[0].replace(/\/$/, '');
        if (currentUrl !== cleanNewUrl) {
            window.history.pushState({ path: cleanNewUrl }, '', cleanNewUrl);
        }
    }

    function handleFunctions() {
        if (typeof Chref_Attr === "function") Chref_Attr();
        if (typeof NumbersKeypad === "function") NumbersKeypad();
        if (typeof setupTooltips === "function") setupTooltips("[TDa]", true);
        if (typeof Run_Speed_bares === "function") Run_Speed_bares();
        if (typeof Run_Speed_attr === "function") Run_Speed_attr(null, ',');
    }

    function handleErrorResponse(status) {
        let errorMessage = `
            <h1>لقد فقدنا الاتصال بالإنترنت</h1>
            <h2>يبدو أن هناك مشكلة في الاتصال بالإنترنت. يرجى التحقق من اتصالك وإصلاحه</h2>
        `;
        
        if (status === 'timeout') {
            errorMessage = `
                <h1>وقت الطلب انتهت</h1>
                <h2>لم يتم استلام الرد خلال الوقت المحدد. يرجى التحقق من اتصالك بالإنترنت.</h2>
            `;
        }
        
        updateSectionWithCleanup("div#content", errorMessage);
    }

    function handleComplete(form) {
        $("#day, #daym").show();
        $("#loading, #loadingm").hide();
        isLoading = false;
        retryCount = 0;
        init(3);
        form.find(':submit').prop('disabled', false);
    }
}


    // Update sections with new content from the response
    function updateSections(doc) {
        updateSectionWithCleanup("div#dynamic_header", doc.querySelector("div#dynamic_header"));
        updateSectionWithCleanup("header#UBar", doc.querySelector("header#UBar"));
        updateSectionWithCleanup("div#mid", doc.querySelector("div#mid"));
        updateSectionWithCleanup("div#mtop", doc.querySelector("div#mtop"));
        updateSectionWithCleanup("div#res", doc.querySelector("div#res"));
        updateSectionWithCleanup("div.SQL", doc.querySelector("div.SQL"));
    }



function showMapInfo(event) {
    const villageId = event.target.getAttribute("vid");
    const xCoord = event.target.getAttribute('x');
    const yCoord = event.target.getAttribute('y');

    const image = document.querySelector(".Pict");
    image.src = (GetMap[villageId] && GetMap[villageId].src) 
        ? GetMap[villageId].src 
        : (TBI(villageId) > (c13 ? 12 : 13) 
            ? `assets/default/img/m/w${TBI(villageId) <= 12 ? (TBI(villageId) <= 9 ? TBI(villageId) : 0) : SOS(TBI(villageId))}.jpg`
            : `assets/default/img/g/f${SOS(TBI(villageId))}.png`);

    const isOasis = TBI(villageId) > (c13 ? 12 : 13);
    if (isOasis) {
        if (GetMap[villageId]) {
            if (GetMap[villageId].PId > 0) {
                document.querySelector(".VNa").innerHTML = `<a href='dorf3?id=${villageId}'> ${Mp_5} <bdi style='direction: rtl;'>(${xCoord},${yCoord})</bdi></a>`;
                document.querySelector(".PNa").innerHTML = `${Mp_8} : <a href='spieler?uid=${GetMap[villageId].PId}'> <img src='assets/x.gif' style='margin-left: 2px;' class='unit u${GetMap[villageId].Tri}'> ${GetMap[villageId].PNa}</a>`;
                document.querySelector(".ANa").innerHTML = GetMap[villageId].AId ? `${Mp_9}:<a href='allianz?id=${GetMap[villageId].AId}'> ${GetMap[villageId].ANa}</a>` : `${Mp_9}:-`;
                document.querySelector(".Pop").innerHTML = '';
                document.querySelector(".Att").innerHTML = `<a href='a2b?id=${villageId}'> Â» ${Mp_1} </a>`;
                document.querySelector(".Mor").innerHTML = `<a href='farms?t=2&x=${xCoord}&y=${yCoord}'> Â» ${Mp_3}</a>`;
                document.querySelector(".Farm").innerHTML = '';
            } else {
                document.querySelector(".VNa").innerHTML = `<a href='dorf3?id=${villageId}'>${Mp_6} <bdi style='direction: rtl;'> (${xCoord},${yCoord})</bdi></a>`;
                document.querySelector(".PNa").innerHTML = '';
                document.querySelector(".ANa").innerHTML = '';
                document.querySelector(".Pop").innerHTML = '';
                document.querySelector(".Att").innerHTML = `<a href='a2b?id=${villageId}'> Â» ${Mp_1} </a>`;
                document.querySelector(".Mor").innerHTML = `<a href='farms?t=2&x=${xCoord}&y=${yCoord}'> Â» ${Mp_3}</a>`;
                document.querySelector(".Farm").innerHTML = '';
            }
        } else {
            document.querySelector(".VNa").innerHTML = `<a href='dorf3?id=${villageId}'>${Mp_6} <bdi style='direction: rtl;'> (${xCoord},${yCoord})</bdi></a>`;
            document.querySelector(".PNa").innerHTML = '';
            document.querySelector(".ANa").innerHTML = '';
            document.querySelector(".Pop").innerHTML = '';
            document.querySelector(".Att").innerHTML = `<a href='a2b?id=${villageId}'> Â» ${Mp_1} </a>`;
            document.querySelector(".Mor").innerHTML = `<a href='farms?t=2&x=${xCoord}&y=${yCoord}'> Â» ${Mp_3}</a>`;
            document.querySelector(".Farm").innerHTML = '';
        }
    } else {
        if (GetMap[villageId]) {
            if (GetMap[villageId].PId > 0) {
                document.querySelector(".VNa").innerHTML = `<a href='dorf3?id=${villageId}'>${GetMap[villageId].Vn} <bdi style='direction: rtl;'>(${xCoord},${yCoord})</bdi></a>`;
                document.querySelector(".PNa").innerHTML = `${Mp_8} : <a href='spieler?uid=${GetMap[villageId].PId}'> <img src='assets/x.gif' style='margin-left: 2px;' class='unit u${GetMap[villageId].Tri}'>${GetMap[villageId].PNa}</a>`;
                document.querySelector(".ANa").innerHTML = GetMap[villageId].AId ? `${Mp_9}:<a href='allianz?id=${GetMap[villageId].AId}'> ${GetMap[villageId].ANa}</a>` : `${Mp_9}:-`;
                document.querySelector(".Pop").innerHTML = `${Mp_10}:${GetMap[villageId].Pop}`;
                document.querySelector(".Att").innerHTML = `<a href='a2b?id=${villageId}'> Â» ${Mp_1} </a>`;
                document.querySelector(".Mor").innerHTML = `<a href='build?bid=17&vid2=${villageId}'> Â» ${Mp_2} </a>`;
                document.querySelector(".Farm").innerHTML = `<a href='farms?t=2&x=${xCoord}&y=${yCoord}'> Â» ${Mp_3}</a>`;
            } else {
                document.querySelector(".VNa").innerHTML = `<a href='dorf3?id=${villageId}'>${Mp_7} <bdi style='direction: rtl;'> (${xCoord},${yCoord})</bdi></a>`;
                document.querySelector(".PNa").innerHTML = '';
                document.querySelector(".ANa").innerHTML = '';
                document.querySelector(".Pop").innerHTML = '';
                document.querySelector(".Att").innerHTML = `<a href='a2b?id=${villageId}'> Â» ${Mp_4} </a>`;
                document.querySelector(".Mor").innerHTML = '';
                document.querySelector(".Farm").innerHTML = '';
            }
        } else {
            document.querySelector(".VNa").innerHTML = `<a href='dorf3?id=${villageId}'>${Mp_7} <bdi style='direction: rtl;'>(${xCoord},${yCoord})</bdi></a>`;
            document.querySelector(".PNa").innerHTML = '';
            document.querySelector(".ANa").innerHTML = '';
            document.querySelector(".Pop").innerHTML = '';
            document.querySelector(".Att").innerHTML = `<a href='a2b?id=${villageId}'> Â» ${Mp_4} </a>`;
            document.querySelector(".Mor").innerHTML = '';
            document.querySelector(".Farm").innerHTML = '';
        }
    }
}

function mapMove(event) {
    event.preventDefault();
    if (active && activeItem) {
        if (event.type === "touchmove") {
            activeItem.currentX = event.touches[0].clientX - activeItem.initialX;
            activeItem.currentY = event.touches[0].clientY - activeItem.initialY;
        } else {
            activeItem.currentX = event.clientX - activeItem.initialX;
            activeItem.currentY = event.clientY - activeItem.initialY;
        }
        activeItem.xOffset = activeItem.currentX;
        activeItem.yOffset = activeItem.currentY;
        if (Show.style.display === "none" && Crop.style.display === "none") {
            setCoordinates(activeItem.currentX, activeItem.currentY, activeItem);
        }
    }
}

function setCoordinates(xOffset, yOffset, element) {
    element.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    pushVillages(
        (xOffset / 60 > 0 ? Math.ceil(xOffset / 60) : Math.floor(xOffset / 60)) * -1,
        (yOffset / 60 > 0 ? Math.ceil(yOffset / 60) : Math.floor(yOffset / 60)) * -1,
        xOffset,
        yOffset
    );
    getElementById('x').innerHTML = x + (yOffset / 60 > 0 ? Math.floor(yOffset / 60) : Math.ceil(yOffset / 60)) * -1;
    getElementById('y').innerHTML = y + (xOffset / 60 > 0 ? Math.floor(xOffset / 60) : Math.ceil(xOffset / 60)) * -1;
    getElementById("mcx").setAttribute("value", x + (yOffset / 60 > 0 ? Math.floor(yOffset / 60) : Math.ceil(yOffset / 60)) * -1);
    getElementById("mcy").setAttribute("value", y + (xOffset / 60 > 0 ? Math.floor(xOffset / 60) : Math.ceil(xOffset / 60)) * -1);
}

function getVillageId(xCoord, yCoord) {
    return xCoord * MapSize + (yCoord + 1);
}

function generateMatrix(xCenter, yCenter, radius) {
    let coordList = '';
    for (let dx = -12; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const villageId = CIR(xCenter + dx) * MapSize + (CIR(yCenter + dy) + 1);
            coordList += (coordList ? ',' : '') + villageId;
        }
    }
    return coordList;
}

function getTileClass(villageId) {
    return (GetMap[villageId] && GetMap[villageId].Css) 
        ? GetMap[villageId].Css 
        : (TBI(villageId) > (c13 ? 12 : 13) 
            ? `o${TBI(villageId) <= 12 ? (TBI(villageId) <= 9 ? TBI(villageId) : 0) : SOS(TBI(villageId))}`
            : `t${TBI(villageId) <= 12 ? (TBI(villageId) <= 9 ? TBI(villageId) : 0) : SOS(TBI(villageId))}`);
}

function pushVillages(xOffset, yOffset, rawX, rawY) {
    for (let row = 12 + yOffset; row >= yOffset - 1; row--) {
        for (let col = 10 + xOffset; col >= xOffset - 1; col--) {
            const tileId = `i_${row}_${col}`;
            if ($(`#${tileId}`).length === 0) {
                const xCoord = CIR(x + row - 3);
                const yCoord = CIR(y + col - 3);
                const villageId = xCoord * MapSize + (yCoord + 1);
                const tileClass = getTileClass(villageId);
                const tileColor = GetMap[villageId] ? GetMap[villageId].Col : '';
                const tileContent = GetMap[villageId] ? GetMap[villageId].Att : '';
                $("#map_content").append(
                    `<div vid='${villageId}' x='${x + row - 3}' y='${y + col - 3}' id='${tileId}' class='${tileClass} ${tileColor} id${xOffset}${yOffset} II' style='top:${row * 50}px!important; left:${col * 50}px!important;'>${tileContent}</div>`
                );
                if (!_OId.includes(villageId) && !Trans && !Freaze) {
                    Trans = true;
                    Get_Map(generateMatrix(x + row - 3, y + col - 3, rad * 6), 0);
                    window.history.pushState('', '', `${location.href.split('?')[0]}?id=${villageId}`);
                }
            }
        }
    }
    if (Trans) removeOffscreenVillages(rawX, rawY);
}

function removeOffscreenVillages(xOffset, yOffset) {
    const mapContent = $("#map_content");
    mapContent.children("div").each(function() {
        const tile = $(this);
        const currentX = x + (yOffset / 60 > 0 ? Math.floor(yOffset / 60) : Math.ceil(yOffset / 60)) * -1;
        const currentY = y + (xOffset / 60 > 0 ? Math.floor(xOffset / 60) : Math.ceil(xOffset / 60)) * -1;
        const dx = currentX - tile.attr('x');
        const dy = currentY - tile.attr('y');
        if (dx < -4 || dx > 4 || dy < -4 || dy > 4) tile.remove();
    });
    console.log(mapContent.children("div").length);
}

function floorOrCeilPositive(value) {
    return value > 0 ? Math.floor(value) : Math.ceil(value);
}

function ceilOrFloorPositive(value) {
    return value > 0 ? Math.ceil(value) : Math.floor(value);
}


function upd_res(id, max, maxMerc, carry, merchNum) {
    let currentValue = parseInt(_("r" + id).value) || 0;
    
    let newValue = isNaN(currentValue) ? 0 : currentValue;

    set_res(id, newValue, carry, merchNum);

    let totalResources = getTotalResources();
    let maxTotalCapacity = maxMerc * carry;

    if (totalResources > maxTotalCapacity) {
        _("r" + id).value = currentValue;
        totalResources = getTotalResources();
        return;
    }

    updateMerchantsNeeded(carry, maxMerc);
}

function getTotalResources() {
    let total = 0;
    for (let i = 1; i <= 4; i++) {
        total += parseInt(_("r" + i).value) || 0;
    }
    return total;
}

function set_res(id, v, carry, merchNum, Res1, Res2, Res3, Res4) {
    if (id == 1) {
        if (v > Res1) v = Res1;
    }
    if (id == 2) {
        if (v > Res2) v = Res2;
    }
    if (id == 3) {
        if (v > Res3) v = Res3;
    }
    if (id == 4) {
        if (v > Res4) v = Res4;
    }

    if (v > merchNum * carry) v = merchNum * carry;

    if (v === 0) v = "";
    _("r" + id).value = v;
}

function add_res(id, maxMerc, carry, merchNum, Res1, Res2, Res3, Res4) {
    let currentValue = parseInt(_("r" + id).value) || 0;
    let newValue = currentValue + carry;

    if (newValue > merchNum * carry) {
        newValue = merchNum * carry;
    }
    if (id === 1 && newValue > Res1) {
        newValue = Res1;
    } else if (id === 2 && newValue > Res2) {
        newValue = Res2;
    } else if (id === 3 && newValue > Res3) {
        newValue = Res3;
    } else if (id === 4 && newValue > Res4) {
        newValue = Res4;
    }

    let totalResources = getTotalResources();
    let maxTotalCapacity = maxMerc * carry;

    if (totalResources + carry > maxTotalCapacity) {
        return;
    }

    _("r" + id).value = newValue > 0 ? newValue : "";
    updateMerchantsNeeded(carry, maxMerc);
}

function updateMerchantsNeeded(carry, max) {
    var res1 = parseInt(document.getElementById('r1').value) || 0;
    var res2 = parseInt(document.getElementById('r2').value) || 0;
    var res3 = parseInt(document.getElementById('r3').value) || 0;
    var res4 = parseInt(document.getElementById('r4').value) || 0;

    var totalResources = res1 + res2 + res3 + res4;
    var merchantsNeeded = Math.ceil(totalResources / carry);

    var usedMerchantsElement = document.getElementById('used_merchants');
    usedMerchantsElement.textContent = merchantsNeeded;

    if (merchantsNeeded > max) {
        usedMerchantsElement.style.color = 'red';
    } else {
        usedMerchantsElement.style.color = '';
    }
}

// Hide side navigation
function XblackShadow() {
    $("#side_navi").css("display", "none");
    $("#side_info").css("display", "none");
    $(".blackShadow").hide();
}

// Get mouse coordinates
function getMouseCoords(event) {
    const coords = { x: 0, y: 0 };
    if (event.touches && event.touches.length > 0) {
        coords.x = event.touches[0].clientX + window.scrollX;
        coords.y = event.touches[0].clientY + window.scrollY;
    } else {
        coords.x = event.pageX || event.clientX + window.scrollX;
        coords.y = event.pageY || event.clientY + window.scrollY;
    }
    return coords;
}

// Show tooltip on mouse move
function showTooltip(event, description, imageUrl) {
    const coords = getMouseCoords(event);
    const tooltip = getElementById("TDa");
    tooltip.innerHTML = description;

    if (imageUrl) {
        tooltip.style.background = `url(${imageUrl}) left center / contain no-repeat, #fffca8`;
        tooltip.style.paddingLeft = "60px";
    } else {
        tooltip.style.background = "#fffca8";
        tooltip.style.paddingLeft = "10px";
    }

    const tooltipWidth = tooltip.offsetWidth || 222;
    const tooltipHeight = tooltip.offsetHeight || 60;
    const scale = window.visualViewport?.scale || (typeof Zoom !== "undefined" ? Zoom : 1);
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = coords.x - tooltipWidth / 2;
    let top = coords.y + 20;

    if (left < 5) left = 5;
    else if (left + tooltipWidth > windowWidth) left = windowWidth - tooltipWidth - 5;

    if (top + tooltipHeight > windowHeight) top = Math.max(5, coords.y - tooltipHeight - 35);

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.className = '';
    tooltip.style.visibility = "visible";
    tooltip.style.opacity = '1';
}

// Hide tooltip
function hideTooltip() {
    const tooltip = getElementById("TDa");
    if (tooltip) {
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = '0';
    }
}

// Create resource description
function createResourceDescription(element) {
    return element.getAttribute("TDa");
}


// Setup tooltips
function setupTooltips(selector, useTDa = false) {
    document.querySelectorAll(selector).forEach(element => {
        element.addEventListener("mousemove", (event) => {
            const description = useTDa ? element.getAttribute("TDa") : element.getAttribute("data-desc");
            const imageUrl = useTDa ? element.getAttribute("IDa") : null;
            showTooltip(event, description, imageUrl);
        });

        element.addEventListener("touchmove", (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const description = useTDa ? element.getAttribute("TDa") : element.getAttribute("data-desc");
            const imageUrl = useTDa ? element.getAttribute("IDa") : null;
            showTooltip({ clientX: touch.clientX, clientY: touch.clientY }, description, imageUrl);
        });

        element.addEventListener("mouseleave", (event) => {
            const tooltip = getElementById("TDa");
            const relatedTarget = event.relatedTarget;
            if (!tooltip.contains(relatedTarget)) hideTooltip();
            tooltip.addEventListener("mouseleave", hideTooltip);
        });

        element.addEventListener("touchend", hideTooltip);
    });
}


// Update form inputs and submit
function updateFormInputs(speedFactor, resourceFactor, limit) {
    $("input.xcw").each(function() {
        if ($(this).val() > 0 && limit < 20 && limit !== -1) {
            $(this).val(Math.round(limit));
        }
    });
    $("input.xct").each(function() {
        if ($(this).val() > 0) {
            $(this).val(Math.round($(this).val() - $(this).val() * speedFactor));
        } 
    });
    $("input.xcf").each(function() {
        if ($(this).val() > 0) {
            $(this).val(Math.round($(this).val() - $(this).val() * resourceFactor));
        }
    });
    $("form").submit();
}


// Sync all checkboxes
function checkAll(checkbox) {
    $("input:checkbox").not(checkbox).prop("checked", checkbox.checked);
}

// Format large numbers with metric suffixes
function formatLargeNumber(number) {
    let exponent = 0;
    const sign = number < 0 ? '-' : '';
    let absNumber = Math.abs(number);

    if (absNumber >= 1000000000) {
        absNumber /= 1000000000;
        exponent = 3;
    } else if (absNumber >= 1000000) {
        absNumber /= 1000000;
        exponent = 2;
    } else if (absNumber >= 1000) {
        absNumber /= 1000;
        exponent = 1;
    }

    const suffixes = ['', "<b>K</b>", "<b>M</b>", "<b>T</b>"];
    const formatted = `${sign}${Math.floor(absNumber * 10) / 10}${suffixes[exponent]}`;
    return `<kmg>${formatted}</kmg>`;
}



// Initialize the JavaScript functionality for the game interface
function StartJS() {
    const expectedDomainsBase64 = [
        'dXRhdGFyLmNvbQ==', 'd2FyeHRhdGFyLmNvbQ=='];
    
    function decodeBase64(encoded) {
        return atob(encoded);
    }
    
    const currentDomain = window.location.hostname;
    const redirectUrl = 'https://wa.me/96181598905?text=Unauthorized%20Access%21%21';
    
    const decodedDomains = expectedDomainsBase64.map(decodeBase64);
    
    if (!decodedDomains.includes(currentDomain)) {
        window.location.href = redirectUrl;
    }
    // Check if specific game functions are defined and execute them
    if (typeof Chref_Attr === "function") {
        Chref_Attr();               // Initialize chat-related attributes
        NumbersKeypad();            // Setup numeric keypad functionality
        Run_Speed_bares();          // Run speed-related logic (possibly for animations)
        Run_Speed_attr(null, ',');  // Run speed attributes with comma separator
        init();                     // Initialize game timers and resources
        setupTooltips("[TDa]", true); // Setup tooltips for elements with TDa attribute

        // Create and append a tooltip container div to the body
        document.body.appendChild(function () {
            const tooltipDiv = document.createElement("div");
            tooltipDiv.id = "TDa";  // Tooltip container ID
            return tooltipDiv;
        }());

        // Toggle visibility of a secondary div and update classes on click
        $("div.One").click(() => {
            if ($("svg.One").hasClass('Ro')) {
                $("div.Two").hide();         // Hide secondary div
                $("svg.One").removeClass('Ro'); // Remove 'Ro' class (e.g., rotated state)
                $("div.One").removeClass('Op'); // Remove 'Op' class (e.g., open state)
            } else {
                $("div.Two").show();         // Show secondary div
                $("svg.One").addClass('Ro');    // Add 'Ro' class
                $("div.One").addClass('Op');    // Add 'Op' class
            }
        });

        // Initialize dynamic page loading and form submission
        quickPost();  // Handle form submissions via AJAX

        // Setup drag-and-drop functionality for the signup list
        $(document).ready(function () {
            let isDragging = false;      // Flag to track dragging state
            let offsetX = 0;             // X offset from click to elementâ€™s left edge
            let offsetY = 0;             // Y offset from click to elementâ€™s top edge
            const signupList = $("#signup_list"); // Element to be dragged

            // Start dragging on mousedown or touchstart
            signupList.find('h2').on("mousedown touchstart", function (event) {
                event.preventDefault();
                isDragging = true;
                const pointerEvent = event.type === "touchstart" ? event.originalEvent.touches[0] : event;
                const listOffset = signupList.offset();
                offsetX = pointerEvent.pageX - listOffset.left;
                offsetY = pointerEvent.pageY - listOffset.top;
            });

            // Update position during drag on mousemove or touchmove
            $(document).on("mousemove touchmove", function (event) {
                if (!isDragging) return;
                event.preventDefault();
                const pointerEvent = event.type === "touchmove" ? event.originalEvent.touches[0] : event;
                signupList.offset({
                    left: pointerEvent.pageX - offsetX,
                    top: pointerEvent.pageY - offsetY
                });
            });

            // Stop dragging on mouseup or touchend
            $(document).on("mouseup touchend", function () {
                isDragging = false;
            });
        });

        // Hide overlays and sidebars on closer click
        $(".closer, .XClos").click(function () {
            $(".blackShadow").hide(); // Hide black overlay
            $(".overlay").hide();     // Hide general overlay
            if ($(document).width() <= 768) { // Mobile view (â‰¤768px)
                $("#side_info").css("display", "none"); // Hide side info panel
                $("#side_navi").css("display", "none"); // Hide side navigation
            }
        });

    }
}

function NumbersKeypad() {
    var ParseIndian = function (S) {
        return (S.replace(/[Ã˜Â·Ã‚Â¸ Ã˜Â·Ã‚Â¸Ã˜Â·Ã…â€™Ã˜Â·Ã‚Â¸Ã˜Â¢Ã‚Â¢Ã˜Â·Ã‚Â¸Ã˜Â¢Ã‚Â£Ã˜Â·Ã‚Â¸Ã˜Â¢Ã‚Â¤Ã˜Â·Ã‚Â¸Ã˜Â¢Ã‚Â¥Ã˜Â·Ã‚Â¸Ã˜Â¢Ã‚Â¦Ã˜Â·Ã‚Â¸Ã˜Â¢Ã‚Â§Ã˜Â·Ã‚Â¸Ã˜Â¢Ã‚Â¨Ã˜Â·Ã‚Â¸Ã˜Â¢Ã‚Â©]/g, function (d) {
            return d.charCodeAt(0) - 1632;
        }).replace(/[Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â°Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â±Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â²Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â³Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â´Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚ÂµÃ˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â¶Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â·Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â¸Ã˜Â·Ã˜â€ºÃ˜Â¢Ã‚Â¹]/g, function (d) {
            return d.charCodeAt(0) - 1776;
        }));
    }
    var E = $('input[Typ="N"]');
    E.attr('pattern', '[0-9]*');
    E.attr('inputmode', 'numeric');
    E.attr('type', 'tel');
    E.keyup(function () {
        this.value = ParseIndian(this.value);
    });
}

function Run_Speed_attr(H=null,Com=null){
	var NF=function(x){return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, Com);}
	if(H===null){H='b';}
	if(Com===null){Com=',';}
	var Now=()=>new Date().getTime()/1000;
	var SecStr=(T)=>{var H,M,S;H=parseInt(T/3600);M=parseInt(T/60)-H*60;S=T-H*3600-M*60;return (H<10?'0'+H:H)+':'+(M<10?'0'+M:M)+':'+(S<10?'0'+S:S);}	
	var Sec=(H,S,Inc,Re=1)=>{var Stop;var Fu=()=>{if(S==0){clearInterval(Stop);if(Re){location.reload(true);}}S+=Inc;H.html(SecStr(S));};Fu();Stop=setInterval(Fu,1000);}
	var Counter=(H,S,L,Sp,l=false,HFun=X=>X,At0=X=>X)=>{var Stop,X,T=Now();if(typeof H=='string'){H=$(H);}var Fu=()=>{X=S+Math.round((Now()-T)*Sp);if(Sp>0){X=X>L?L:X;if(X>=L){clearInterval(Stop);}}else{if(l!==false){X=X<l?l:X;if(X<=l){clearInterval(Stop);}}if(X==0){At0();}}H.html(NF(HFun(X)));};Stop=setInterval(Fu,1000/(Sp>50?50:Sp));}
	var E=$(H+'[Speed]');
	for(var i=0;i<E.length;i++){
		var e=E.eq(i);var S=e.attr('Speed');
		var [Sp,L,l]=e.attr('Speed').split(',');
		S=e.html();
		S=S.split(Com).join("");
		Counter(e,+S,+L,+Sp,+l);
	}
	var E=$(H+'[Time]');
	for(var i=0;i<E.length;i++){
		var e=E.eq(i);var S=e.attr('Time');if(e.attr('Speed')){continue;}
		var [Inc,Re,S]=e.attr('Time').split(',');Re=+Re;
		Counter(e,+S,1e15,+Inc,0,SecStr,Re?()=>{location.reload(true);}:X=>X);	
	}
}

function Run_Speed_bares() {
    return 1;
}

function Atrdf() {
    var constants = {
        'compareValues': function (a, b) { return a === b; }
    };
}

function F(n, c1, c2, c3, c4) {
    let aP = +$('.rem').html() || 0;
    let P = n > 0 ? 1 : -1;
    let T = Math.abs(n);
    let No = [0, c1, c2, c3, c4];
    let Y = [0, 0.12, 0.12, 0.15, 0.3][T];
    let oP = +$('.val' + T).html();
    if ((aP - P) < 0 && P > 0) {
        P = 0;
    }
    let aPP = aP - P;
    for (let i = 1; i <= 4; i++) {
        let p = +$('.val' + i).html() + (T === i ? P : 0);
        $('.n' + i).css('color', p > No[i] ? 'green' : 'black');
        $('.q' + i).css('color', (aPP) > 0 && p < 100 ? 'green' : 'black');
    }
    let nP = oP + P;
    if (nP < No[T] && P < 0) {
        nP = No[T];
        P = 0;
    }
    if (nP < 0) {
        nP = 0;
        P = 0;
    }
    if (nP > 1000 && P === 1) {
        nP = 1000;
        P = 0;
    }
    $('.val' + T).html(nP);
    let Fix = X => Math.round(X * 100) / 100
    $('.v' + T).html(Fix(nP * Y) + ('%'));
    let width = (nP / 10);
    if (width > 100) {
        width = 100;
    }
    $('.ProgBar.x' + T).css('width', (width) + '%');
    $('.rem').html(aP - P);
    $('#f' + T).val(nP);
    $('#f5').val(aP - P);
}



    function morePack(packageId, paymentGateway) {
        //console.log(packageId);
        if (selectedPackageId !== null && selectedPackageId !== packageId) {
            return;
        }

        if (selectedPackageId === null) {
            selectedPackageId = packageId;
        }

        if (!currentCounts[packageId]) {
            currentCounts[packageId] = 1;
        }

        if (currentCounts[packageId] >= 3) {
            return;
        }

        currentCounts[packageId] += 1;

        let countElement = document.getElementById("package-count-" + packageId);
        if (currentCounts[packageId] > 0) {
            countElement.innerText = ` (${currentCounts[packageId]})`;
            countElement.style.display = "inline";
        }

        let goldElement = document.getElementById("gold-" + packageId);
        let costElement = document.getElementById("cost-" + packageId);

        let initialGold = parseFloat(document.getElementById("init-gold-" + packageId).innerText);
        let initialCost = parseFloat(document.getElementById("init-cost-" + packageId).innerText);

        let newGold = initialGold * currentCounts[packageId];
        let newCost = initialCost * currentCounts[packageId];

        let formattedGold = newGold.toLocaleString();
        let formattedCost = newCost.toLocaleString();

        goldElement.innerHTML = `${formattedGold} <img src="assets/x.gif?1h" class="gold" alt="Ã˜Â§Ã™â€žÃ˜Â°Ã™â€¡Ã˜Â¨" title="Ã˜Â§Ã™â€žÃ˜Â°Ã™â€¡Ã˜Â¨">`;
        costElement.innerHTML = `${formattedCost} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" style="width: 17px;height: 17px;margin-right: 2px;"><path class="cls-1" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" style="fill: rgb(35, 31, 32);"></path><path class="cls-1" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" style="fill: rgb(35, 31, 32);"></path></svg>`;
        if(currentCounts[packageId] >= 3){
            goldElement.style.color = "orange";
            costElement.style.color = "orange";
        }

        let packageLink = document.getElementById("package-link-" + packageId);
        packageLink.href = `plus?I=${packageId}&gw=${paymentGateway}&c=${currentCounts[packageId]}`;

        disableOtherLinks();
    }

function disableOtherLinks() {
        let allLinks = document.querySelectorAll('.package-link');

        allLinks.forEach(function(link) {
            if (link.id !== `package-link-${selectedPackageId}`) {
                link.href = "#";
            }
        });
}




function XCopy(Id){
    var range = document.createRange();
    range.selectNode(document.getElementById(Id));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges(); 
}

function Copy(S,F=null){_.P(S);P=_.P;
  var X = $("<i style='display:off'>"+S+"<i>");
  X.select();document.execCommand("copy");
  if(F){F();}
}

function Copied(E,S,OC,IsA=0,CC=''){E=$(E);var X;
	E.html(S);
	if(IsA){
		for(var i in OC){X=$(OC[i]);
			X.removeAttr('onclick');
			X.css('cursor','text');
			if(CC){X.attr('class',CC);}
		}
	}else{X=$(OC);
		X.removeAttr('onclick');
		X.css('cursor','text');
		if(CC){X.attr('class',CC);}
	}
}

function Allmsg(){
	for(var x=0;x<document.msg.elements.length;x++){
		var y=document.msg.elements[x];if(y.name!='s10')
		y.checked=document.msg.s10.checked;
	}
} 

function NF(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function filD(n,v, buyRes){
    
var ParseIndian=function(S){return(S.replace(/[Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©]/g,function(d){return d.charCodeAt(0)-1632; }).replace(/[Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹]/g,function(d){return d.charCodeAt(0)-1776;}));}
            $(n).val(v);
    		value = ParseIndian(v) * buyRes;
			$(".buyresources1").html(value+"");  
			$(".buyresources2").html(ParseIndian(v));            
}

function changeName(villageId, currentName) {
    $(".Vn").remove();
    $(".switchVillage").remove();
    $(".VnO").html(
        `<form action="" quick method="post">
            <input type="hidden" name="vn" value="${villageId}">
            <input style="height: 30px!important;width: 140px!important;font-size: 20px;" type="text" name="ChangeVilalgeName" value="${currentName}" maxlength="20" class="text">
            <button value="submit" name="submit" id="btn_ok" class="trav_buttons"> تغيير الإسم </button>
        </form>`
    );
}


$(document).on('click', '.Main', function() {
    const showstat = $('#side_info').css('display');
    if (showstat === 'none') {
        $('.blackShadow').show();
        $('#side_navi').css('display', 'block');
    } else {
        $('.blackShadow').hide();
        $('#side_info').css('display', 'none');
        $('#side_navi').css('display', 'none');
    }
});

$(document).on('click', '.leftham', function() {
    const showstat = $('#side_navi').css('display'); 
    if (showstat === 'none') {
        $('.blackShadow').show();
        $('#side_info').css('display', 'block');
    } else {
        $('.blackShadow').hide();
        $('#side_info').css('display', 'none');
        $('#side_navi').css('display', 'none');
    }
});



function n(v, x) {
    $('.overlay').show()
    $('.wrapper,#res,#ltimeWrap,div#dynamic_header').css('filter', 'blur(3px)')
    $('#caption').html(x)
    $.get(v, (x) => {
      $('.Screen-content').html(x)
    })
  }
//   p = document.getElementById("ce");
// 				 $('div#content,#res,#ltimeWrap,div#dynamic_header,div#header').css('filter','blur(3px)'); 

// 	p.innerHTML = '<div id="Screen" class="overlay" style="display: block;"><div class="mask closer"></div><div id="signup_list" class="overlay_content"><h2 id="caption">Ã˜ÂªÃ™Ë†Ã˜Â²Ã™Å Ã˜Â¹ Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜Â§Ã˜ÂµÃ˜Â¨ - Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â­Ã˜Â§Ã™â€žÃ™Â</h2><a class="closer No"><img class="dynamic_img" src="assets/x.gif"></a><div class="Screen-content" ><iframe  frameborder="0" src="alliancerole?uid='+uid+'" src="links" width="370" height="440" border="0"></iframe></div></div></div> ';
// 	$('.overlay h2').bind('touchstart mousedown',function(e) {isDown = true;offset = [$('.overlay').position().left - e.clientX,$('.overlay').position().top - e.clientY];});
// 	$(".closer,.XClos").click(function(){$('.wrapper,div#content,#res,#ltimeWrap,div#dynamic_header,div#header').css('filter','none');  $('.blackShadow').hide(); $('.overlay').hide();});
// 	$('#overlay').css('display','block');
		
