(function (window, document) {
    "use strict";

    const panel = document.getElementById("clientChatPanel");
    const form = document.getElementById("clientChatForm");
    const input = document.getElementById("clientChatInput");
    const submitButton = form ? form.querySelector("button[type='submit']") : null;
    const messagesElement = document.getElementById("clientChatMessages");
    const guestCard = document.getElementById("clientChatGuestCard");
    const guestStatus = document.getElementById("clientChatGuestStatus");
    const guestProfileForm = document.getElementById("clientChatGuestProfileForm");
    const guestNameInput = document.getElementById("clientChatGuestName");
    const guestEmailInput = document.getElementById("clientChatGuestEmail");
    const guestPhoneInput = document.getElementById("clientChatGuestPhone");
    const openButtons = Array.from(document.querySelectorAll("[data-chat-open]"));
    const closeButton = document.querySelector("[data-chat-close]");
    const minimizeButton = document.querySelector("[data-chat-minimize]");
    const apiBaseUrl = window.appConfig?.apiBaseUrl || (window.location.protocol === "https:" ? "https://localhost:7003" : "http://localhost:5010");

    if (!panel || !form || !input || !submitButton || !messagesElement || !guestCard || !guestStatus || !guestProfileForm || !guestNameInput || !guestEmailInput || !guestPhoneInput || !openButtons.length || !closeButton || !minimizeButton) {
        return;
    }

    const state = {
        connection: null,
        connectionPromise: null,
        context: null,
        messages: [],
        isLoaded: false,
        isGuestResolved: false,
        tempMessageSeed: -1
    };
    const guestTokenStorageKey = "webappclient_chat_guest_token";
    const guestSessionProfileStorageKey = "webappclient_chat_guest_profile";
    const guestProfileStorageKey = "webappclient_chat_guest_profile_persistent";

    function getSession() {
        return window.webAppClientAuth?.getSession?.() || null;
    }

    function isAuthenticated() {
        return Boolean(getSession()?.accessToken);
    }

    function getOrCreateGuestToken() {
        try {
            const existingToken = window.localStorage.getItem(guestTokenStorageKey);
            if (existingToken) {
                return existingToken;
            }

            const token = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            window.localStorage.setItem(guestTokenStorageKey, token);
            return token;
        } catch (error) {
            return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        }
    }

    function getGuestToken() {
        return isAuthenticated() ? "" : getOrCreateGuestToken();
    }

    function saveGuestSessionProfile(profile) {
        const normalizedProfile = {
            guestDisplayName: String(profile?.guestDisplayName || "").trim(),
            guestEmail: String(profile?.guestEmail || "").trim(),
            guestPhone: String(profile?.guestPhone || "").trim()
        };

        try {
            window.sessionStorage.setItem(guestSessionProfileStorageKey, JSON.stringify(normalizedProfile));
        } catch (error) {
            // Ignore storage failures in private modes.
        }

        try {
            window.localStorage.setItem(guestProfileStorageKey, JSON.stringify(normalizedProfile));
        } catch (error) {
            // Ignore storage failures in private modes.
        }
    }

    function parseStoredGuestProfile(rawValue) {
        if (!rawValue) {
            return null;
        }

        try {
            const profile = JSON.parse(rawValue);
            if (!profile || typeof profile !== "object") {
                return null;
            }

            return {
                guestDisplayName: String(profile.guestDisplayName || "").trim(),
                guestEmail: String(profile.guestEmail || "").trim(),
                guestPhone: String(profile.guestPhone || "").trim()
            };
        } catch (error) {
            return null;
        }
    }

    function getGuestSessionProfile() {
        try {
            const sessionProfile = parseStoredGuestProfile(window.sessionStorage.getItem(guestSessionProfileStorageKey));
            if (sessionProfile) {
                return sessionProfile;
            }
        } catch (error) {
            // Ignore storage failures in private modes.
        }

        try {
            return parseStoredGuestProfile(window.localStorage.getItem(guestProfileStorageKey));
        } catch (error) {
            return null;
        }
    }

    function clearGuestSessionProfile() {
        try {
            window.sessionStorage.removeItem(guestSessionProfileStorageKey);
        } catch (error) {
            // Ignore storage failures in private modes.
        }
    }

    function normalizeProfile(profile) {
        return {
            guestDisplayName: String(profile?.guestDisplayName || "").trim(),
            guestEmail: String(profile?.guestEmail || "").trim().toLowerCase(),
            guestPhone: String(profile?.guestPhone || "").replace(/\D/g, "")
        };
    }

    function sameGuestProfile(left, right) {
        const normalizedLeft = normalizeProfile(left);
        const normalizedRight = normalizeProfile(right);

        return normalizedLeft.guestDisplayName === normalizedRight.guestDisplayName
            && normalizedLeft.guestEmail === normalizedRight.guestEmail
            && normalizedLeft.guestPhone === normalizedRight.guestPhone;
    }

    function rotateGuestToken() {
        const token = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

        try {
            window.localStorage.setItem(guestTokenStorageKey, token);
        } catch (error) {
            // Ignore storage failures and fall back to in-memory token usage for this request.
        }

        state.context = null;
        state.messages = [];
        state.isLoaded = false;
        state.isGuestResolved = false;
        return token;
    }

    function buildHeaders() {
        const session = getSession();
        const headers = {};

        if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
        } else {
            headers["X-Guest-Token"] = getGuestToken();
        }

        return headers;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatTime(value) {
        const date = value ? new Date(value) : new Date();
        return new Intl.DateTimeFormat("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    }

    function getContextValue(primary, secondary = primary) {
        return state.context?.[primary] ?? state.context?.[secondary] ?? "";
    }

    function isGuestContext() {
        return Boolean(getContextValue("isGuest", "IsGuest"));
    }

    function setComposerEnabled(enabled) {
        input.disabled = !enabled;
        submitButton.disabled = !enabled;
        input.placeholder = enabled
            ? "Nhập tin nhắn..."
            : "Điền thông tin và bấm Bắt đầu chat";
    }

    function renderIntroMessage() {
        messagesElement.innerHTML = `
            <div class="client-chat-panel__message is-support">
                <div class="client-chat-panel__bubble">Xin chào, bạn cần hỗ trợ đặt phòng hay tư vấn loại phòng?</div>
                <span class="client-chat-panel__time">Vừa xong</span>
            </div>`;
    }

    function appendOrReplaceMessage(message) {
        const messageId = Number(message?.id ?? message?.Id ?? 0);
        if (messageId > 0) {
            const pendingIndex = state.messages.findIndex(item => Boolean(item?.isPending ?? item?.IsPending)
                && String(item?.content ?? item?.Content ?? "") === String(message?.content ?? message?.Content ?? "")
                && String(item?.senderRole ?? item?.SenderRole ?? "").toLowerCase() === String(message?.senderRole ?? message?.SenderRole ?? "").toLowerCase());
            if (pendingIndex >= 0) {
                state.messages[pendingIndex] = {
                    ...message,
                    isPending: false,
                    IsPending: false
                };
                return;
            }

            const currentIndex = state.messages.findIndex(item => Number(item?.id ?? item?.Id ?? 0) === messageId);
            if (currentIndex >= 0) {
                state.messages[currentIndex] = message;
                return;
            }
        }

        state.messages.push(message);
        state.messages.sort((left, right) => new Date(left?.createDate ?? left?.CreateDate ?? 0) - new Date(right?.createDate ?? right?.CreateDate ?? 0));
    }

    function removeMessageById(messageId) {
        state.messages = state.messages.filter(item => Number(item?.id ?? item?.Id ?? 0) !== messageId);
    }

    function createPendingCustomerMessage(content) {
        const session = getSession();
        const currentUserId = Number(session?.userId || 0);
        const conversationKey = String(state.context?.conversationKey ?? state.context?.ConversationKey ?? "");
        const customerName = String(state.context?.customerName ?? state.context?.CustomerName ?? "Khách vãng lai");
        const guestToken = String(state.context?.guestToken ?? state.context?.GuestToken ?? getGuestToken());
        const tempId = state.tempMessageSeed--;

        return {
            id: tempId,
            Id: tempId,
            conversationKey,
            ConversationKey: conversationKey,
            content,
            Content: content,
            createDate: new Date().toISOString(),
            CreateDate: new Date().toISOString(),
            senderRole: "Customer",
            SenderRole: "Customer",
            senderUserId: currentUserId > 0 ? currentUserId : null,
            SenderUserId: currentUserId > 0 ? currentUserId : null,
            customerName,
            CustomerName: customerName,
            guestToken,
            GuestToken: guestToken,
            isPending: true,
            IsPending: true
        };
    }

    function renderGuestCard() {
        if (isAuthenticated()) {
            guestCard.hidden = true;
            return;
        }

        if (state.isGuestResolved && isGuestContext()) {
            guestCard.hidden = true;
            return;
        }

        guestCard.hidden = false;
        guestStatus.textContent = "Nhập đầy đủ tên, email và số điện thoại để bắt đầu chat.";
    }

    function renderMessages() {
        if (!state.messages.length) {
            renderIntroMessage();
            return;
        }

        const session = getSession();
        const currentUserId = Number(session?.userId || 0);
        const guestToken = String(state.context?.guestToken ?? state.context?.GuestToken ?? getGuestToken());

        messagesElement.innerHTML = state.messages.map(item => {
            const senderRole = String(item?.senderRole ?? item?.SenderRole ?? "");
            const senderUserId = Number(item?.senderUserId ?? item?.SenderUserId ?? 0);
            const messageGuestToken = String(item?.guestToken ?? item?.GuestToken ?? "");
            const isUserMessage = senderRole.toLowerCase() === "customer"
                && ((currentUserId > 0 && senderUserId === currentUserId)
                    || (currentUserId <= 0 && guestToken && guestToken === messageGuestToken));
            const isPending = Boolean(item?.isPending ?? item?.IsPending);
            const timeLabel = isPending
                ? "Đang gửi..."
                : escapeHtml(formatTime(item?.createDate ?? item?.CreateDate));

            return `
                <div class="client-chat-panel__message ${isUserMessage ? "is-user" : "is-support"}${isPending ? " is-pending" : ""}">
                    <div class="client-chat-panel__bubble">
                        <div class="client-chat-panel__bubble-text">${escapeHtml(item?.content ?? item?.Content ?? "")}</div>
                        <span class="client-chat-panel__time">${timeLabel}</span>
                    </div>
                </div>`;
        }).join("");

        messagesElement.scrollTop = messagesElement.scrollHeight;
    }

    async function loadContext() {
        const response = await fetch(`${apiBaseUrl}/api/client/chat/context`, {
            headers: buildHeaders()
        });

        const payload = await response.json();
        const result = payload?.resultObj ?? payload?.ResultObj ?? null;
        if (!response.ok || Number(payload?.statusCode ?? payload?.StatusCode ?? response.status) >= 400 || !result) {
            throw new Error(payload?.message || payload?.Message || "Không thể tải thông tin chat.");
        }

        state.context = result;
        return result;
    }

    async function bootstrapGuestConversationByProfile(profile, options = {}) {
        const payload = {
            guestDisplayName: String(profile?.guestDisplayName || "").trim(),
            guestEmail: String(profile?.guestEmail || "").trim(),
            guestPhone: String(profile?.guestPhone || "").trim()
        };

        if (!payload.guestDisplayName || !payload.guestEmail || !payload.guestPhone) {
            throw new Error("Thông tin khách chưa đầy đủ.");
        }

        const response = await fetch(`${apiBaseUrl}/api/client/chat/guest/bootstrap`, {
            method: "POST",
            headers: {
                ...buildHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const body = await response.json();
        const result = body?.resultObj ?? body?.ResultObj ?? null;
        if (!response.ok || Number(body?.statusCode ?? body?.StatusCode ?? response.status) >= 400 || !result) {
            throw new Error(body?.message || body?.Message || "Không thể khởi tạo hội thoại khách.");
        }

        state.context = result.context ?? result.Context ?? null;
        state.messages = Array.isArray(result.messages ?? result.Messages) ? (result.messages ?? result.Messages) : [];
        state.isGuestResolved = true;
        state.isLoaded = true;
        saveGuestSessionProfile(payload);
        renderMessages();
        renderGuestCard();
        await ensureConnection();
        await joinCurrentConversation();
        await markMessagesAsSeen();
        setComposerEnabled(true);

        if (!options.silent) {
            const matchedExistingConversation = Boolean(result.matchedExistingConversation ?? result.MatchedExistingConversation);
            window.appNotifier?.success?.(matchedExistingConversation
                ? "Đã tìm thấy lịch sử chat trước đó."
                : "Đã tạo hội thoại mới. Bạn có thể bắt đầu chat.");
        }

        return result;
    }

    async function loadMessages() {
        const response = await fetch(`${apiBaseUrl}/api/client/chat/messages`, {
            headers: buildHeaders()
        });

        const payload = await response.json();
        const result = payload?.resultObj ?? payload?.ResultObj ?? [];
        if (!response.ok || Number(payload?.statusCode ?? payload?.StatusCode ?? response.status) >= 400) {
            throw new Error(payload?.message || payload?.Message || "Không thể tải lịch sử chat.");
        }

        state.messages = Array.isArray(result) ? result : [];
        renderMessages();
        await markMessagesAsSeen();
    }

    async function markMessagesAsSeen() {
        await fetch(`${apiBaseUrl}/api/client/chat/seen`, {
            method: "PUT",
            headers: buildHeaders()
        });
    }

    async function ensureConnection() {
        const session = getSession();
        const guestToken = getGuestToken();
        if (!window.signalR) {
            return null;
        }

        if (state.connection && state.connection.state === "Connected") {
            return state.connection;
        }

        if (state.connectionPromise) {
            return state.connectionPromise;
        }

        state.connectionPromise = (async () => {
            if (!state.connection) {
                const connectionUrl = new URL(`${apiBaseUrl}/chat`, window.location.origin);
                if (!session?.accessToken && guestToken) {
                    connectionUrl.searchParams.set("guestToken", guestToken);
                }

                state.connection = new window.signalR.HubConnectionBuilder()
                    .withUrl(connectionUrl.toString(), session?.accessToken
                        ? { accessTokenFactory: () => session.accessToken }
                        : {})
                    .withAutomaticReconnect()
                    .build();

                state.connection.on("ChatMessageReceived", message => {
                    const conversationKey = String(message?.conversationKey ?? message?.ConversationKey ?? "");
                    const currentConversationKey = String(state.context?.conversationKey ?? state.context?.ConversationKey ?? "");
                    if (!conversationKey || !currentConversationKey || conversationKey !== currentConversationKey) {
                        return;
                    }

                    appendOrReplaceMessage(message);
                    renderMessages();

                    const senderRole = String(message?.senderRole ?? message?.SenderRole ?? "").toLowerCase();
                    if (senderRole === "admin") {
                        markMessagesAsSeen().catch(() => {
                            // Ignore transient seen update failures.
                        });
                    }
                });

                state.connection.onreconnected(async () => {
                    try {
                        await joinCurrentConversation();
                        await loadMessages();
                    } catch (error) {
                        console.error("Client chat rejoin failed:", error);
                    }
                });
            }

            if (state.connection.state === "Disconnected") {
                await state.connection.start();
            }

            await joinCurrentConversation();
            return state.connection;
        })();

        try {
            return await state.connectionPromise;
        } finally {
            state.connectionPromise = null;
        }
    }

    async function joinCurrentConversation() {
        if (!state.connection) {
            return;
        }

        const conversationKey = String(state.context?.conversationKey ?? state.context?.ConversationKey ?? "");
        if (!conversationKey) {
            return;
        }

        await state.connection.invoke("JoinConversation", conversationKey);
    }

    async function initializeAuthenticatedChat() {
        if (state.isLoaded && !isGuestContext()) {
            setComposerEnabled(true);
            renderGuestCard();
            return;
        }

        await loadContext();
        state.isGuestResolved = false;
        await loadMessages();
        await ensureConnection();
        setComposerEnabled(true);
        guestCard.hidden = true;
        state.isLoaded = true;
    }

    function initializeGuestEntry() {
        if (state.isGuestResolved && state.isLoaded) {
            setComposerEnabled(true);
            renderGuestCard();
            renderMessages();
            return;
        }

        state.context = null;
        state.messages = [];
        state.isLoaded = false;
        state.isGuestResolved = false;
        guestNameInput.value = "";
        guestEmailInput.value = "";
        guestPhoneInput.value = "";
        renderIntroMessage();
        renderGuestCard();
        setComposerEnabled(false);
        guestNameInput.focus();
    }

    async function bootstrapGuestConversation(event) {
        event.preventDefault();

        const payload = {
            guestDisplayName: String(guestNameInput.value || "").trim(),
            guestEmail: String(guestEmailInput.value || "").trim(),
            guestPhone: String(guestPhoneInput.value || "").trim()
        };

        if (!payload.guestDisplayName || !payload.guestEmail || !payload.guestPhone) {
            window.appNotifier?.error("Vui lòng nhập đầy đủ tên, email và số điện thoại.");
            return;
        }

        try {
            if (!isAuthenticated()) {
                rotateGuestToken();
            }

            await bootstrapGuestConversationByProfile(payload);
            input.focus();
        } catch (error) {
            window.appNotifier?.error(error?.message || "Không thể khởi tạo hội thoại khách.");
        }
    }

    function openChat() {
        panel.hidden = false;
        panel.classList.remove("is-minimized");

        if (isAuthenticated()) {
            clearGuestSessionProfile();
            initializeAuthenticatedChat()
                .then(() => input.focus())
                .catch(error => {
                    window.appNotifier?.error(error?.message || "Không thể khởi tạo khung chat.");
                });
            return;
        }

        const sessionProfile = getGuestSessionProfile();
        if (sessionProfile?.guestDisplayName && sessionProfile?.guestEmail && sessionProfile?.guestPhone) {
            bootstrapGuestConversationByProfile(sessionProfile, { silent: true })
                .then(() => input.focus())
                .catch(() => {
                    clearGuestSessionProfile();
                    initializeGuestEntry();
                });
            return;
        }

        initializeGuestEntry();
    }

    function closeChat() {
        panel.hidden = true;
        panel.classList.remove("is-minimized");
    }

    function toggleMinimize() {
        panel.classList.toggle("is-minimized");
        if (!panel.classList.contains("is-minimized")) {
            if (!input.disabled) {
                input.focus();
            } else {
                guestNameInput.focus();
            }
        }
    }

    async function sendMessage(event) {
        event.preventDefault();

        if (!isAuthenticated() && !state.isGuestResolved) {
            window.appNotifier?.error("Vui lòng nhập thông tin và bấm Bắt đầu chat trước.");
            return;
        }

        const content = String(input.value || "").trim();
        if (!content) {
            return;
        }

        try {
            const connection = await ensureConnection();
            if (!connection) {
                return;
            }

            const session = getSession();
            const pendingMessage = createPendingCustomerMessage(content);
            appendOrReplaceMessage(pendingMessage);
            renderMessages();

            input.value = "";
            input.focus();

            const message = await connection.invoke("SendCustomerMessage", content, session?.accessToken ? null : getGuestToken());
            if (message) {
                appendOrReplaceMessage(message);
                renderMessages();
            }
        } catch (error) {
            const failedPendingMessage = state.messages.find(item => Boolean(item?.isPending ?? item?.IsPending)
                && String(item?.content ?? item?.Content ?? "") === content
                && String(item?.senderRole ?? item?.SenderRole ?? "").toLowerCase() === "customer");
            if (failedPendingMessage) {
                removeMessageById(Number(failedPendingMessage?.id ?? failedPendingMessage?.Id ?? 0));
                renderMessages();
            }

            input.value = content;
            input.focus();
            window.appNotifier?.error(error?.message || "Không thể gửi tin nhắn.");
        }
    }

    openButtons.forEach(button => button.addEventListener("click", openChat));
    closeButton.addEventListener("click", closeChat);
    minimizeButton.addEventListener("click", toggleMinimize);
    form.addEventListener("submit", sendMessage);
    guestProfileForm.addEventListener("submit", bootstrapGuestConversation);
    setComposerEnabled(false);

    if (isAuthenticated()) {
        ensureConnection().catch(error => {
            console.error("Client chat warmup failed:", error);
        });
    }
})(window, document);
