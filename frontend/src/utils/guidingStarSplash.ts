/**
 * BOM PASTOR DIGITAL v7.0.0 — Estrela Guia / Visual Release Signature
 * Assinatura visual etérea de celebração do deploy da versão v7.0.0.
 *
 * Duração: 10 segundos de vôo majestoso no topo da tela.
 */

export function triggerGuidingStarSplash(force: boolean = false): void {
    const STORAGE_KEY = 'bom_pastor_v7_guiding_star';

    // 1. Verificação Single-shot (a menos que force seja true)
    if (!force) {
        try {
            if (localStorage.getItem(STORAGE_KEY)) {
                return;
            }
        } catch {
            // Fallback silencioso
        }
    }

    // 2. Injeção dinâmica da folha de estilos CSS
    const styleId = 'shepherd-guiding-star-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
        /* Overlay Fixo e Passivo */
        .shepherd-star-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            pointer-events: none !important;
            overflow: hidden;
            opacity: 1;
            transition: opacity 0.8s ease-out;
        }

        /* Estrela Guia Luminosa no Topo do Cabeçalho (10s) */
        .shepherd-star {
            position: absolute;
            top: 20px;
            left: -120px;
            width: 24px;
            height: 24px;
            background: #FFFFFF;
            border-radius: 50%;
            box-shadow: 
                0 0 15px #FFFFFF,
                0 0 35px #FDE047,
                0 0 60px #EAB308,
                0 0 90px #EAB308;
            will-change: transform;
            animation: shepherdStarFlight 10s linear forwards;
        }

        /* Rastro Celestial Dourado Extenso */
        .shepherd-star::before {
            content: '';
            position: absolute;
            top: 50%;
            right: 14px;
            transform: translateY(-50%) rotate(-4deg);
            transform-origin: right center;
            width: 420px;
            height: 7px;
            background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(234, 179, 8, 0.25) 15%,
                rgba(253, 224, 71, 0.9) 70%,
                rgba(255, 255, 255, 1) 100%
            );
            border-radius: 7px;
            filter: blur(1.5px);
            box-shadow: 0 0 20px rgba(253, 224, 71, 0.9);
        }

        /* Centelha Transversal / Crosshair Divino */
        .shepherd-star::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 52px;
            height: 52px;
            background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(253,224,71,0.7) 40%, rgba(255,255,255,0) 75%);
            border-radius: 50%;
        }

        /* Partículas de Poeira Estelar Celestial */
        .shepherd-sparkle {
            position: absolute;
            width: 6px;
            height: 6px;
            background: #FDE047;
            border-radius: 50%;
            box-shadow: 0 0 10px #FFFFFF;
            opacity: 0;
            animation: shepherdSparkleFade 2s ease-out forwards;
        }

        /* Trajetória Fluida sobre o Cabeçalho (10s) */
        @keyframes shepherdStarFlight {
            0% {
                transform: translate3d(-120px, 0, 0) rotate(12deg) scale(0.8);
                opacity: 0;
            }
            3% {
                opacity: 1;
            }
            88% {
                opacity: 1;
            }
            100% {
                transform: translate3d(calc(100vw + 180px), calc(35vh), 0) rotate(12deg) scale(1.3);
                opacity: 0;
            }
        }

        @keyframes shepherdSparkleFade {
            0% { opacity: 1; transform: scale(1.5); }
            100% { opacity: 0; transform: scale(0.2) translateY(40px); }
        }

        /* Halo / Glow Celestial Temporário na Tag de Versão */
        .shepherd-glow {
            display: inline-block !important;
            color: #FDE047 !important;
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            text-shadow: 
                0 0 12px #FDE047,
                0 0 24px #EAB308,
                0 0 40px #FFFFFF,
                0 0 60px #EAB308 !important;
            transform: scale(1.4) translateY(-2px) !important;
            filter: drop-shadow(0 0 10px rgba(234, 179, 8, 1)) !important;
        }
    `;

    // 3. Criação dos Elementos no DOM
    const overlay = document.createElement('div');
    overlay.className = 'shepherd-star-overlay';

    const star = document.createElement('div');
    star.className = 'shepherd-star';
    overlay.appendChild(star);

    document.body.appendChild(overlay);

    // 4. Efeito de Partículas de Poeira Estelar (Sparkles contínuos por 10s)
    const sparkleInterval = setInterval(() => {
        if (!overlay.parentNode) {
            clearInterval(sparkleInterval);
            return;
        }
        const rect = star.getBoundingClientRect();
        if (rect.x > -50 && rect.x < window.innerWidth + 50) {
            const sparkle = document.createElement('div');
            sparkle.className = 'shepherd-sparkle';
            sparkle.style.left = `${rect.x - Math.random() * 90}px`;
            sparkle.style.top = `${rect.y + (Math.random() * 30 - 15)}px`;
            overlay.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 2000);
        }
    }, 120);

    // 5. Ativação do Glow na Tag de Versão quando a estrela passa pelo topo
    const triggerHaloGlow = () => {
        const tagVersao = document.getElementById('versao-tag') || document.querySelector('.versao-tag-v7');
        if (tagVersao) {
            tagVersao.classList.add('shepherd-glow');
            setTimeout(() => {
                tagVersao.classList.remove('shepherd-glow');
            }, 6000);
        }
    };

    // Dispara o Glow logo no início aos 1s
    setTimeout(triggerHaloGlow, 1000);

    // 6. Limpeza e Persistência da Flag após 10 segundos
    setTimeout(() => {
        clearInterval(sparkleInterval);
        overlay.style.opacity = '0';

        setTimeout(() => {
            overlay.remove();
            if (styleEl && styleEl.parentNode) styleEl.remove();

            try {
                localStorage.setItem(STORAGE_KEY, 'true');
            } catch {
                // Silencioso em caso de restrição
            }
        }, 800);
    }, 9800);
}
