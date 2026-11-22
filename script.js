const SUPABASE_URL = "https://yodtlxkxtynvwcnkenhh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yzxj6bfR3MqckqGnxGV0kg_NjA4vsT_";

document.addEventListener("DOMContentLoaded", () => {
    const yearEl = document.getElementById("year");
    const scrollProgress = document.getElementById("scrollProgress");
    const menuToggle = document.getElementById("menuToggle");
    const navigation = document.getElementById("navigation");
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));

    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    const updateProgress = () => {
        if (!scrollProgress) return;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0;
        scrollProgress.style.width = `${ratio}%`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    if (menuToggle && navigation) {
        menuToggle.addEventListener("click", () => {
            const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!isOpen));
            navigation.classList.toggle("is-open", !isOpen);
        });

        navLinks.forEach((link) => {
            link.addEventListener("click", () => {
                menuToggle.setAttribute("aria-expanded", "false");
                navigation.classList.remove("is-open");
            });
        });
    }

    const hasSupabase = Boolean(SUPABASE_URL.trim() && SUPABASE_ANON_KEY.trim());
    const STORAGE_KEY = "darecraft_user_reports_v4";
    const VOTED_KEY = "darecraft_voted_ids_v4";

    const loadVotedIds = () => {
        try {
            const raw = localStorage.getItem(VOTED_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(arr) ? arr : []);
        } catch {
            return new Set();
        }
    };

    const saveVotedIds = (setObj) => {
        try {
            localStorage.setItem(VOTED_KEY, JSON.stringify(Array.from(setObj)));
        } catch {}
    };

    const votedIds = loadVotedIds();

    const loadLocalReports = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const saveLocalReports = (list) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {}
    };

    let reports = [];
    let currentFilter = "all";
    let activeModalReportId = null;

    const form = document.getElementById("supportReportForm");
    const submitBtn = document.getElementById("submitReportBtn");
    const authorInput = document.getElementById("ticketAuthor");
    const categorySelect = document.getElementById("ticketCategory");
    const versionInput = document.getElementById("bugVersion");
    const platformSelect = document.getElementById("bugPlatform");
    const whatInput = document.getElementById("bugWhatHappened");
    const stepsInput = document.getElementById("bugSteps");
    const previewEl = document.getElementById("reportPreview");
    const feedbackEl = document.getElementById("supportFeedback");
    const fillSampleBtn = document.getElementById("fillSampleBtn");
    const downloadReportBtn = document.getElementById("downloadReportBtn");
    const ticketIdBadge = document.getElementById("ticketIdBadge");
    const communityGrid = document.getElementById("communityGrid");
    const communitySection = document.getElementById("community-bugs");
    const countAllEl = document.getElementById("countAll");
    const filterButtons = Array.from(document.querySelectorAll(".pill-btn"));
    const storageModeNote = document.getElementById("storageModeNote");

    const reportModal = document.getElementById("reportModal");
    const modalClose = document.getElementById("modalClose");
    const modalCode = document.getElementById("modalCode");
    const modalStatus = document.getElementById("modalStatus");
    const modalTitle = document.getElementById("modalTitle");
    const modalAuthor = document.getElementById("modalAuthor");
    const modalVersion = document.getElementById("modalVersion");
    const modalPlatform = document.getElementById("modalPlatform");
    const modalDate = document.getElementById("modalDate");
    const modalDescription = document.getElementById("modalDescription");
    const modalStepsBlock = document.getElementById("modalStepsBlock");
    const modalSteps = document.getElementById("modalSteps");
    const modalCopyBtn = document.getElementById("modalCopyBtn");
    const modalVoteBtn = document.getElementById("modalVoteBtn");
    const modalVotesCount = document.getElementById("modalVotesCount");
    const modalFeedback = document.getElementById("modalFeedback");

    if (storageModeNote) {
        storageModeNote.textContent = hasSupabase
            ? "Подключена общая база Supabase: отчёты видны всем пользователям со всех устройств."
            : "Сейчас работает локальный режим браузера. Укажите SUPABASE_ANON_KEY в script.js, чтобы жалобы видели все игроки.";
    }

    const generateCode = () => `DC-${Math.floor(100 + Math.random() * 900)}`;
    let nextTicketCode = generateCode();
    if (ticketIdBadge) {
        ticketIdBadge.textContent = `#${nextTicketCode}`;
    }

    const formatDate = (isoStr) => {
        if (!isoStr) return "Только что";
        const d = new Date(isoStr);
        if (Number.isNaN(d.getTime())) return "Только что";
        return d.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const buildReportText = () => {
        const author = authorInput?.value.trim() || "Анонимный игрок";
        const category = categorySelect?.value || "Баг в игре";
        const version = versionInput?.value.trim() || "0.1";
        const platform = platformSelect?.value || "ПК (Windows)";
        const what = whatInput?.value.trim() || "(не заполнено)";
        const steps = stepsInput?.value.trim() || "(не указано)";

        return [
            `DareCraft поддержка [${nextTicketCode}]`,
            `Автор: ${author}`,
            `Тип: ${category}`,
            `Версия сборки: ${version}`,
            `Устройство: ${platform}`,
            `Описание: ${what}`,
            `Как повторить: ${steps}`
        ].join("\n");
    };

    const syncPreview = () => {
        if (previewEl) {
            previewEl.textContent = buildReportText();
        }
    };

    const escapeHtml = (str) => String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const sbHeaders = () => ({
        "apikey": SUPABASE_ANON_KEY.trim(),
        "Authorization": `Bearer ${SUPABASE_ANON_KEY.trim()}`,
        "Content-Type": "application/json"
    });

    const fetchReportsFromSupabase = async () => {
        const baseUrl = SUPABASE_URL.trim().replace(/\/+$/, "");
        const res = await fetch(`${baseUrl}/rest/v1/reports?select=*&order=created_at.desc`, {
            headers: sbHeaders()
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const rows = await res.json();
        return Array.isArray(rows) ? rows : [];
    };

    const insertReportToSupabase = async (reportObj) => {
        const baseUrl = SUPABASE_URL.trim().replace(/\/+$/, "");
        const res = await fetch(`${baseUrl}/rest/v1/reports`, {
            method: "POST",
            headers: {
                ...sbHeaders(),
                "Prefer": "return=representation"
            },
            body: JSON.stringify([{
                id: reportObj.id,
                author: reportObj.author,
                category: reportObj.category,
                version: reportObj.version,
                platform: reportObj.platform,
                description: reportObj.description,
                steps: reportObj.steps,
                status: reportObj.status,
                votes: reportObj.votes
            }])
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        return Array.isArray(data) && data[0] ? data[0] : reportObj;
    };

    const updateVotesInSupabase = async (id, nextVotes) => {
        const baseUrl = SUPABASE_URL.trim().replace(/\/+$/, "");
        const res = await fetch(`${baseUrl}/rest/v1/reports?id=eq.${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: {
                ...sbHeaders(),
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ votes: nextVotes })
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
    };

    const handleUpvote = async (item) => {
        if (!item || votedIds.has(item.id)) return;
        votedIds.add(item.id);
        saveVotedIds(votedIds);
        const nextVotes = (Number(item.votes) || 1) + 1;
        item.votes = nextVotes;

        if (!hasSupabase) {
            saveLocalReports(reports);
        } else {
            try {
                await updateVotesInSupabase(item.id, nextVotes);
            } catch {}
        }

        renderCommunityReports();
        if (activeModalReportId === item.id) {
            openReportModal(item.id);
        }
    };

    const formatFullReportForCopy = (item) => [
        `DareCraft поддержка [#${item.id}]`,
        `Статус: ${item.status || "Новое обращение"}`,
        `Тип: ${item.category}`,
        `Автор: ${item.author}`,
        `Версия: v${item.version}`,
        `Устройство: ${item.platform}`,
        `Дата: ${formatDate(item.created_at)}`,
        `Описание: ${item.description}`,
        `Как повторить: ${item.steps || "Не указано"}`,
        `Подтверждений: ${Number(item.votes) || 1}`
    ].join("\n");

    const openReportModal = (reportId) => {
        const item = reports.find((r) => r.id === reportId);
        if (!item || !reportModal) return;

        activeModalReportId = item.id;
        if (modalCode) modalCode.textContent = `#${item.id} · ${item.category}`;
        if (modalStatus) modalStatus.textContent = item.status || "Новое обращение";
        if (modalTitle) modalTitle.textContent = `Обращение #${item.id} от ${item.author}`;
        if (modalAuthor) modalAuthor.textContent = item.author;
        if (modalVersion) modalVersion.textContent = `v${item.version}`;
        if (modalPlatform) modalPlatform.textContent = item.platform;
        if (modalDate) modalDate.textContent = formatDate(item.created_at);
        if (modalDescription) modalDescription.textContent = item.description;

        if (modalStepsBlock && modalSteps) {
            if (item.steps && item.steps.trim()) {
                modalStepsBlock.style.display = "flex";
                modalSteps.textContent = item.steps;
            } else {
                modalStepsBlock.style.display = "none";
            }
        }

        if (modalVotesCount) {
            modalVotesCount.textContent = String(Number(item.votes) || 1);
        }
        if (modalVoteBtn) {
            modalVoteBtn.classList.toggle("is-voted", votedIds.has(item.id));
        }
        if (modalFeedback) {
            modalFeedback.textContent = "";
        }

        reportModal.classList.add("is-open");
        reportModal.setAttribute("aria-hidden", "false");
    };

    const closeReportModal = () => {
        if (!reportModal) return;
        reportModal.classList.remove("is-open");
        reportModal.setAttribute("aria-hidden", "true");
        activeModalReportId = null;
    };

    modalClose?.addEventListener("click", closeReportModal);
    reportModal?.addEventListener("click", (e) => {
        if (e.target === reportModal) {
            closeReportModal();
        }
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeReportModal();
        }
    });

    modalVoteBtn?.addEventListener("click", () => {
        if (!activeModalReportId) return;
        const item = reports.find((r) => r.id === activeModalReportId);
        if (item) {
            handleUpvote(item);
        }
    });

    modalCopyBtn?.addEventListener("click", async () => {
        if (!activeModalReportId) return;
        const item = reports.find((r) => r.id === activeModalReportId);
        if (!item) return;
        const text = formatFullReportForCopy(item);
        try {
            await navigator.clipboard.writeText(text);
            if (modalFeedback) modalFeedback.textContent = "Текст жалобы скопирован в буфер обмена!";
        } catch {
            if (modalFeedback) modalFeedback.textContent = "Не удалось скопировать автоматически — выделите текст вручную.";
        }
    });

    const renderCommunityReports = () => {
        if (!communityGrid) return;
        if (countAllEl) {
            countAllEl.textContent = String(reports.length);
        }

        const filtered = currentFilter === "all"
            ? reports
            : reports.filter((item) => item.category === currentFilter);

        communityGrid.innerHTML = "";

        if (filtered.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = currentFilter === "all"
                ? "Пока нет отправленных обращений. Заполните форму выше и нажмите «Отправить»."
                : `В категории «${currentFilter}» пока нет отправленных обращений.`;
            communityGrid.appendChild(empty);
            return;
        }

        filtered.forEach((item) => {
            const card = document.createElement("article");
            card.className = `bug-report-card${item.isNew ? " is-new" : ""}`;

            const stepsBlock = item.steps && item.steps.trim()
                ? `<div class="bug-card-steps"><strong>Как повторить:</strong> ${escapeHtml(item.steps)}</div>`
                : "";

            const isVoted = votedIds.has(item.id);

            card.innerHTML = `
                <div class="bug-card-top">
                    <span class="bug-code">#${escapeHtml(item.id)} · ${escapeHtml(item.category)}</span>
                    <span class="bug-status-pill">${escapeHtml(item.status || "Новое обращение")}</span>
                </div>
                <p class="bug-card-title">${escapeHtml(item.description)}</p>
                ${stepsBlock}
                <div class="bug-card-actions-row">
                    <button type="button" class="details-link-btn">Подробнее →</button>
                </div>
                <div class="bug-card-footer">
                    <span>${escapeHtml(item.author)} · v${escapeHtml(item.version)} · ${escapeHtml(item.platform)}</span>
                    <button type="button" class="upvote-btn${isVoted ? " is-voted" : ""}" aria-label="Подтвердить">
                        ▲ <span>${Number(item.votes) || 1}</span>
                    </button>
                </div>
            `;

            card.addEventListener("click", (e) => {
                if (e.target.closest(".upvote-btn")) return;
                openReportModal(item.id);
            });

            const voteBtn = card.querySelector(".upvote-btn");
            voteBtn?.addEventListener("click", (e) => {
                e.stopPropagation();
                handleUpvote(item);
            });

            communityGrid.appendChild(card);
        });
    };

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            currentFilter = btn.dataset.filter || "all";
            filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
            renderCommunityReports();
        });
    });

    [authorInput, categorySelect, versionInput, platformSelect, whatInput, stepsInput].forEach((el) => {
        el?.addEventListener("input", syncPreview);
        el?.addEventListener("change", syncPreview);
    });

    fillSampleBtn?.addEventListener("click", () => {
        if (categorySelect) categorySelect.value = "Баг в игре";
        if (versionInput) versionInput.value = "0.1";
        if (whatInput) whatInput.value = "Ошибка в текстурах: некоторые блоки становятся прозрачными при входе в мир.";
        if (stepsInput) stepsInput.value = "Зайти в мир и посмотреть на границу чанка.";
        syncPreview();
        if (feedbackEl) {
            feedbackEl.textContent = "Пример подставлен — нажмите «Отправить», чтобы добавить обращение.";
        }
    });

    downloadReportBtn?.addEventListener("click", () => {
        const text = buildReportText();
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `DareCraft-Support-${nextTicketCode}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        if (feedbackEl) {
            feedbackEl.textContent = `Файл DareCraft-Support-${nextTicketCode}.txt сохранён!`;
        }
    });

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const descriptionText = whatInput?.value.trim() || "";
        if (!descriptionText) {
            if (feedbackEl) {
                feedbackEl.textContent = "Пожалуйста, опишите проблему или идею перед отправкой.";
            }
            whatInput?.focus();
            return;
        }

        const newReport = {
            id: nextTicketCode,
            author: authorInput?.value.trim() || "Анонимный игрок",
            category: categorySelect?.value || "Баг в игре",
            version: versionInput?.value.trim() || "0.1",
            platform: platformSelect?.value || "ПК (Windows)",
            description: descriptionText,
            steps: stepsInput?.value.trim() || "",
            status: "Новое обращение",
            votes: 1,
            created_at: new Date().toISOString(),
            isNew: true
        };

        if (submitBtn) submitBtn.disabled = true;

        try {
            let savedItem = newReport;
            if (hasSupabase) {
                savedItem = { ...(await insertReportToSupabase(newReport)), isNew: true };
                votedIds.add(savedItem.id);
                saveVotedIds(votedIds);
            } else {
                votedIds.add(newReport.id);
                saveVotedIds(votedIds);
            }

            reports.forEach((r) => { r.isNew = false; });
            reports.unshift(savedItem);

            if (!hasSupabase) {
                saveLocalReports(reports);
            }

            currentFilter = "all";
            filterButtons.forEach((b) => b.classList.toggle("active", b.dataset.filter === "all"));
            renderCommunityReports();

            if (feedbackEl) {
                feedbackEl.textContent = `Обращение #${savedItem.id} отправлено! Нажмите на карточку, чтобы открыть подробно.`;
            }

            if (whatInput) whatInput.value = "";
            if (stepsInput) stepsInput.value = "";
            nextTicketCode = generateCode();
            if (ticketIdBadge) ticketIdBadge.textContent = `#${nextTicketCode}`;
            syncPreview();

            communitySection?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (err) {
            if (feedbackEl) {
                feedbackEl.textContent = `Ошибка отправки в Supabase (${err.message}). Проверьте URL, ключ и политики RLS таблицы reports.`;
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    const initReports = async () => {
        if (hasSupabase) {
            try {
                reports = await fetchReportsFromSupabase();
            } catch (err) {
                reports = loadLocalReports();
                if (feedbackEl) {
                    feedbackEl.textContent = `Не удалось загрузить общую базу (${err.message}). Показаны локальные записи.`;
                }
            }
        } else {
            reports = loadLocalReports();
        }
        renderCommunityReports();
    };

    syncPreview();
    initReports();
});
