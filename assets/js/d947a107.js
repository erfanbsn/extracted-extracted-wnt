document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabsContainer = document.querySelector('.tabs');
    const tabs = document.querySelectorAll('.tab');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const cardsSections = document.querySelectorAll('.cards-section');
    const carousels = document.querySelectorAll('.cards-carousel');

    // متغیر برای تشخیص درگ
    let isDragging = false;

    // تابع تغییر تب
    const switchTab = (clickedTab) => {
        if (isDragging) return;
        
        // غیرفعال کردن همه تب‌ها و بخش‌ها
        tabs.forEach(tab => tab.classList.remove('active'));
        cardsSections.forEach(section => section.classList.remove('active'));
        
        // فعال کردن تب و بخش مربوطه
        clickedTab.classList.add('active');
        const tabId = clickedTab.getAttribute('data-tab');
        const targetSection = document.getElementById(`${tabId}-cards`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    };

    // Drag and touch functionality
    const setupDragScrolling = (container) => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragging = false;
            startX = e.pageX;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            isDragging = true;
            e.preventDefault();
            const x = e.pageX;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.style.cursor = 'grab';
            setTimeout(() => isDragging = false, 100);
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });

        // Touch events
        container.addEventListener('touchstart', (e) => {
            isDown = true;
            isDragging = false;
            startX = e.touches[0].pageX;
            scrollLeft = container.scrollLeft;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            isDragging = true;
            const x = e.touches[0].pageX;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        }, { passive: true });

        container.addEventListener('touchend', () => {
            isDown = false;
            setTimeout(() => isDragging = false, 100);
        }, { passive: true });
    };

    // Tab click handling
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (!isDragging) {
                switchTab(tab);
            }
        });
    });

    // Initialize drag scrolling
    if (tabsContainer) {
        setupDragScrolling(tabsContainer);
    }

    // Navigation buttons
    if (prevBtn && nextBtn) {
        const scrollAmount = () => {
            const tab = document.querySelector('.tab');
            if (!tab) return 0;
            const style = window.getComputedStyle(tab);
            return tab.offsetWidth + (parseFloat(style.marginRight) || 16);
        };

        prevBtn.addEventListener('click', () => {
            tabsContainer.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            tabsContainer.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
        });
    }

    // Card carousels
    carousels.forEach(carousel => {
        setupDragScrolling(carousel);
        
        const scrollAmount = () => {
            const card = carousel.querySelector('.card');
            if (!card) return 0;
            const style = window.getComputedStyle(card);
            return card.offsetWidth + (parseFloat(style.marginRight) || 24);
        };

        const prevBtn = carousel.querySelector('.card-prev-btn');
        const nextBtn = carousel.querySelector('.card-next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
            });
        }
    });
});

jQuery(document).ready(function($) {
    $(document).on('click', '.upload_flag_button', function(e) {
        e.preventDefault();
        
        var button = $(this),
            custom_uploader = wp.media({
                title: 'انتخاب تصویر پرچم',
                library: {
                    type: 'image'
                },
                button: {
                    text: 'استفاده از این تصویر'
                },
                multiple: false
            }).on('select', function() {
                var attachment = custom_uploader.state().get('selection').first().toJSON();
                $('input.product_flag_image_field').val(attachment.url);
            }).open();
    });
});