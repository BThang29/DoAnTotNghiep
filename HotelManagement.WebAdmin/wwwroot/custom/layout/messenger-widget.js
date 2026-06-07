(function () {
    "use strict";

    var THREADS_API = window.appUrl("/api/admin/chat/threads");
    var MESSAGES_API = window.appUrl("/api/admin/chat/messages");
    var SEEN_API = window.appUrl("/api/admin/chat/seen");
    var POLL_MS = 20000;
    var MAX_OPEN_POPUPS = 2;

    var state = {
        threads: [],
        messagesByConversation: {},
        currentUser: null,
        loadingThreads: false,
        loadingMessages: {},
        openOrder: [],
        connection: null
    };

    function getApi() {
        return window.apiClient;
    }

    function hasToken() {
        var api = getApi();
        return !!(api && api.getToken && api.getToken());
    }

    function currentUserId() {
        if (!state.currentUser) {
            state.currentUser = getApi()?.getCurrentUser?.() || null;
        }

        return Number(state.currentUser?.userId || 0);
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function resultObject(response) {
        return response?.resultObj || response?.ResultObj || response?.data || response?.Data || response;
    }

    function field(item, name) {
        var cap = name.charAt(0).toUpperCase() + name.slice(1);
        return item?.[name] !== undefined ? item[name] : item?.[cap];
    }

    function formatTime(value) {
        if (!value) {
            return "";
        }

        var d = new Date(value);
        if (isNaN(d.getTime())) {
            return "";
        }

        return d.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function parseContent(raw) {
        var fallback = { text: String(raw || ""), attachments: [] };
        if (!raw) {
            return { text: "", attachments: [] };
        }

        try {
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") {
                return fallback;
            }

            var text = typeof parsed.text === "string" ? parsed.text : "";
            var attachments = Array.isArray(parsed.attachments) ? parsed.attachments.filter(Boolean) : [];
            if (!text && attachments.length === 0) {
                return fallback;
            }

            return { text: text, attachments: attachments };
        } catch (e) {
            return fallback;
        }
    }

    function initials(name) {
        var parts = String(name || "?").trim().split(/\s+/);
        var first = parts[0] ? parts[0][0] : "?";
        var last = parts.length > 1 ? parts[parts.length - 1][0] : "";
        return (first + last) || "?";
    }

    function unreadMessageCount() {
        return state.threads.reduce(function (total, thread) {
            return total + Number(field(thread, "unseenCount") || 0);
        }, 0);
    }

    function normalizeThread(thread) {
        if (!thread) {
            return null;
        }

        return {
            conversationKey: String(field(thread, "conversationKey") || "").trim(),
            customerName: String(field(thread, "customerName") || "Khach vang lai").trim() || "Khach vang lai",
            customerId: Number(field(thread, "customerId") || 0),
            userId: Number(field(thread, "userId") || 0),
            isGuest: Boolean(field(thread, "isGuest")),
            guestToken: String(field(thread, "guestToken") || ""),
            guestEmail: String(field(thread, "guestEmail") || ""),
            guestPhone: String(field(thread, "guestPhone") || ""),
            assignedAdminUserId: Number(field(thread, "assignedAdminUserId") || 0) || null,
            assignedAdminName: String(field(thread, "assignedAdminName") || ""),
            lastMessage: String(field(thread, "lastMessage") || ""),
            lastSenderRole: String(field(thread, "lastSenderRole") || ""),
            lastMessageDate: field(thread, "lastMessageDate") || null,
            unseenCount: Number(field(thread, "unseenCount") || 0)
        };
    }

    function normalizeMessage(message) {
        if (!message) {
            return null;
        }

        return {
            id: Number(field(message, "id") || 0),
            conversationId: Number(field(message, "conversationId") || 0),
            conversationKey: String(field(message, "conversationKey") || "").trim(),
            customerId: Number(field(message, "customerId") || 0),
            customerName: String(field(message, "customerName") || "Khach vang lai").trim() || "Khach vang lai",
            userId: Number(field(message, "userId") || 0),
            guestToken: String(field(message, "guestToken") || ""),
            assignedAdminUserId: Number(field(message, "assignedAdminUserId") || 0) || null,
            assignedAdminName: String(field(message, "assignedAdminName") || ""),
            senderUserId: Number(field(message, "senderUserId") || 0) || null,
            senderRole: String(field(message, "senderRole") || ""),
            senderName: String(field(message, "senderName") || ""),
            createDate: field(message, "createDate") || null,
            content: String(field(message, "content") || ""),
            seen: Boolean(field(message, "seen")),
            seenDate: field(message, "seenDate") || null
        };
    }

    function getThread(conversationKey) {
        return state.threads.find(function (thread) {
            return thread.conversationKey === conversationKey;
        }) || null;
    }

    function ensureThreadFromMessage(message) {
        if (!message || !message.conversationKey) {
            return null;
        }

        var existing = getThread(message.conversationKey);
        if (existing) {
            existing.customerName = message.customerName || existing.customerName;
            existing.customerId = message.customerId || existing.customerId;
            existing.userId = message.userId || existing.userId;
            existing.guestToken = message.guestToken || existing.guestToken;
            existing.assignedAdminUserId = message.assignedAdminUserId || existing.assignedAdminUserId;
            existing.assignedAdminName = message.assignedAdminName || existing.assignedAdminName;
            existing.lastMessage = parseContent(message.content).text || existing.lastMessage;
            existing.lastSenderRole = message.senderRole || existing.lastSenderRole;
            existing.lastMessageDate = message.createDate || existing.lastMessageDate;

            if (String(message.senderRole || "").toLowerCase() === "customer") {
                existing.unseenCount = popupIsOpen(message.conversationKey) ? 0 : Math.max(0, Number(existing.unseenCount || 0) + (message.seen ? 0 : 1));
            }

            return existing;
        }

        var thread = {
            conversationKey: message.conversationKey,
            customerName: message.customerName || "Khach vang lai",
            customerId: message.customerId || 0,
            userId: message.userId || 0,
            isGuest: !message.customerId,
            guestToken: message.guestToken || "",
            guestEmail: "",
            guestPhone: "",
            assignedAdminUserId: message.assignedAdminUserId || null,
            assignedAdminName: message.assignedAdminName || "",
            lastMessage: parseContent(message.content).text || "",
            lastSenderRole: message.senderRole || "",
            lastMessageDate: message.createDate || null,
            unseenCount: String(message.senderRole || "").toLowerCase() === "customer" && !message.seen && !popupIsOpen(message.conversationKey) ? 1 : 0
        };

        state.threads.push(thread);
        return thread;
    }

    function sortThreads() {
        state.threads.sort(function (left, right) {
            var leftUnread = Number(left.unseenCount || 0);
            var rightUnread = Number(right.unseenCount || 0);

            if ((leftUnread > 0) !== (rightUnread > 0)) {
                return leftUnread > 0 ? -1 : 1;
            }

            return new Date(right.lastMessageDate || 0) - new Date(left.lastMessageDate || 0);
        });
    }

    function updateBadge() {
        var badge = document.getElementById("messengerBadge");
        if (!badge) {
            return;
        }

        var count = unreadMessageCount();
        if (count > 0) {
            badge.textContent = count > 99 ? "99+" : String(count);
            badge.style.display = "";
        } else {
            badge.style.display = "none";
        }
    }

    function renderList() {
        var box = document.getElementById("messengerThreadList");
        if (!box) {
            return;
        }

        if (!state.threads.length) {
            box.innerHTML = '<div class="messenger-empty">Chua co hoi thoai nao.</div>';
            return;
        }

        sortThreads();
        box.innerHTML = state.threads.map(function (thread) {
            var unreadCount = Number(thread.unseenCount || 0);
            return '' +
                '<div class="messenger-thread' + (unreadCount > 0 ? ' is-unseen' : '') + '" data-conversation-key="' + escapeHtml(thread.conversationKey) + '">' +
                    '<div class="messenger-thread-avatar">' + escapeHtml(initials(thread.customerName)) + '</div>' +
                    '<div class="messenger-thread-main">' +
                        '<div class="messenger-thread-name"><span>' + escapeHtml(thread.customerName) + '</span><span class="messenger-thread-time">' + escapeHtml(formatTime(thread.lastMessageDate)) + '</span></div>' +
                        '<div class="messenger-thread-preview">' + escapeHtml(thread.lastMessage || "Khong co noi dung") + '</div>' +
                    '</div>' +
                    (unreadCount > 0 ? '<span class="messenger-thread-dot">' + escapeHtml(unreadCount > 9 ? "9+" : String(unreadCount)) + '</span>' : '<span class="messenger-thread-dot"></span>') +
                '</div>';
        }).join("");
    }

    function popupId(conversationKey) {
        return "messenger-popup-" + encodeURIComponent(conversationKey).replace(/[^a-zA-Z0-9]/g, "_");
    }

    function popupIsOpen(conversationKey) {
        return !!document.getElementById(popupId(conversationKey));
    }

    function getMessages(conversationKey) {
        return (state.messagesByConversation[conversationKey] || []).slice().sort(function (a, b) {
            return new Date(a.createDate || 0) - new Date(b.createDate || 0);
        });
    }

    function upsertMessage(message) {
        if (!message || !message.conversationKey) {
            return;
        }

        var list = state.messagesByConversation[message.conversationKey] || [];
        var index = list.findIndex(function (item) { return Number(item.id || 0) === Number(message.id || 0); });
        if (index >= 0) {
            list[index] = message;
        } else {
            list.push(message);
        }

        state.messagesByConversation[message.conversationKey] = list;
    }

    function renderPopupBody(conversationKey) {
        var popup = document.getElementById(popupId(conversationKey));
        if (!popup) {
            return;
        }

        var body = popup.querySelector(".messenger-popup-body");
        if (!body) {
            return;
        }

        var myId = currentUserId();
        var list = getMessages(conversationKey);
        if (!list.length) {
            body.innerHTML = '<div class="messenger-empty">Chua co tin nhan.</div>';
            return;
        }

        body.innerHTML = list.map(function (message) {
            var parsed = parseContent(message.content);
            var role = String(message.senderRole || "").toLowerCase();
            var mine = role === "admin" || (Number(message.senderUserId || 0) === myId && myId !== 0);
            var imgs = parsed.attachments
                .filter(function (item) { return item && item.dataUrl; })
                .map(function (item) { return '<img src="' + escapeHtml(item.dataUrl) + '" alt="" />'; })
                .join("");
            var textHtml = parsed.text ? escapeHtml(parsed.text) : "";

            return '<div class="messenger-msg ' + (mine ? "is-me" : "is-them") + '">' +
                textHtml + imgs +
                '<span class="messenger-msg-time">' + escapeHtml(formatTime(message.createDate)) + '</span>' +
                '</div>';
        }).join("");

        body.scrollTop = body.scrollHeight;
    }

    function createPopup(thread) {
        var container = document.getElementById("messengerPopups");
        if (!container || !thread) {
            return null;
        }

        var popup = document.createElement("div");
        popup.className = "messenger-popup";
        popup.id = popupId(thread.conversationKey);
        popup.setAttribute("data-conversation-key", thread.conversationKey);
        popup.innerHTML = '' +
            '<div class="messenger-popup-header" data-action="toggle">' +
                '<div class="messenger-popup-avatar">' + escapeHtml(initials(thread.customerName)) + '</div>' +
                '<div class="messenger-popup-title">' + escapeHtml(thread.customerName) + '</div>' +
                '<div class="messenger-popup-actions">' +
                    '<button type="button" data-action="toggle" title="Thu gon">&#8211;</button>' +
                    '<button type="button" data-action="close" title="Dong">&times;</button>' +
                '</div>' +
            '</div>' +
            '<div class="messenger-popup-body"></div>' +
            '<div class="messenger-popup-footer">' +
                '<input type="text" placeholder="Nhap tin nhan..." aria-label="Tin nhan" />' +
                '<button type="button" data-action="send" title="Gui"><i class="fas fa-paper-plane"></i></button>' +
            '</div>';

        container.appendChild(popup);
        return popup;
    }

    function syncOpenOrder() {
        state.openOrder = state.openOrder.filter(function (conversationKey) {
            return !!document.getElementById(popupId(conversationKey));
        });
    }

    function touchPopupOrder(conversationKey) {
        syncOpenOrder();
        state.openOrder = state.openOrder.filter(function (item) { return item !== conversationKey; });
        state.openOrder.push(conversationKey);
    }

    function enforcePopupLimit() {
        syncOpenOrder();
        while (state.openOrder.length > MAX_OPEN_POPUPS) {
            closePopup(state.openOrder[0]);
        }
    }

    async function openPopup(conversationKey) {
        if (!conversationKey) {
            return;
        }

        var thread = getThread(conversationKey);
        if (!thread) {
            return;
        }

        var existing = document.getElementById(popupId(conversationKey));
        if (!existing) {
            createPopup(thread);
        } else {
            existing.classList.remove("is-collapsed");
        }

        touchPopupOrder(conversationKey);
        enforcePopupLimit();
        await loadMessages(conversationKey, true);
        await markSeen(conversationKey, true);

        var popup = document.getElementById(popupId(conversationKey));
        var input = popup && popup.querySelector("input");
        if (input) {
            input.focus();
        }
    }

    function closePopup(conversationKey) {
        var popup = document.getElementById(popupId(conversationKey));
        if (popup) {
            popup.remove();
        }

        state.openOrder = state.openOrder.filter(function (item) { return item !== conversationKey; });
    }

    async function ensureConnection() {
        if (!window.signalR || state.connection || !hasToken()) {
            return state.connection;
        }

        var api = getApi();
        var token = api?.getToken?.();
        if (!token) {
            return null;
        }

        var hubUrl = new URL(window.appConfig?.apiBaseUrl || window.location.origin);
        hubUrl.pathname = "/chat";
        hubUrl.search = "";

        state.connection = new window.signalR.HubConnectionBuilder()
            .withUrl(hubUrl.toString(), {
                accessTokenFactory: function () { return token; }
            })
            .withAutomaticReconnect()
            .build();

        state.connection.on("ChatMessageReceived", function (payload) {
            var message = normalizeMessage(payload);
            if (!message || !message.conversationKey) {
                return;
            }

            ensureThreadFromMessage(message);
            upsertMessage(message);

            if (String(message.senderRole || "").toLowerCase() === "customer" && popupIsOpen(message.conversationKey)) {
                markSeen(message.conversationKey, true);
            }

            renderList();
            updateBadge();
            renderPopupBody(message.conversationKey);
        });

        state.connection.on("ChatThreadUpdated", function (payload) {
            var thread = normalizeThread(payload);
            if (!thread || !thread.conversationKey) {
                return;
            }

            var current = getThread(thread.conversationKey);
            if (current) {
                Object.assign(current, thread);
            } else {
                state.threads.push(thread);
            }

            if (popupIsOpen(thread.conversationKey)) {
                thread.unseenCount = 0;
            }

            renderList();
            updateBadge();
        });

        await state.connection.start();
        return state.connection;
    }

    async function send(conversationKey, inputEl, button) {
        if (!conversationKey || !inputEl || !button || button.disabled) {
            return;
        }

        var text = (inputEl.value || "").trim();
        if (!text) {
            return;
        }

        button.disabled = true;
        inputEl.value = "";

        try {
            var connection = await ensureConnection();
            var messagePayload = null;

            if (connection) {
                messagePayload = await connection.invoke("SendAdminMessage", conversationKey, text);
            } else {
                var response = await getApi().Post(window.appUrl("/api/admin/chat/send"), {
                    conversationKey: conversationKey,
                    content: text
                }, { showLoading: false });
                messagePayload = resultObject(response);
            }

            var message = normalizeMessage(messagePayload);
            if (message) {
                upsertMessage(message);
                ensureThreadFromMessage(message);
                renderList();
                updateBadge();
                renderPopupBody(conversationKey);
            } else {
                await loadMessages(conversationKey, true);
                await loadThreads();
            }
        } catch (error) {
            console.error("Messenger send failed:", error);
            inputEl.value = text;
            window.appNotifier?.error("Không thể gửi tin nhắn.");
        } finally {
            button.disabled = false;
            inputEl.focus();
        }
    }

    async function markSeen(conversationKey, skipLoadThreads) {
        var thread = getThread(conversationKey);
        if (!thread || Number(thread.unseenCount || 0) <= 0) {
            return;
        }

        try {
            await getApi().Put(SEEN_API + "?conversationKey=" + encodeURIComponent(conversationKey), {}, { showLoading: false });
            thread.unseenCount = 0;

            var list = state.messagesByConversation[conversationKey] || [];
            list.forEach(function (message) {
                if (String(message.senderRole || "").toLowerCase() === "customer") {
                    message.seen = true;
                    message.seenDate = message.seenDate || new Date().toISOString();
                }
            });

            renderList();
            updateBadge();

            if (!skipLoadThreads) {
                await loadThreads();
            }
        } catch (error) {
            console.error("Messenger mark seen failed:", error);
        }
    }

    async function loadThreads() {
        if (state.loadingThreads || !hasToken()) {
            return;
        }

        state.loadingThreads = true;
        try {
            var response = await getApi().Get(THREADS_API, { showLoading: false });
            var result = resultObject(response);
            var threads = Array.isArray(result) ? result : [];

            state.threads = threads
                .map(normalizeThread)
                .filter(function (thread) { return thread && thread.conversationKey; });

            state.threads.forEach(function (thread) {
                if (popupIsOpen(thread.conversationKey)) {
                    thread.unseenCount = 0;
                }
            });

            renderList();
            updateBadge();
        } catch (error) {
            console.error("Messenger load threads failed:", error);
            var box = document.getElementById("messengerThreadList");
            if (box) {
                box.innerHTML = '<div class="messenger-empty">Không thể tải hội thoại.</div>';
            }
        } finally {
            state.loadingThreads = false;
        }
    }

    async function loadMessages(conversationKey, force) {
        if (!conversationKey || (!force && state.loadingMessages[conversationKey])) {
            return;
        }

        state.loadingMessages[conversationKey] = true;
        try {
            var response = await getApi().Get(MESSAGES_API + "?conversationKey=" + encodeURIComponent(conversationKey), { showLoading: false });
            var result = resultObject(response);
            var messages = Array.isArray(result) ? result : [];

            state.messagesByConversation[conversationKey] = messages
                .map(normalizeMessage)
                .filter(Boolean);

            renderPopupBody(conversationKey);
        } catch (error) {
            console.error("Messenger load messages failed:", error);
        } finally {
            state.loadingMessages[conversationKey] = false;
        }
    }

    function bind() {
        var list = document.getElementById("messengerThreadList");
        if (list) {
            list.addEventListener("click", function (event) {
                var item = event.target.closest("[data-conversation-key]");
                if (item) {
                    openPopup(item.getAttribute("data-conversation-key"));
                }
            });
        }

        var toggle = document.getElementById("messengerToggle");
        if (toggle) {
            toggle.addEventListener("click", function () {
                loadThreads();
            });
        }

        var popups = document.getElementById("messengerPopups");
        if (popups) {
            popups.addEventListener("click", function (event) {
                var popup = event.target.closest(".messenger-popup");
                if (!popup) {
                    return;
                }

                var conversationKey = popup.getAttribute("data-conversation-key");
                var actionElement = event.target.closest("[data-action]");
                var action = actionElement && actionElement.getAttribute("data-action");

                touchPopupOrder(conversationKey);

                if (action === "close") {
                    closePopup(conversationKey);
                } else if (action === "toggle") {
                    popup.classList.toggle("is-collapsed");
                } else if (action === "send") {
                    send(conversationKey, popup.querySelector("input"), actionElement);
                }
            });

            popups.addEventListener("keydown", function (event) {
                if (event.key !== "Enter") {
                    return;
                }

                var input = event.target.closest("input");
                var popup = event.target.closest(".messenger-popup");
                if (input && popup) {
                    event.preventDefault();
                    send(popup.getAttribute("data-conversation-key"), input, popup.querySelector('[data-action="send"]'));
                }
            });
        }
    }

    function init() {
        if (!hasToken() || !document.getElementById("messengerToggle")) {
            return;
        }

        bind();
        loadThreads();
        ensureConnection().catch(function (error) {
            console.error("Messenger signalr init failed:", error);
        });
        window.setInterval(loadThreads, POLL_MS);
    }

    document.addEventListener("DOMContentLoaded", init);
})();
