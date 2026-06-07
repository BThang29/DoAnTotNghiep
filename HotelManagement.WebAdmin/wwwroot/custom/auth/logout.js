(() => {
    "use strict";

    const logoutButton = document.getElementById("logoutButton");
    const logoutModal = document.getElementById("logoutModal");
    const notifier = window.appNotifier;

    if (!window.apiClient || !logoutButton) {
        return;
    }

    function hideModal() {
        if (window.jQuery && logoutModal) {
            window.jQuery(logoutModal).modal("hide");
        }
    }

    async function logout() {
        logoutButton.disabled = true;

        try {
            apiClient.clearToken();
            hideModal();
            notifier?.redirectWithNotification("/Auth/Login", "Đã đăng xuất.", "success");
        } finally {
            logoutButton.disabled = false;
        }
    }

    logoutButton.addEventListener("click", logout);
})();
﻿
