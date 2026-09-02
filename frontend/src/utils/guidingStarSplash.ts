/**
 * BOM PASTOR DIGITAL v7.0.0 — Estrela Guia / Visual Release Signature
 * Assinatura visual etérea de celebração do deploy da versão v7.0.0.
 *
 * Características:
 * - Single-shot via localStorage ('bom_pastor_v7_guiding_star')
 * - Fixed overlay com pointer-events: none (zero impacto em cliques/usabilidade)
 * - Trajetória diagonal com aceleração GPU (translate3d / will-change)
 * - Halo/Glow sagrado temporário na tag de versão (shepherd-glow)
 * - Autoconsumo: limpa todos os nós do DOM após 3.5s
 */

export function triggerGuidingStarSplash(): void {
    const STORAGE_KEY = 'bom_pastor_v7_guiding_star';

    // 1. Verificação Single-shot
    try {
        if (localStorage.getItem(STORAGE_KEY)) {
            return;
        }
    } catch {
        // Fallback em caso de restrição de storage
    }

    // 2. Injeção dinâmica da folha de estilos CSS
    const styleId = 'shepherd-guiding-star-styles';
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = `
        /* Overlay Fixo e Passivo */
        .shepherd-star-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            pointer-events: none !important;
            overflow: hidden;
            opacity: 1;
            transition: opacity 0.5s ease-out;
        }

        /* Estrela Guia Luminosa com Rastro Celestial */
        .shepherd-star {
            position: absolute;
            top: -60px;
            left: -100px;
            width: 14px;
            height: 14px;
            background: #FFFFFF;
            border-radius: 50%;
            box-shadow: 
                0 0 10px #FFFFFF,
                0 0 20px #FDE047,
                0 0 35px #EAB308,
                0 0 50px #EAB308;
            will-change: transform;
            animation: shepherdStarFlight 3.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* Rastro Celestial Dourado */
        .shepherd-star::before {
            content: '';
            position: absolute;
            top: 50%;
            right: 8px;
            transform: translateY(-50%) rotate(-8deg);
            transform-origin: right center;
            width: 260px;
            height: 4px;
            background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(234, 179, 8, 0.2) 20%,
                rgba(253, 224, 71, 0.75) 75%,
                rgba(255, 255, 255, 1) 100%
            );
            border-radius: 4px;
            filter: blur(1.2px);
            box-shadow: 0 0 12px rgba(253, 224, 71, 0.6);
        }

        /* Centelha Transversal / Crosshair Divino */
        .shepherd-star::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 32px;
            height: 32px;
            background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(253,224,71,0.4) 40%, rgba(255,255,255,0) 70%);
            border-radius: 50%;
        }

        /* Partículas de Poeira Estelar Celestial */
        .shepherd-sparkle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #FDE047;
            border-radius: 50%;
            box-shadow: 0 0 6px #FFFFFF;
            opacity: 0;
            animation: shepherdSparkleFade 1.4s ease-out forwards;
        }

        /* Trajetória Diagonal Fluida */
        @keyframes shepherdStarFlight {
            0% {
                transform: translate3d(-100px, -60px, 0) rotate(22deg) scale(0.6);
                opacity: 0;
            }
            15% {
                opacity: 1;
            }
            75% {
                opacity: 1;
            }
            100% {
                transform: translate3d(calc(100vw + 120px), calc(45vh + 100px), 0) rotate(22deg) scale(1.1);
                opacity: 0;
            }
        }

        @keyframes shepherdSparkleFade {
            0% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(0.2) translateY(20px); }
        }

        /* Halo / Glow Celestial Temporário na Tag de Versão */
        .shepherd-glow {
            display: inline-block !important;
            color: #FDE047 !important;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            text-shadow: 
                0 0 8px #FDE047,
                0 0 16px #EAB308,
                0 0 28px #FFFFFF,
                0 0 40px #EAB308 !important;
            transform: scale(1.3) translateY(-1px) !important;
            filter: drop-shadow(0 0 6px rgba(234, 179, 8, 0.8)) !important;
        }
    `;
    document.head.appendChild(styleEl);

    // 3. Criação dos Elementos no DOM
    const overlay = document.createElement('div');
    overlay.className = 'shepherd-star-overlay';

    const star = document.createElement('div');
    star.className = 'shepherd-star';
    overlay.appendChild(star);

    document.body.appendChild(overlay);

    // 4. Efeito de Partículas de Poeira Estelar (Sparkles)
    const sparkleInterval = setInterval(() => {
        if (!overlay.parentNode) {
            clearInterval(sparkleInterval);
            return;
        }
        const rect = star.getBoundingClientRect();
        if (rect.x > 0 && rect.x < window.innerWidth) {
            const sparkle = document.createElement('div');
            sparkle.className = 'shepherd-sparkle';
            sparkle.style.left = `${rect.x - Math.random() * 60}px`;
            sparkle.style.top = `${rect.y + (Math.random() * 20 - 10)}px`;
            overlay.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 1400);
        }
    }, 120);

    // 5. Ativação do Glow na Tag de Versão quando a luz cruza o topo
    const triggerHaloGlow = () => {
        // Busca a tag pelo ID #versao-tag ou pelas classes do sistema
        const tagVersao = document.getElementById('versao-tag') || document.querySelector('.versao-tag-v7');
        if (tagVersao) {
            tagVersao.classList.add('shepherd-glow');
            setTimeout(() => {
                tagVersao.classList.remove('shepherd-glow');
            }, 1800);
        }
    };

    // Dispara o Glow aos 1.1s (quando a estrela cruza a região superior do cabeçalho)
    setTimeout(triggerHaloGlow, 1100);

    // 6. Limpeza e Persistência da Flag após 3.5s
    setTimeout(() => {
        clearInterval(sparkleInterval);
        overlay.style.opacity = '0';

        setTimeout(() => {
            overlay.remove();
            styleEl.remove();

            // Grava no localStorage para garantir Single-shot absoluto
            try {
                localStorage.setItem(STORAGE_KEY, 'true');
            } catch {
                // Silencioso em caso de restrição
            }
        }, 500);
    }, 3200);
}
