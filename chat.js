<script>(function() { 
    $(function () {
        const chatModule = (function () {
            const chatbox = $('#chatbox');
            const usermsg = $('#usermsg');
            const screenInput = $('#Screeen');
            const submitBtn = $('#submitmsg');
            chatbox.scrollTop(chatbox[0].scrollHeight);
            let poller = null;
            function sendMessage() {
                const clientMsg = usermsg.val();
                const fileInput = screenInput[0].files[0];
                if (clientMsg || fileInput) {
                    const formData = new FormData();
                    formData.append("text", clientMsg);
                    if (fileInput) {
                        formData.append("Screen", fileInput);
                    }
                    $.ajax({
                        url: "chat",
                        type: "POST",
                        data: formData,
                        processData: false,
                        contentType: false
                    });
                    usermsg.val("");
                    screenInput.val("");
                }
                usermsg.focus();
            }
            function loadLog() {
                const oldScrollHeight = chatbox[0].scrollHeight;
                $.ajax({
                    url: "chathelper",
                    cache: false,
                    success: function (html) {
                        chatbox.html(html);
                        const newScrollHeight = chatbox[0].scrollHeight;
                        if (newScrollHeight > oldScrollHeight) {
                            chatbox.animate({ scrollTop: newScrollHeight }, 'normal');
                        }
                    }
                });
            }
            function initEvents() {
                submitBtn.on('click.chat', function (e) {
                    e.preventDefault();
                    sendMessage();
                });
                usermsg.on('keypress.chat', function (e) {
                    if (e.which === 13) {
                        e.preventDefault();
                        sendMessage();
                    }
                });
            }
            function startAutoLoad() {
                if (!poller) {
                    poller = setInterval(function () {
                        if (window.location.pathname === '/chat' && document.hasFocus()) {
                            loadLog();
                        }
                    }, 2500);
                }
            }
            function stopAutoLoad() {
                if (poller) {
                    clearInterval(poller);
                    poller = null;
                }
            }
            window.addEventListener('popstate', function () {
                if (window.location.pathname === '/chat' && document.hasFocus()) {
                    startAutoLoad();
                } else {
                    stopAutoLoad();
                }
            });
            window.addEventListener('focus', function () {
                if (window.location.pathname === '/chat') {
                    startAutoLoad();
                }
            });
            window.addEventListener('blur', function () {
                stopAutoLoad();
            });
            return {
                init: function () {
                    initEvents();
                    if (window.location.pathname === '/chat' && document.hasFocus()) {
                        startAutoLoad();
                    }
                }
            };
        })();
        chatModule.init();
    });

    function reportChat(id, playerId) {
        event.preventDefault();
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "chat", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        var data = "chatId=" + encodeURIComponent(id);
        xhr.send(data);
    }

 })();</script>