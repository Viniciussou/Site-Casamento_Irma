// Wedding Invite JavaScript - Pure Vanilla JS
class WeddingInvite {
    constructor() {
        this.currentScreen = 'welcome';
        this.rsvpData = [];
        this.isEnvelopeOpen = false;
        this.isSubmitting = false;
        this.backendUrl = '/api/rsvp';
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
            if (!loadingScreen) return;
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 500);
        }, 1500);
    }

    attachEventListeners() {
        document.getElementById('openEnvelope')?.addEventListener('click', () => this.openEnvelope());
        document.getElementById('backToWelcome')?.addEventListener('click', () => this.navigateToScreen('welcome'));
        document.getElementById('nextToRules')?.addEventListener('click', () => this.navigateToScreen('gift'));
        document.getElementById('openMaps')?.addEventListener('click', () => this.openMaps());
        document.getElementById('backToInfo')?.addEventListener('click', () => this.navigateToScreen('info'));
        document.getElementById('backToInfoFromRules')?.addEventListener('click', () => this.navigateToScreen('info'));
        document.getElementById('nextToRSVP')?.addEventListener('click', () => this.navigateToScreen('rsvp'));
        document.getElementById('backToRules')?.addEventListener('click', () => this.navigateToScreen('rules'));
        document.getElementById('backToRulesFromRSVP')?.addEventListener('click', () => this.navigateToScreen('rules'));
        document.getElementById('adminAccess')?.addEventListener('click', () => {
            this.navigateToScreen('admin');
            this.loadRSVPDataFromBackend();
        });
        document.getElementById('rsvpForm')?.addEventListener('submit', (e) => this.handleRSVPSubmit(e));
        document.getElementById('exitAdmin')?.addEventListener('click', () => this.navigateToScreen('rsvp'));
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());
        this.closeFeedbackBtn?.addEventListener('click', () => this.hideFeedbackOverlay());
        document.getElementById("confirmGift")?.addEventListener("click", () => this.confirmGiftSelection());
        document.getElementById("backToRSVP")?.addEventListener("click", () => this.navigateToScreen("rsvp"));
    }

    setupMusicPlayer() {
        this.musicToggleBtn?.addEventListener('click', () => this.toggleMusic());
        this.backgroundMusic?.addEventListener('timeupdate', () => this.updateMusicProgress());
        this.backgroundMusic?.addEventListener('ended', () => {
            this.isMusicPlaying = false;
            if (this.musicToggleBtn) this.musicToggleBtn.innerHTML = '<i class="fas fa-play"></i>';
            if (this.musicProgressBar) this.musicProgressBar.style.width = '0%';
        });
    }

    toggleMusic() {
        if (!this.backgroundMusic) return;
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play().then(() => {
                this.isMusicPlaying = true;
                if (this.musicToggleBtn) this.musicToggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }).catch(() => this.showToast('Clique em play para iniciar a música.', 'error'));
        } else {
            this.backgroundMusic.pause();
            this.isMusicPlaying = false;
            if (this.musicToggleBtn) this.musicToggleBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    updateMusicProgress() {
        if (this.backgroundMusic?.duration) {
            const progress = (this.backgroundMusic.currentTime / this.backgroundMusic.duration) * 100;
            if (this.musicProgressBar) this.musicProgressBar.style.width = `${progress}%`;
        }
    }

    openEnvelope() {
        const envelope = document.getElementById('envelope');
        if (!envelope) return;
        if (this.isEnvelopeOpen) return this.navigateToScreen('info');
        this.isEnvelopeOpen = true;
        envelope.classList.add('opening');

        setTimeout(() => {
            this.navigateToScreen('info');
            if (!this.isMusicPlaying && !this.musicEnded) {
                this.backgroundMusic?.play().then(() => {
                    this.isMusicPlaying = true;
                    if (this.musicToggleBtn) this.musicToggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    if (this.musicControl) this.musicControl.style.display = 'flex';
                }).catch(() => console.warn('Clique em play para iniciar a música.'));
            }
        }, 2000);
    }

    navigateToScreen(screenName) {
        const currentScreenEl = document.querySelector('.screen.active');
        const targetScreenEl = document.getElementById(`${screenName}Screen`);
        if (!targetScreenEl) return console.warn(`Tela "${screenName}Screen" não encontrada.`);

        if (currentScreenEl === targetScreenEl) return;
        if (currentScreenEl) {
            currentScreenEl.classList.add('exiting');
            currentScreenEl.classList.remove('active');
        }

        setTimeout(() => {
            targetScreenEl.classList.add('active');
            this.currentScreen = screenName;

            if (screenName === 'info' && this.musicControl) {
                this.musicControl.style.display = 'flex';
            } else if (this.musicControl) {
                this.musicControl.style.display = 'none';
            }

            if (currentScreenEl) setTimeout(() => currentScreenEl.classList.remove('exiting'), 100);
            this.animateScreenEntrance(screenName);
        }, 300);

        if (screenName === 'gift') this.loadGifts(); // Auto carregar lista ao abrir tela de presentes
    }

    animateScreenEntrance(screenName) {
        const screen = document.getElementById(`${screenName}Screen`);
        if (!screen) return;
        const elements = screen.querySelectorAll('.info-card, .rule-item, .rsvp-form-container, .stat-card');
        elements.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            setTimeout(() => {
                el.style.transition = 'all 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 100 + 200);
        });
    }

    async handleRSVPSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) return;

        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name')?.trim(),
            age: formData.get('age') ? parseInt(formData.get('age')) : null,
            contact: formData.get('contact')?.trim(),
            attending: formData.get('attending') === 'sim',
            message: formData.get('message')?.trim() || ""
        };

        if (!data.name || !data.contact || !formData.get('attending')) {
            this.showToast('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\d\s\-\(\)]+$/;
        if (!emailRegex.test(data.contact) && !phoneRegex.test(data.contact)) {
            this.showToast('Insira um email ou telefone válido', 'error');
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

            if (this.isMusicPlaying) {
                this.backgroundMusic.pause();
                this.isMusicPlaying = false;
                this.musicEnded = true;
                if (this.musicControl) this.musicControl.style.display = 'none';
            }

            this.showFeedbackOverlay(true, data.attending);
            e.target.reset();
        } catch (error) {
            console.error(error);
            this.showFeedbackOverlay(false, false);
            this.showToast(error.message || 'Erro ao enviar confirmação.', 'error');
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton(false);
        }
    }

    updateSubmitButton(isSubmitting) {
        const button = document.getElementById('submitRSVP');
        if (!button) return;
        const text = button.querySelector('.btn-text');
        const spinner = button.querySelector('.loading-spinner');
        if (isSubmitting) {
            text.style.display = 'none';
            spinner.style.display = 'block';
            button.disabled = true;
            button.style.opacity = '0.7';
        } else {
            text.style.display = 'block';
            spinner.style.display = 'none';
            button.disabled = false;
            button.style.opacity = '1';
        }
    }

    openMaps() {
        const address = "R. Benedito Rodrigues de Freitas, 84 - Vila Rachid, Guarulhos - SP";
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }

    showFeedbackOverlay(isSuccess, attendingStatus) {
        if (!this.successFeedbackOverlay) return;
        this.successFeedbackOverlay.classList.add('active');
        this.successFeedbackOverlay.style.display = 'flex';

        if (isSuccess) {
            if (attendingStatus) {
                this.feedbackTitle.textContent = "Presença Confirmada! 🎉";
                this.feedbackMessage.textContent = "Mal podemos esperar para celebrar com você!";
                this.successImage.style.display = 'block';
                this.sadImage.style.display = 'none';
                this.successSound?.play();
            } else {
                this.feedbackTitle.textContent = "Que pena! 😔";
                this.feedbackMessage.textContent = "Sentiremos sua falta em nosso grande dia.";
                this.successImage.style.display = 'none';
                this.sadImage.style.display = 'block';
                this.failSound?.play();
            }
        } else {
            this.feedbackTitle.textContent = "Ops! Algo deu errado. 😟";
            this.feedbackMessage.textContent = "Não foi possível enviar sua confirmação.";
            this.successImage.style.display = 'none';
            this.sadImage.style.display = 'block';
            this.failSound?.play();
        }
    }

    hideFeedbackOverlay() {
        if (!this.successFeedbackOverlay) return;
        this.successFeedbackOverlay.classList.remove('active');
        setTimeout(() => {
            this.successFeedbackOverlay.style.display = 'none';
            this.successImage.style.display = 'none';
            this.sadImage.style.display = 'none';
        }, 500);
        this.successSound && (this.successSound.pause(), this.successSound.currentTime = 0);
        this.failSound && (this.failSound.pause(), this.failSound.currentTime = 0);
    }

    async loadRSVPDataFromBackend() {
        try {
            const response = await fetch(this.backendUrl);
            if (!response.ok) throw new Error('Erro ao carregar dados do RSVP.');
            this.rsvpData = (await response.json()).map(item => ({ ...item, createdAt: new Date(item.createdAt) }));
            this.updateAdminStats();
            this.renderRSVPTable();

            const giftResponse = await fetch("/api/gifts");
            const gifts = await giftResponse.json();
            this.renderGiftTable(gifts);
        } catch (error) {
            console.error(error);
            this.showToast('Erro ao carregar dados do admin.', 'error');
        }
    }

    exportCSV() {
        const headers = ['Nome', 'Idade', 'Contato', 'Comparece', 'Mensagem', 'Data'];
        const csvContent = [
            headers.join(','),
            ...this.rsvpData.map(rsvp => [
                `"${rsvp.name}"`,
                rsvp.age || '',
                `"${rsvp.contact}"`,
                rsvp.attending ? 'Sim' : 'Não',
                rsvp.message ? `"${rsvp.message.replace(/"/g, '""')}"` : '',
                new Date(rsvp.createdAt).toLocaleDateString('pt-BR')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'confirmacoes-casamento.csv';
        link.click();
        window.URL.revokeObjectURL(url);
        this.showToast('CSV exportado com sucesso!', 'success');
    }

    updateAdminStats() {
        const total = document.getElementById('totalResponses');
        const confirmed = document.getElementById('confirmedCount');
        const declined = document.getElementById('declinedCount');
        const people = document.getElementById('totalPeople');
        if (!total || !confirmed || !declined || !people) return;

        total.textContent = this.rsvpData.length;
        confirmed.textContent = this.rsvpData.filter(r => r.attending).length;
        declined.textContent = this.rsvpData.filter(r => !r.attending).length;
        people.textContent = this.rsvpData.length;
    }

    renderRSVPTable() {
        const tbody = document.getElementById('rsvpTableBody');
        if (!tbody) return;

        if (this.rsvpData.length === 0) {
            tbody.innerHTML = `<tr class="no-data"><td colspan="6">
                <div class="no-data-content">
                    <i class="fas fa-users"></i>
                    <h4>Nenhuma confirmação recebida ainda</h4>
                    <p>As confirmações aparecerão aqui quando os convidados responderem</p>
                </div>
            </td></tr>`;
            return;
        }

        tbody.innerHTML = this.rsvpData.map((rsvp, i) => `
            <tr style="animation: fadeInUp 0.5s ease-out ${i * 0.1}s both;">
                <td>${rsvp.name}</td>
                <td>${rsvp.age || '-'}</td>
                <td>${rsvp.contact}</td>
                <td><span class="status-badge ${rsvp.attending ? 'confirmed' : 'declined'}">
                    ${rsvp.attending ? 'Confirmado' : 'Não comparece'}</span></td>
                <td>${rsvp.message || '-'}</td>
                <td>${new Date(rsvp.createdAt).toLocaleDateString('pt-BR')}</td>
            </tr>
        `).join('');
    }

    renderGiftTable(gifts) {
        const giftSection = document.getElementById("giftAdminSection");
        if (!giftSection) return;
        giftSection.innerHTML = `
            <h3>🎁 Presentes Escolhidos</h3>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Item</th>
                        <th>Cor</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    ${gifts.length === 0
                ? "<tr><td colspan='5'>Nenhum presente escolhido ainda</td></tr>"
                : gifts.map(g =>
                    g.takenBy.map(t => `
                                <tr>
                                    <td>${t.name}</td>
                                    <td>${t.email}</td>
                                    <td>${g.name}</td>
                                    <td>${t.color}</td>
                                    <td>${new Date(t.date).toLocaleDateString("pt-BR")}</td>
                                </tr>
                            `).join("")
                ).join("")
            }
                </tbody>
            </table>
        `;
    }

    async loadGifts() {
        try {
            const response = await fetch("/api/gifts");
            const gifts = await response.json();
            this.renderGiftList(gifts);
        } catch {
            this.showToast("Erro ao carregar lista de presentes", "error");
        }
    }

    renderGiftList(gifts) {
        const giftList = document.getElementById("giftList");
        if (!giftList) return;
        giftList.innerHTML = "";

        gifts.forEach(g => {
            const div = document.createElement("div");
            div.className = `gift-item ${g.available === 0 ? "disabled" : ""}`;
            div.innerHTML = `
                <strong>${g.name}</strong>
                <p>${g.available > 1 ? `${g.available} disponíveis` : g.available === 1 ? "1 disponível" : "Esgotado"}</p>
                <div class="gift-actions">
                    <button class="btn-amazon" onclick="window.open('${g.amazon}', '_blank')">
                        Ver na Amazon
                    </button>
                    <button class="btn-secondary selectGiftBtn" ${g.available === 0 ? "disabled" : ""}>
                        Selecionar
                    </button>
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
        const name = document.getElementById("giftName")?.value.trim();
        const email = document.getElementById("giftEmail")?.value.trim();
        const color = document.getElementById("giftColor")?.value;
        const item = this.selectedGift;

        if (!name || !email || !item) {
            return this.showToast("Preencha seu nome, e-mail e selecione um presente.", "error");
        }

        try {
            const response = await fetch("/api/gifts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, color, item }),
            });

            const result = await response.json();
            this.showToast(result.message, response.ok ? "success" : "error");
            if (response.ok) this.loadGifts();
        } catch (err) {
            this.showToast("Erro ao registrar presente.", "error");
        }
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i></div>
            <div class="toast-message">${message}</div>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 400);
        }, 4000);
    }
}

// Enhanced animations and interactions
class AnimationManager {
    constructor() {
        this.init();
    }

    init() {
        this.addFloatingElements();
        this.addScrollAnimations();
        this.addHoverEffects();
        this.addPageTransitions();
    }

    addFloatingElements() {
        // Add floating hearts on welcome screen
        const createFloatingHeart = () => {
            const heart = document.createElement('div');
            heart.innerHTML = '♥';
            heart.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}%;
                top: 100%;
                color: var(--primary-gold);
                font-size: ${Math.random() * 1 + 0.5}rem;
                opacity: 0.6;
                pointer-events: none;
                z-index: 1;
                animation: floatUp ${Math.random() * 3 + 4}s linear infinite;
            `;
            document.body.appendChild(heart);

            setTimeout(() => {
                heart.remove();
            }, 7000);
        };

        // Add floating animation
        if (!document.getElementById('floating-animations')) {
            const styles = document.createElement('style');
            styles.id = 'floating-animations';
            styles.textContent = `
                @keyframes floatUp {
                    from {
                        transform: translateY(0) rotate(0deg);
                        opacity: 0.6;
                    }
                    to {
                        transform: translateY(-100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Create hearts periodically on welcome screen
        setInterval(() => {
            if (document.getElementById('welcomeScreen').classList.contains('active')) {
                createFloatingHeart();
            }
        }, 3000);
    }

    addScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.rule-item, .detail-item, .stat-card').forEach(el => {
            observer.observe(el);
        });
    }

    addHoverEffects() {
        // Enhanced hover effects for buttons
        document.querySelectorAll('.btn-primary, .btn-secondary, .btn-next').forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = button.style.transform.replace('scale(1)', 'scale(1.05)');
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = button.style.transform.replace('scale(1.05)', 'scale(1)');
            });
        });

        // Add sparkle effect on hover for special elements
        document.querySelectorAll('.couple-names, .heart-seal').forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.createSparkles(element);
            });
        });
    }

    addPageTransitions() {
        // Add smooth page transitions with stagger effect
        const addStaggerAnimation = (container) => {
            const elements = container.querySelectorAll('.rule-item, .detail-item, .form-group');
            elements.forEach((element, index) => {
                element.style.animationDelay = `${index * 0.1}s`;
                element.classList.add('stagger-in');
            });
        };

        // Monitor screen changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('active') && target.classList.contains('screen')) {
                        setTimeout(() => {
                            addStaggerAnimation(target);
                        }, 300);
                    }
                }
            });
        });

        document.querySelectorAll('.screen').forEach(screen => {
            observer.observe(screen, { attributes: true });
        });
    }

    createSparkles(element) {
        const rect = element.getBoundingClientRect();
        const sparkles = [];

        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.innerHTML = '✨';
            sparkle.style.cssText = `
                position: fixed;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top + Math.random() * rect.height}px;
                font-size: 1rem;
                pointer-events: none;
                z-index: 1000;
                animation: sparkle 1s ease-out forwards;
            `;
            document.body.appendChild(sparkle);
            sparkles.push(sparkle);
        }

        // Add sparkle animation
        if (!document.getElementById('sparkle-animation')) {
            const styles = document.createElement('style');
            styles.id = 'sparkle-animation';
            styles.textContent = `
                @keyframes sparkle {
                    0% {
                        transform: scale(0) rotate(0deg);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1) rotate(180deg);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Clean up sparkles
        setTimeout(() => {
            sparkles.forEach(sparkle => sparkle.remove());
        }, 1000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const weddingInvite = new WeddingInvite();
    const animationManager = new AnimationManager();

    // Add some additional interactive effects
    const addInteractiveEffects = () => {
        // Add typing effect for quotes
        const quotes = document.querySelectorAll('.quote-text');
        quotes.forEach(quote => {
            const text = quote.textContent;
            quote.textContent = '';
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    quote.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 50);
                }
            };

            // Start typing when element becomes visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(typeWriter, 500);
                        observer.unobserve(entry.target);
                    }
                });
            });
            observer.observe(quote);
        });
    };

    addInteractiveEffects();
});

// Add some utility functions
const utils = {
    // Format phone number
    formatPhone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    },

    // Validate email
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export for potential future use
window.WeddingInvite = WeddingInvite;
window.AnimationManager = AnimationManager;
window.utils = utils;
