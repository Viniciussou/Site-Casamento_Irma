// Wedding Invite JavaScript - Completo com Tela de Presentes 🎁
class WeddingInvite {
    constructor() {
        this.currentScreen = 'welcome';
        this.rsvpData = [];
        this.isEnvelopeOpen = false;
        this.isSubmitting = false;
        this.backendUrl = '/api/rsvp';
        this.giftUrl = '/api/gifts';
        this.selectedGift = null;

        // Elementos de música
        this.backgroundMusic = document.getElementById('backgroundMusic');
        this.musicToggleBtn = document.getElementById('musicToggleBtn');
        this.musicProgressBar = document.getElementById('musicProgressBar');
        this.musicControl = document.getElementById('musicControl');
        this.isMusicPlaying = false;
        this.musicEnded = false;

        // Feedback
        this.successFeedbackOverlay = document.getElementById('successFeedback');
        this.feedbackTitle = document.getElementById('feedbackTitle');
        this.feedbackMessage = document.getElementById('feedbackMessage');
        this.successImage = document.getElementById('successImage');
        this.sadImage = document.getElementById('sadImage');
        this.closeFeedbackBtn = document.getElementById('closeFeedback');
        this.successSound = document.getElementById('successSound');
        this.failSound = document.getElementById('failSound');

        this.init();
    }

