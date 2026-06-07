(function () {
    "use strict";

    function normalize(path) {
        var p = (path || "").toLowerCase().replace(/\/+$/, "");
        return p || "/";
    }

    function linkPath(anchor) {
        try {
            return normalize(new URL(anchor.href, window.location.origin).pathname);
        } catch (e) {
            return "";
        }
    }

    function controllerSegment(path) {
        var seg = path.split("/").filter(Boolean);
        return seg.length ? seg[0] : "";
    }

    function clearActive(sidebar) {
        sidebar.querySelectorAll(".nav-item.active, .nav-link.active, .collapse-item.active")
            .forEach(function (el) { el.classList.remove("active"); });
    }

    function highlightCurrent() {
        var sidebar = document.getElementById("accordionSidebar");
        if (!sidebar) {
            return;
        }

        var current = normalize(window.location.pathname);
        var currentController = controllerSegment(current);

        // Tat ca link co the dieu huong trong sidebar
        var anchors = Array.prototype.slice.call(
            sidebar.querySelectorAll("a.nav-link[href], a.collapse-item[href]")
        ).filter(function (a) {
            var href = a.getAttribute("href") || "";
            return href && href !== "#";
        });

        // 1) Khop chinh xac duong dan, 2) khop theo controller (vd trang Create)
        var match = anchors.find(function (a) { return linkPath(a) === current; });
        if (!match && currentController) {
            match = anchors.find(function (a) {
                return controllerSegment(linkPath(a)) === currentController;
            });
        }
        if (!match) {
            return;
        }

        clearActive(sidebar);
        match.classList.add("active");

        var collapse = match.closest(".collapse");
        if (collapse) {
            // Muc con: chi to mau muc con + mo nhom cha (khong to ca nhom cha)
            collapse.classList.add("show");
            var toggler = sidebar.querySelector('[data-target="#' + collapse.id + '"]');
            if (toggler) {
                toggler.classList.remove("collapsed");
                toggler.setAttribute("aria-expanded", "true");
            }
        } else {
            // Muc cap 1: to ca <li> de nav-link doi mau
            var parentItem = match.closest(".nav-item");
            if (parentItem) {
                parentItem.classList.add("active");
            }
        }
    }

    document.addEventListener("DOMContentLoaded", highlightCurrent);
    window.addEventListener("pageshow", highlightCurrent);
})();
