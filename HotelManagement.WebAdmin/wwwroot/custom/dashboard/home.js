(() => {
    "use strict";

    const dashboardSummaryApiUrl = window.appUrl("/api/admin/dashboard/summary");
    const notifier = window.appNotifier;

    const revenueThisMonthElement = document.getElementById("revenueThisMonth");
    const totalRevenueElement = document.getElementById("totalRevenue");
    const occupiedRoomsRatioElement = document.getElementById("occupiedRoomsRatio");
    const occupiedRoomsProgressElement = document.getElementById("occupiedRoomsProgress");
    const stayingGuestCountElement = document.getElementById("stayingGuestCount");
    const serviceTypeListElement = document.getElementById("serviceTypeList");
    const donutChartElement = document.getElementById("myPieChart");

    let roomStatusChart = null;

    if (!window.apiClient
        || !revenueThisMonthElement
        || !totalRevenueElement
        || !occupiedRoomsRatioElement
        || !occupiedRoomsProgressElement
        || !stayingGuestCountElement
        || !serviceTypeListElement
        || !donutChartElement
        || typeof Chart === "undefined") {
        return;
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function formatNumber(value) {
        return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
    }

    function getSummaryPayload(response) {
        return response?.resultObj
            || response?.ResultObj
            || response?.data
            || response;
    }

    function getRevenue(summary) {
        return summary?.revenue || summary?.Revenue || {};
    }

    function getRooms(summary) {
        return summary?.rooms || summary?.Rooms || {};
    }

    function getServiceTypes(summary) {
        return summary?.serviceTypes
            || summary?.ServiceTypes
            || summary?.services
            || summary?.Services
            || [];
    }

    function renderServiceTypes(serviceTypes) {
        const fakeDescriptions = {
            "Ăn uống": "Thực đơn phong phú, phục vụ nhanh trong ngày.",
            "Giặt là": "Nhận và trả đồ đúng giờ, hỗ trợ theo yêu cầu.",
            "Spa": "Không gian thư giãn với liệu trình chăm sóc cao cấp.",
            "Minibar": "Đồ uống và đồ ăn nhẹ luôn sẵn sàng trong phòng.",
            "Đồ uống": "Nước giải khát, cà phê và thức uống tiện lợi.",
            "Giặt ủi": "Dịch vụ làm sạch quần áo gọn gàng, tiện lợi.",
            "Đồ ăn nhẹ": "Các món ăn nhanh phù hợp dùng mọi thời điểm.",
            "Bể bơi": "Khu vực thư giãn, phù hợp nghỉ dưỡng và giải trí."
        };
        const serviceIcons = {
            "Ăn uống": "fas fa-utensils",
            "Giặt là": "fas fa-soap",
            "Spa": "fas fa-spa",
            "Minibar": "fas fa-wine-bottle",
            "Đồ uống": "fas fa-coffee",
            "Giặt ủi": "fas fa-tshirt",
            "Đồ ăn nhẹ": "fas fa-cookie-bite",
            "Bể bơi": "fas fa-swimmer"
        };

        if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
            serviceTypeListElement.innerHTML = "<div class=\"dashboard-service-empty\">Không có dịch vụ nào để hiển thị.</div>";
            return;
        }

        serviceTypeListElement.innerHTML = serviceTypes.map((item) => {
            const name = item?.name || item?.Name || item?.serviceTypeName || item?.ServiceTypeName || item?.nameService || item?.NameService || "Service";
            const description = fakeDescriptions[name] || "Dịch vụ bổ trợ giúp nâng cao trải nghiệm lưu trú của khách hàng.";
            const iconClass = serviceIcons[name] || "fas fa-concierge-bell";

            return `
                <article class="dashboard-service-card">
                    <div class="dashboard-service-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div>
                        <h3>${name}</h3>
                        <p>${description}</p>
                    </div>
                </article>`;
        }).join("");
    }

    function renderRoomStatusChart(occupiedRooms, availableRooms) {
        const context = donutChartElement.getContext("2d");

        if (roomStatusChart) {
            roomStatusChart.destroy();
        }

        roomStatusChart = new Chart(context, {
            type: "doughnut",
            data: {
                labels: ["Phòng đang thuê", "Phòng trống"],
                datasets: [{
                    data: [occupiedRooms, availableRooms],
                    backgroundColor: ["#4e73df", "#1cc88a"],
                    hoverBackgroundColor: ["#2e59d9", "#17a673"],
                    hoverBorderColor: "rgba(234, 236, 244, 1)"
                }]
            },
            options: {
                maintainAspectRatio: false,
                tooltips: {
                    backgroundColor: "rgb(255,255,255)",
                    bodyFontColor: "#858796",
                    borderColor: "#dddfeb",
                    borderWidth: 1,
                    xPadding: 15,
                    yPadding: 15,
                    displayColors: false,
                    caretPadding: 10,
                    callbacks: {
                        label(tooltipItem, data) {
                            const label = data.labels?.[tooltipItem.index] || "";
                            const value = data.datasets?.[tooltipItem.datasetIndex]?.data?.[tooltipItem.index] || 0;
                            return `${label}: ${formatNumber(value)}`;
                        }
                    }
                },
                legend: {
                    display: false
                },
                cutoutPercentage: 76
            }
        });
    }

    async function loadDashboardSummary() {
        const token = apiClient.getToken();

        if (!token) {
            notifier?.redirectWithNotification("/Auth/Login", "Phiên đăng nhập đã hết hạn.", "warning");
            return;
        }

        try {
            const response = await fetch(dashboardSummaryApiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            const contentType = response.headers.get("content-type") || "";
            const isJson = contentType.includes("application/json");
            const responseData = isJson ? await response.json() : null;

            if (!response.ok) {
                throw new Error(responseData?.message || response.statusText || "Không thể tải dữ liệu dashboard.");
            }

            const summary = getSummaryPayload(responseData);
            const revenue = getRevenue(summary);
            const rooms = getRooms(summary);
            const serviceTypes = getServiceTypes(summary);
            const totalRooms = Number(rooms?.totalRooms ?? rooms?.TotalRooms ?? 0);
            const occupiedRooms = Number(rooms?.occupiedRooms ?? rooms?.OccupiedRooms ?? 0);
            const availableRooms = Math.max(totalRooms - occupiedRooms, 0);
            const stayingGuestCount = Number(summary?.stayingGuestCount ?? summary?.StayingGuestCount ?? 0);
            const occupiedRoomsRatio = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

            revenueThisMonthElement.textContent = formatCurrency(revenue?.revenueThisMonth ?? revenue?.RevenueThisMonth ?? 0);
            totalRevenueElement.textContent = formatCurrency(revenue?.totalRevenue ?? revenue?.TotalRevenue ?? 0);
            stayingGuestCountElement.textContent = formatNumber(stayingGuestCount);
            occupiedRoomsRatioElement.textContent = `${occupiedRoomsRatio}%`;
            occupiedRoomsProgressElement.style.width = `${occupiedRoomsRatio}%`;
            occupiedRoomsProgressElement.setAttribute("aria-valuenow", occupiedRoomsRatio.toString());
            occupiedRoomsProgressElement.setAttribute("title", `${occupiedRooms}/${totalRooms} phòng đang thuê`);

            renderServiceTypes(serviceTypes);
            renderRoomStatusChart(occupiedRooms, availableRooms);
        } catch (error) {
            console.error("Load dashboard summary failed:", error);
            notifier?.error(error?.message || "Không thể tải dữ liệu dashboard.");
        }
    }

    document.addEventListener("DOMContentLoaded", loadDashboardSummary);
})();