    init() {
        this.hideLoadingScreen();
        this.attachEventListeners();
        this.loadRSVPDataFromBackend();
        this.updateAdminStats();
        this.setupMusicPlayer();
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 500);
        }, 1500);
    }

    attachEventListeners() {
        document.getElementById('openEnvelope')?.addEventListener('click', () => this.openEnvelope());
        document.getElementById('backToWelcome')?.addEventListener('click', () => this.navigateToScreen('welcome'));
        document.getElementById('nextToRules')?.addEventListener('click', () => this.navigateToScreen('rules'));
        document.getElementById('openMaps')?.addEventListener('click', () => this.openMaps());
        document.getElementById('backToInfo')?.addEventListener('click', () => this.navigateToScreen('info'));
        document.getElementById('backToInfoFromRules')?.addEventListener('click', () => this.navigateToScreen('info'));
        document.getElementById("nextToGift")?.addEventListener("click", () => this.navigateToScreen("gift"));
        document.getElementById("nextToRSVP")?.addEventListener("click", () => this.navigateToScreen("rsvp"));
        document.getElementById("backToRulesFromGift")?.addEventListener("click", () => this.navigateToScreen("rules"));
        document.getElementById('adminAccess')?.addEventListener('click', () => {
            this.navigateToScreen('admin');
            this.loadRSVPDataFromBackend();
        });
        document.getElementById('rsvpForm')?.addEventListener('submit', (e) => this.handleRSVPSubmit(e));
        document.getElementById('exitAdmin')?.addEventListener('click', () => this.navigateToScreen('rsvp'));
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());
        this.closeFeedbackBtn?.addEventListener('click', () => this.hideFeedbackOverlay());

        // 🎁 Eventos da Tela de Presentes
        document.getElementById("confirmGift")?.addEventListener("click", () => this.confirmGiftSelection());
        document.getElementById("backToRSVP")?.addEventListener("click", () => this.navigateToScreen("rsvp"));
    }

    setupMusicPlayer() {
        this.musicToggleBtn?.addEventListener('click', () => this.toggleMusic());
        this.backgroundMusic?.addEventListener('timeupdate', () => this.updateMusicProgress());
        this.backgroundMusic?.addEventListener('ended', () => {
            this.isMusicPlaying = false;
            this.musicToggleBtn && (this.musicToggleBtn.innerHTML = '<i class="fas fa-play"></i>');
            this.musicProgressBar && (this.musicProgressBar.style.width = '0%');
        });
    }

    toggleMusic() {
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play().then(() => {
                this.isMusicPlaying = true;
                this.musicToggleBtn && (this.musicToggleBtn.innerHTML = '<i class="fas fa-pause"></i>');
            }).catch(() => this.showToast('Clique em play para iniciar a música.', 'error'));
        } else {
            this.backgroundMusic.pause();
            this.isMusicPlaying = false;
            this.musicToggleBtn && (this.musicToggleBtn.innerHTML = '<i class="fas fa-play"></i>');
        }
    }

    updateMusicProgress() {
        if (this.backgroundMusic.duration) {
            const progress = (this.backgroundMusic.currentTime / this.backgroundMusic.duration) * 100;
            this.musicProgressBar && (this.musicProgressBar.style.width = `${progress}%`);
        }
    }

    openEnvelope() {
        const envelope = document.getElementById('envelope');
        if (this.isEnvelopeOpen) return this.navigateToScreen('info');
        this.isEnvelopeOpen = true;
        envelope.classList.add('opening');

        setTimeout(() => {
            this.navigateToScreen('info');
            if (!this.isMusicPlaying && !this.musicEnded) {
                this.backgroundMusic.play().then(() => {
                    this.isMusicPlaying = true;
                    this.musicToggleBtn && (this.musicToggleBtn.innerHTML = '<i class="fas fa-pause"></i>');
                    if (this.musicControl) this.musicControl.style.display = 'flex';
                }).catch(() => {
                    console.warn('Clique em play para iniciar a música.');
                });
            }
        }, 2000);
    }

    navigateToScreen(screenName) {
        const currentScreenEl = document.querySelector('.screen.active');
        const targetScreenEl = document.getElementById(`${screenName}Screen`);
        if (!targetScreenEl) return;
        if (currentScreenEl) {
            currentScreenEl.classList.remove('active');
            currentScreenEl.classList.add('exiting');
        }

        setTimeout(() => {
            targetScreenEl.classList.add('active');
            this.currentScreen = screenName;
            if (screenName === 'gift') this.loadGifts();
        }, 300);
    }

    async handleRSVPSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) return;

        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name').trim(),
            age: formData.get('age') ? parseInt(formData.get('age')) : null,
            contact: formData.get('contact').trim(),
            attending: formData.get('attending') === 'sim',
            message: formData.get('message').trim()
        };

        if (!data.name || !data.contact || !formData.get('attending')) {
            this.showToast('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        this.isSubmitting = true;
        this.updateSubmitButton(true);

        try {
            const response = await fetch(this.backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Erro ao enviar confirmação.');
            this.showFeedbackOverlay(true, data.attending);
            e.target.reset();
        } catch (error) {
            this.showFeedbackOverlay(false, false);
            this.showToast(error.message || 'Erro ao enviar confirmação.', 'error');
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton(false);
        }
    }

    updateSubmitButton(isSubmitting) {
        const button = document.getElementById('submitRSVP');
        const text = button?.querySelector('.btn-text');
        const spinner = button?.querySelector('.loading-spinner');
        if (!button || !text || !spinner) return;
        if (isSubmitting) {
            text.style.display = 'none';
            spinner.style.display = 'block';
            button.disabled = true;
        } else {
            text.style.display = 'block';
            spinner.style.display = 'none';
            button.disabled = false;
        }
    }

    openMaps() {
        const address = "R. Benedito Rodrigues de Freitas, 84 - Vila Rachid, Guarulhos - SP";
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(url, '_blank');
    }

    showFeedbackOverlay(isSuccess, attendingStatus) {
        this.successFeedbackOverlay.classList.add('active');
        this.successFeedbackOverlay.style.display = 'flex';
        if (isSuccess) {
            if (attendingStatus) {
                this.feedbackTitle.textContent = "Presença Confirmada! 🎉";
                this.feedbackMessage.textContent = "Mal podemos esperar para celebrar com você!";
                this.successSound?.play();
            } else {
                this.feedbackTitle.textContent = "Que pena! 😔";
                this.feedbackMessage.textContent = "Sentiremos sua falta em nosso grande dia.";
                this.failSound?.play();
            }
        } else {
            this.feedbackTitle.textContent = "Ops! Algo deu errado. 😟";
            this.feedbackMessage.textContent = "Não foi possível enviar sua confirmação.";
            this.failSound?.play();
        }
    }

    hideFeedbackOverlay() {
        this.successFeedbackOverlay.classList.remove('active');
        setTimeout(() => {
            this.successFeedbackOverlay.style.display = 'none';
        }, 500);
    }

    async loadRSVPDataFromBackend() {
        try {
            const [rsvpRes, giftRes] = await Promise.all([
                fetch(this.backendUrl),
                fetch(this.giftUrl)
            ]);

            this.rsvpData = (await rsvpRes.json()).map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
            this.giftData = await giftRes.json();

            this.updateAdminStats();
            this.renderRSVPTable();
            this.renderGiftTable(this.giftData);
        } catch {
            this.showToast('Erro ao carregar dados do admin', 'error');
        }
    }

    updateAdminStats() {
        document.getElementById('totalResponses').textContent = this.rsvpData.length;
        document.getElementById('confirmedCount').textContent = this.rsvpData.filter(r => r.attending).length;
        document.getElementById('declinedCount').textContent = this.rsvpData.filter(r => !r.attending).length;
    }

    renderRSVPTable() {
        const tbody = document.getElementById('rsvpTableBody');
        if (!tbody) return;
        if (this.rsvpData.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6'>Nenhuma confirmação ainda</td></tr>";
            return;
        }
        tbody.innerHTML = this.rsvpData.map(rsvp => `
            <tr>
                <td>${rsvp.name}</td>
                <td>${rsvp.age || '-'}</td>
                <td>${rsvp.contact}</td>
                <td>${rsvp.attending ? 'Confirmado' : 'Não comparece'}</td>
                <td>${rsvp.message || '-'}</td>
                <td>${new Date(rsvp.createdAt).toLocaleDateString('pt-BR')}</td>
            </tr>`).join('');
    }

    renderGiftTable(gifts) {
        const section = document.getElementById("giftAdminSection");
        if (!section) return;
        section.innerHTML = `
            <h3>🎁 Presentes Escolhidos</h3>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Nome</th><th>E-mail</th><th>Item</th><th>Cor</th><th>Data</th>
                </tr>
              </thead>
              <tbody>
              ${gifts.flatMap(g =>
            (g.takenBy || []).map(t => `
                    <tr>
                      <td>${t.name}</td>
                      <td>${t.email}</td>
                      <td>${g.name}</td>
                      <td>${t.color}</td>
                      <td>${new Date(t.date).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  `)
        ).join("") || "<tr><td colspan='5'>Nenhum presente escolhido ainda</td></tr>"
            }
              </tbody>
            </table>`;
    }

    // 🎁 Sistema de Presentes
    async loadGifts() {
        try {
            const res = await fetch(this.giftUrl);
            const gifts = await res.json();
            this.renderGiftList(gifts);
        } catch {
            this.showToast("Erro ao carregar presentes", "error");
        }
    }

    renderGiftList(gifts) {
        const giftList = document.getElementById("giftList");
        giftList.innerHTML = "";

        gifts.forEach(g => {
            const div = document.createElement("div");
            div.className = `gift-item ${g.available === 0 ? "disabled" : ""}`;
            div.innerHTML = `
                <strong>${g.name}</strong>
                <p>${g.available > 0 ? `${g.available} disponível(is)` : "Esgotado"}</p>
                <div class="gift-actions">
                    <button class="btn-amazon" onclick="window.open('${g.amazon}', '_blank')">Ver na Amazon</button>
                    <button class="btn-secondary selectGiftBtn" ${g.available === 0 ? "disabled" : ""}>Selecionar</button>
                </div>
            `;
            div.querySelector(".selectGiftBtn")?.addEventListener("click", () => {
                document.querySelectorAll(".gift-item").forEach(i => i.classList.remove("selected"));
                div.classList.add("selected");
                this.selectedGift = g.name;
            });
            giftList.appendChild(div);
        });
    }

    async confirmGiftSelection() {
        const name = document.getElementById("giftName").value.trim();
        const email = document.getElementById("giftEmail").value.trim();
        const color = document.getElementById("giftColor").value;
        const item = this.selectedGift;

        if (!name || !email || !item) {
            return this.showToast("Preencha seu nome, e-mail e selecione um presente.", "error");
        }

        const response = await fetch(this.giftUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, color, item }),
        });

        const result = await response.json();
        this.showToast(result.message, response.ok ? "success" : "error");
        if (response.ok) this.loadGifts();
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer') || (() => {
            const div = document.createElement('div');
            div.id = 'toastContainer';
            div.style.position = 'fixed';
            div.style.bottom = '20px';
            div.style.right = '20px';
            div.style.zIndex = '9999';
            document.body.appendChild(div);
            return div;
        })();

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.background = type === 'success' ? '#22c55e' : '#ef4444';
        toast.style.color = '#fff';
        toast.style.padding = '10px 15px';
        toast.style.marginTop = '10px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
        toast.style.transition = 'all 0.5s ease';
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
}

window.addEventListener('DOMContentLoaded', () => new WeddingInvite());
