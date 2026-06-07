(function () {
    "use strict";

    var authPaths = ["/auth/login", "/auth/register"];
    var navRules = {
        "nav-dashboard": {
            any: ["ViewDashboard", "ViewReport", "ViewRevenueReport"]
        },
        "nav-booking-room": {
            all: [
                ["ViewBooking", "ManageBooking"],
                ["ViewRoom", "ManageRoom"]
            ]
        },
        "nav-check-available-room": {
            any: ["ViewRoom", "ManageRoom"]
        },
        "nav-deposit": {
            any: ["ManageBooking"]
        },
        "nav-invoices": {
            any: ["ViewInvoice", "ManageInvoice", "CreateInvoice"]
        },
        "nav-payments": {
            any: ["ViewPayment", "ManagePayment"]
        },
        "nav-payment-qr": {
            any: ["ViewPayment", "ManagePayment"]
        },
        "nav-rooms": {
            any: ["ViewRoom", "ManageRoom"]
        },
        "nav-room-types": {
            any: ["ViewRoom", "ManageRoom"]
        },
        "nav-room-statuses": {
            any: ["ViewRoom", "ManageRoom"]
        },
        "nav-services": {
            any: ["ViewService", "ManageService"]
        },
        "nav-service-types": {
            any: ["ViewService", "ManageService"]
        },
        "nav-customer-list": {
            any: ["ViewCustomer", "ManageCustomer"]
        },
        "nav-customer-reviews": {
            any: ["ViewCustomer", "ManageCustomer"]
        },
        "nav-employees": {
            any: ["ViewEmployee", "ManageEmployee"]
        },
        "nav-roles": {
            any: ["ViewRole", "ManageRole"]
        },
        "nav-revenue-report": {
            any: ["ViewDashboard", "ViewReport", "ViewRevenueReport"]
        }
    };
    var routeRules = {
        "/home": navRules["nav-dashboard"],
        "/home/index": navRules["nav-dashboard"],
        "/bookingroom/bookingroom": navRules["nav-booking-room"],
        "/bookingroom/checkavailableroom": navRules["nav-check-available-room"],
        "/bookingroom/deposit": navRules["nav-deposit"],
        "/invoice/invoices": navRules["nav-invoices"],
        "/payment/payments": navRules["nav-payments"],
        "/payment/paymentqr": navRules["nav-payment-qr"],
        "/room/rooms": navRules["nav-rooms"],
        "/room/roomtypes": navRules["nav-room-types"],
        "/room/roomstatuses": navRules["nav-room-statuses"],
        "/other/services": navRules["nav-services"],
        "/other/servicetypes": navRules["nav-service-types"],
        "/customer/customers": navRules["nav-customer-list"],
        "/customer/createcustomer": navRules["nav-customer-list"],
        "/review/reviews": navRules["nav-customer-reviews"],
        "/employee/employees": navRules["nav-employees"],
        "/employee/createemployee": navRules["nav-employees"],
        "/role/roles": navRules["nav-roles"]
    };
    var defaultRoutes = [
        { path: "/Home/Index", rule: navRules["nav-dashboard"] },
        { path: "/BookingRoom/BookingRoom", rule: navRules["nav-booking-room"] },
        { path: "/BookingRoom/CheckAvailableRoom", rule: navRules["nav-check-available-room"] },
        { path: "/BookingRoom/Deposit", rule: navRules["nav-deposit"] },
        { path: "/Invoice/Invoices", rule: navRules["nav-invoices"] },
        { path: "/Payment/Payments", rule: navRules["nav-payments"] },
        { path: "/Payment/PaymentQr", rule: navRules["nav-payment-qr"] },
        { path: "/Room/Rooms", rule: navRules["nav-rooms"] },
        { path: "/Room/RoomTypes", rule: navRules["nav-room-types"] },
        { path: "/Room/RoomStatuses", rule: navRules["nav-room-statuses"] },
        { path: "/Other/Services", rule: navRules["nav-services"] },
        { path: "/Other/ServiceTypes", rule: navRules["nav-service-types"] },
        { path: "/Customer/Customers", rule: navRules["nav-customer-list"] },
        { path: "/Review/Reviews", rule: navRules["nav-customer-reviews"] },
        { path: "/Employee/Employees", rule: navRules["nav-employees"] },
        { path: "/Employee/CreateEmployee", rule: navRules["nav-employees"] },
        { path: "/Role/Roles", rule: navRules["nav-roles"] }
    ];

    function normalizePath(path) {
        var normalized = (path || "").toLowerCase();
        normalized = normalized.replace(/\/+$/, "");
        return normalized || "/";
    }

    function getCurrentUser() {
        if (window.apiClient && typeof window.apiClient.getCurrentUser === "function") {
            return window.apiClient.getCurrentUser();
        }

        var rawValue = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
        if (!rawValue) {
            return null;
        }

        try {
            return JSON.parse(rawValue);
        } catch (error) {
            return null;
        }
    }

    function buildPrivilegeSet(currentUser) {
        var privileges = Array.isArray(currentUser?.privileges) ? currentUser.privileges : [];
        return new Set(privileges
            .filter(Boolean)
            .map(function (privilege) { return String(privilege).trim(); }));
    }

    function hasAnyPrivilege(privilegeSet, privileges) {
        return privileges.some(function (privilege) {
            return privilegeSet.has(privilege);
        });
    }

    function isAllowed(rule, privilegeSet) {
        if (!rule) {
            return false;
        }

        if (Array.isArray(rule.all) && rule.all.length > 0) {
            return rule.all.every(function (group) {
                return hasAnyPrivilege(privilegeSet, group);
            });
        }

        return hasAnyPrivilege(privilegeSet, rule.any || []);
    }

    function setElementVisible(id, isVisible) {
        var element = document.getElementById(id);
        if (!element) {
            return false;
        }

        element.hidden = !isVisible;
        return isVisible;
    }

    function resolveDefaultPath(privilegeSet) {
        var matchedRoute = defaultRoutes.find(function (route) {
            return isAllowed(route.rule, privilegeSet);
        });

        return matchedRoute ? matchedRoute.path : "/Auth/Login";
    }

    function applyNavbarPrivileges() {
        var currentUser = getCurrentUser();
        var privilegeSet = buildPrivilegeSet(currentUser);

        Object.keys(navRules).forEach(function (id) {
            setElementVisible(id, isAllowed(navRules[id], privilegeSet));
        });

        var hasBookingPayment = [
            "nav-booking-room",
            "nav-check-available-room",
            "nav-deposit",
            "nav-invoices",
            "nav-payments",
            "nav-payment-qr"
        ].some(function (id) {
            return !document.getElementById(id)?.hidden;
        });
        var hasRoomService = [
            "nav-rooms",
            "nav-room-types",
            "nav-room-statuses",
            "nav-services",
            "nav-service-types"
        ].some(function (id) {
            return !document.getElementById(id)?.hidden;
        });
        var hasOperations = hasBookingPayment || hasRoomService;
        var hasCustomerManagement = [
            "nav-customer-list",
            "nav-customer-reviews"
        ].some(function (id) {
            return !document.getElementById(id)?.hidden;
        });
        var hasStaffManagement = [
            "nav-employees",
            "nav-roles"
        ].some(function (id) {
            return !document.getElementById(id)?.hidden;
        });
        var hasManagement = hasCustomerManagement || hasStaffManagement || !document.getElementById("nav-revenue-report")?.hidden;
        var hasAnySidebarItem = !document.getElementById("nav-dashboard")?.hidden || hasOperations || hasManagement;

        setElementVisible("nav-booking-payment-group", hasBookingPayment);
        setElementVisible("nav-room-service-group", hasRoomService);
        setElementVisible("nav-customer-group", hasCustomerManagement);
        setElementVisible("nav-staff-group", hasStaffManagement);
        setElementVisible("nav-heading-operations", hasOperations);
        setElementVisible("nav-heading-management", hasManagement);
        setElementVisible("nav-divider-after-dashboard", hasOperations || hasManagement);
        setElementVisible("nav-divider-management", hasOperations && hasManagement);
        setElementVisible("nav-divider-bottom", hasAnySidebarItem);

        return privilegeSet;
    }

    function ensureAuthorizedRoute(privilegeSet) {
        var currentPath = normalizePath(window.location.pathname);

        if (authPaths.indexOf(currentPath) >= 0) {
            return;
        }

        if (privilegeSet.size === 0) {
            window.location.replace("/Auth/Login");
            return;
        }

        var matchedRule = routeRules[currentPath];
        if (!matchedRule) {
            return;
        }

        if (isAllowed(matchedRule, privilegeSet)) {
            return;
        }

        var defaultPath = resolveDefaultPath(privilegeSet);
        if (normalizePath(defaultPath) !== currentPath) {
            window.location.replace(defaultPath);
        }
    }

    function bindUserLogin() {
        var userLoginElement = document.getElementById("userLogin");
        if (!userLoginElement) {
            return;
        }

        var currentUser = getCurrentUser();
        var displayName = currentUser?.fullName || currentUser?.username || currentUser?.userName || "";

        if (!displayName) {
            return;
        }

        userLoginElement.textContent = displayName;
    }

    var privilegeSet = applyNavbarPrivileges();
    ensureAuthorizedRoute(privilegeSet);
    bindUserLogin();

    window.addEventListener("load", function () {
        applyNavbarPrivileges();
        bindUserLogin();
    });

    window.addEventListener("pageshow", function () {
        applyNavbarPrivileges();
        bindUserLogin();
    });

    document.addEventListener("DOMContentLoaded", function () {
        applyNavbarPrivileges();
        bindUserLogin();
    });
})();
