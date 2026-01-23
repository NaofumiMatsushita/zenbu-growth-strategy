// スムーススクロール
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// スクロールアニメーション
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// アニメーション対象要素
const animateElements = document.querySelectorAll('.problem-card, .feature-card, .testimonial-card, .faq-item, .step');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// ヘッダーの背景変更（スクロール時）
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    }

    lastScroll = currentScroll;
});

// FAQアコーディオン（将来的な拡張用）
document.querySelectorAll('.faq-question').forEach(question => {
    question.style.cursor = 'pointer';
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isVisible = answer.style.display === 'flex';

        // すべての回答を閉じる
        document.querySelectorAll('.faq-answer').forEach(ans => {
            ans.style.display = 'none';
        });

        // クリックされた質問の回答を開く/閉じる
        if (!isVisible) {
            answer.style.display = 'flex';
        }
    });
});

// 初期状態：最初の質問のみ開く
document.querySelectorAll('.faq-answer').forEach((answer, index) => {
    answer.style.display = index === 0 ? 'flex' : 'none';
});

// カウントアップアニメーション
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        if (element.textContent.includes('+')) {
            element.textContent = Math.floor(current).toLocaleString() + '+';
        } else if (element.textContent.includes('/')) {
            element.textContent = current.toFixed(1) + '/5.0';
        } else if (element.textContent.includes('%')) {
            element.textContent = Math.floor(current) + '%';
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// 統計カウンターのアニメーション
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            const statValue = entry.target.querySelector('.stat-value');

            if (statValue) {
                const text = statValue.textContent;
                if (text.includes('10,000+')) {
                    animateValue(statValue, 0, 10000, 2000);
                } else if (text.includes('4.8')) {
                    animateValue(statValue, 0, 4.8, 2000);
                } else if (text.includes('98%')) {
                    animateValue(statValue, 0, 98, 2000);
                }
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// メーターアニメーション（ヒーローセクション）
const meterValue = document.querySelector('.meter-value');
if (meterValue) {
    let dbValue = 45;
    let increasing = true;

    setInterval(() => {
        if (increasing) {
            dbValue += Math.random() * 3;
            if (dbValue >= 78) increasing = false;
        } else {
            dbValue -= Math.random() * 3;
            if (dbValue <= 45) increasing = true;
        }

        meterValue.textContent = Math.floor(dbValue);

        // 色の変更
        const meterCircle = document.querySelector('.meter-circle');
        if (dbValue >= 80) {
            meterCircle.style.background = '#F44336';
        } else if (dbValue >= 60) {
            meterCircle.style.background = '#FF9800';
        } else if (dbValue >= 40) {
            meterCircle.style.background = '#FFC107';
        } else {
            meterCircle.style.background = '#4CAF50';
        }
    }, 1000);
}

// フォーム送信（お問い合わせフォームがある場合）
const contactForm = document.querySelector('#contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // フォームデータの取得
        const formData = new FormData(contactForm);

        // TODO: 実際のAPI送信処理
        console.log('Form submitted:', Object.fromEntries(formData));

        // 送信完了メッセージ
        alert('お問い合わせを受け付けました。担当者より3営業日以内にご連絡いたします。');
        contactForm.reset();
    });
}

// モバイルメニュー（将来的な拡張用）
const mobileMenuButton = document.querySelector('.mobile-menu-button');
const mobileMenu = document.querySelector('.mobile-menu');

if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });
}

// パフォーマンス最適化：画像の遅延読み込み
document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
});

// Google Analytics（実装時に追加）
// window.dataLayer = window.dataLayer || [];
// function gtag(){dataLayer.push(arguments);}
// gtag('js', new Date());
// gtag('config', 'GA_MEASUREMENT_ID');

console.log('ZENBU騒音チェッカー LP loaded successfully');
