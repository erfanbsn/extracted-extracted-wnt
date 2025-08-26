jQuery(document).ready(function($) {
    // Carousel functionality with hover, drag, and touch swipe support
    const initCarousel = function() {
        const carousel = $(this); // `this` refers to the current .woocommerce-products-carousel element
        const carouselTrack = carousel.find('.carousel-track');

        if (carouselTrack.length === 0) {
            // console.warn('Carousel track not found for a carousel instance.');
            return; // Skip initialization if track doesn't exist
        }

        let currentPosition = 0;
        let maxScrollPosition = carouselTrack[0].scrollWidth - carouselTrack.width();

        // Update maxScrollPosition on resize
        let resizeTimeout;
        $(window).on('resize.carouselResize', function() { // Namespaced event
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (carouselTrack.length > 0 && carouselTrack[0].scrollWidth > 0) { // Check if track still exists and has width
                    maxScrollPosition = carouselTrack[0].scrollWidth - carouselTrack.width();
                }
            }, 250);
        });

        // --- State Flags ---
        let isDragging = false;         // True if mouse button is down for dragging
        let isTouchDragging = false;    // True if touch gesture is in progress
        let isMouseInsideTrack = false; // True if mouse cursor is physically over the track

        // --- Hover Scroll Logic ---
        let masterHoverInterval = null;
        let mouseXInTrack = -1; // X position of mouse relative to track for hover
        const HOVER_SCROLL_SPEED = 7; // Pixels to scroll each step
        const MASTER_HOVER_INTERVAL_DELAY = 30; // Milliseconds between steps

        function stopHoverScroll() {
            if (masterHoverInterval) {
                clearInterval(masterHoverInterval);
                masterHoverInterval = null;
            }
        }

        function startHoverScroll() {
            // Do not start hover scroll if a drag (mouse or touch) is in progress, or if mouse is not inside
            if (isDragging || isTouchDragging || !isMouseInsideTrack) {
                stopHoverScroll();
                return;
            }
            stopHoverScroll(); // Clear existing before starting a new one

            masterHoverInterval = setInterval(() => {
                // Interval should stop if conditions are no longer met
                if (isDragging || isTouchDragging || !isMouseInsideTrack || mouseXInTrack < 0) {
                    // The interval will be cleared by other events (mouseleave, mousedown, touchstart)
                    // but this is an internal check.
                    return;
                }

                const trackWidth = carouselTrack.width();
                // Re-calculate maxScrollPosition, as it might change (e.g. AJAX content load)
                if (carouselTrack.length > 0 && carouselTrack[0].scrollWidth > 0) {
                     maxScrollPosition = carouselTrack[0].scrollWidth - carouselTrack.width();
                }


                const thresholdPercent = 0.25; // Active zone is 25% from each side
                const leftThreshold = trackWidth * thresholdPercent;
                const rightThreshold = trackWidth * (1 - thresholdPercent);

                if (mouseXInTrack < leftThreshold) { // Mouse in left zone
                    if (carouselTrack.scrollLeft() > 0) {
                        let newScrollLeft = carouselTrack.scrollLeft() - HOVER_SCROLL_SPEED;
                        carouselTrack.scrollLeft(Math.max(0, newScrollLeft));
                        currentPosition = carouselTrack.scrollLeft();
                    }
                    carouselTrack.css('cursor', 'w-resize');
                } else if (mouseXInTrack > rightThreshold) { // Mouse in right zone
                    if (carouselTrack.scrollLeft() < maxScrollPosition) {
                        let newScrollLeft = carouselTrack.scrollLeft() + HOVER_SCROLL_SPEED;
                        carouselTrack.scrollLeft(Math.min(maxScrollPosition, newScrollLeft));
                        currentPosition = carouselTrack.scrollLeft();
                    }
                    carouselTrack.css('cursor', 'e-resize');
                } else { // Mouse in middle zone
                    carouselTrack.css('cursor', 'default'); // Default cursor when hover is active but not scrolling
                }
            }, MASTER_HOVER_INTERVAL_DELAY);
        }

        carouselTrack.on('mouseenter.carouselHover', function() {
            isMouseInsideTrack = true;
            if (!isDragging && !isTouchDragging) {
                mouseXInTrack = -1; // Will be updated by mousemove
                startHoverScroll();
            }
        });

        carouselTrack.on('mousemove.carouselHover', function(e) {
            if (isMouseInsideTrack && !isDragging && !isTouchDragging) {
                mouseXInTrack = e.pageX - $(this).offset().left;
                if (!masterHoverInterval) { // If interval somehow stopped, restart it
                    startHoverScroll();
                }
            }
        });

        carouselTrack.on('mouseleave.carouselHover', function() {
            isMouseInsideTrack = false;
            stopHoverScroll();
            mouseXInTrack = -1;
            if (!isDragging && !isTouchDragging) { // Only reset cursor if not in a drag operation
                $(this).css('cursor', 'grab'); // Default idle cursor
            }
            // If isDragging is true, cursor is 'grabbing' and will be handled by mouseup
        });

        // --- Drag to Scroll (Desktop Mouse) ---
        let dragStartX;       // X position where drag started, relative to track
        let dragScrollLeft;   // Initial scrollLeft of the track when drag started

        carouselTrack.on('mousedown.carouselDrag', function(e) {
            if (e.button !== 0) return; // Only for left mouse button
            if (isTouchDragging) return; // Do not allow mouse drag if touch drag is happening

            isDragging = true;
            isMouseInsideTrack = true; // Mouse is definitely inside when mousedown occurs on track
            stopHoverScroll(); // Stop hover scroll when drag begins

            dragStartX = e.pageX - $(this).offset().left;
            dragScrollLeft = this.scrollLeft;

            $(this).addClass('dragging');
            $(this).css('cursor', 'grabbing');

            e.preventDefault(); // Prevent text selection, image dragging, etc.
        });

        // Attach mousemove and mouseup to the document to allow dragging outside the carousel bounds
        $(document).on('mousemove.carouselDragGlobal', function(e) {
            if (!isDragging) return;

            e.preventDefault();

            const currentMouseXInTrack = e.pageX - carouselTrack.offset().left;
            const walk = (currentMouseXInTrack - dragStartX) * 1.5; // Drag sensitivity multiplier

            carouselTrack[0].scrollLeft = dragScrollLeft - walk;
            currentPosition = carouselTrack[0].scrollLeft;
        });

        $(document).on('mouseup.carouselDragGlobal', function(e) {
            if (!isDragging) return;

            isDragging = false;
            carouselTrack.removeClass('dragging');
            // currentPosition is already set by mousemove

            // Check if mouse is still over the carouselTrack to decide next state
            // isMouseInsideTrack is updated by carouselTrack's mouseenter/mouseleave
            if (isMouseInsideTrack) {
                carouselTrack.css('cursor', 'default'); // Hover will refine this if in edge zones
                startHoverScroll(); // Restart hover scroll if mouse is still inside
            } else {
                carouselTrack.css('cursor', 'grab'); // Default idle cursor if mouse is outside
            }
        });

        // --- Touch events (Swipe to scroll for mobile and tablet) ---
        let touchInitialX = 0; // Renamed from touchStartX to avoid conflict
        let touchInitialScrollLeft = 0; // Renamed from touchScrollLeft

        carouselTrack.off('touchstart.carouselTouch touchmove.carouselTouch touchend.carouselTouch touchend.carouselTouch') // Clear previous specific handlers
            .on({
                'touchstart.carouselTouch': function(e) {
                    // If a touch event starts, assume it takes precedence
                    isTouchDragging = true;
                    isDragging = false;         // Ensure desktop mouse drag is off
                    isMouseInsideTrack = false; // Disable mouse hover context during touch
                    stopHoverScroll();

                    touchInitialX = e.originalEvent.touches[0].pageX;
                    touchInitialScrollLeft = this.scrollLeft;
                    // $(this).addClass('touch-dragging'); // Optional: for touch-specific visual feedback
                },
                'touchmove.carouselTouch': function(e) {
                    if (!isTouchDragging) return;

                    const touchCurrentX = e.originalEvent.touches[0].pageX;
                    const walk = (touchCurrentX - touchInitialX) * 1.5; // Swipe sensitivity

                    const touchDeltaX = Math.abs(touchCurrentX - touchInitialX);
                    if (touchDeltaX > 5) { // Only prevent default if horizontal swipe is intended
                        e.preventDefault(); // Prevent page scroll during horizontal swipe
                    }
                    this.scrollLeft = touchInitialScrollLeft - walk;
                    currentPosition = this.scrollLeft;
                },
                'touchend.carouselTouch': function() {
                    if (!isTouchDragging) return;
                    isTouchDragging = false;
                    // $(this).removeClass('touch-dragging');
                    currentPosition = this.scrollLeft;

                    // After touch ends, if a mouse is present and inside, hover could restart.
                    // However, isMouseInsideTrack was set to false on touchstart.
                    // User would need to move mouse to trigger mouseenter again.
                    // This is generally acceptable behavior.
                    // Set cursor to grab as a default after touch.
                    carouselTrack.css('cursor', 'grab');
                }
            });

        // Set initial cursor state
        carouselTrack.css('cursor', 'grab');
    };

    // Initialize carousels
    $('.woocommerce-products-carousel').each(function() {
        // Check if already initialized to avoid duplicate event bindings
        if (!$(this).data('carousel-initialized')) {
            initCarousel.call(this);
            $(this).data('carousel-initialized', true);
        }
    });

    // Reinitialize when new content loaded (for AJAX)
    let ajaxReinitTimeout;
    $(document).on('ajaxComplete', function() {
        clearTimeout(ajaxReinitTimeout);
        ajaxReinitTimeout = setTimeout(function() {
            $('.woocommerce-products-carousel').each(function() {
                if (!$(this).data('carousel-initialized')) {
                    // console.log('Reinitializing carousel after AJAX');
                    initCarousel.call(this);
                    $(this).data('carousel-initialized', true);
                } else {
                    // If already initialized, at least update maxScrollPosition
                    const track = $(this).find('.carousel-track');
                    if (track.length > 0 && track[0].scrollWidth > 0) {
                         // This update should ideally happen within the instance's resize handler
                         // or a dedicated update function if maxScrollPosition is not dynamically updated by hover/drag.
                         // For now, this is a simple refresh.
                         // maxScrollPosition = track[0].scrollWidth - track.width(); // This would affect the last carousel's scope
                    }
                }
            });
        }, 300); // Adjust delay as needed
    });

    // Add to cart functionality with improved UX (Unchanged from original)
    // Ensure wc_carousel_params and wc_carousel_params.ajax_url are defined and available.
    if (typeof wc_carousel_params === 'undefined' || typeof wc_carousel_params.ajax_url === 'undefined') {
        // console.warn('wc_carousel_params or wc_carousel_params.ajax_url is not defined. Add to cart will not work.');
    }

    $(document).off('click.addToCartCarousel', '.woocommerce-products-carousel .add-to-cart')
               .on('click.addToCartCarousel', '.woocommerce-products-carousel .add-to-cart', function(e) {
        e.preventDefault();
        const button = $(this);
        const product_id = button.data('product_id');

        if (!product_id) {
            // console.error('Product ID not found for add to cart button.');
            return;
        }
        if (typeof wc_carousel_params === 'undefined' || !wc_carousel_params.ajax_url || !wc_carousel_params.add_to_cart_nonce) {
            // console.error('WooCommerce carousel AJAX parameters not available.');
            // alert('خطا: امکان افزودن به سبد خرید وجود ندارد. پارامترها یافت نشد.');
            return;
        }


        button.addClass('loading').html('<span class="loader"></span>');

        $.ajax({
            type: 'POST',
            url: wc_carousel_params.ajax_url,
            data: {
                action: 'add_to_cart',
                product_id: product_id,
                security: wc_carousel_params.add_to_cart_nonce
            },
            success: function(response) {
                if (response.success) {
                    const notification = $('<div class="wc-cart-notification">' +
                        '<div class="wc-cart-notification-content">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">' +
                        '<path fill="none" d="M0 0h24v24H0z"/>' +
                        '<path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" fill="rgba(255,255,255,0.9)"/>' +
                        '</svg>' +
                        '<span>' + (response.data.message || 'محصول به سبد خرید اضافه شد') + '</span>' +
                        '</div></div>');
                    $('body').append(notification);
                    setTimeout(() => { notification.addClass('show'); }, 10);
                    setTimeout(() => {
                        notification.removeClass('show');
                        setTimeout(() => { notification.remove(); }, 300);
                    }, 3000);

                    const cartCount = $('.cart-count');
                    if (cartCount.length && response.data.cart_count !== undefined) {
                        cartCount.text(response.data.cart_count).addClass('pulse');
                        setTimeout(() => { cartCount.removeClass('pulse'); }, 500);
                    }
                } else {
                    // console.error('Add to cart failed:', response.data.message);
                    // alert(response.data.message || 'خطا در افزودن به سبد خرید');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // console.error('AJAX error adding to cart:', textStatus, errorThrown);
                // alert('خطا در ارتباط با سرور هنگام افزودن به سبد خرید');
            },
            complete: function() {
                setTimeout(() => {
                    button.removeClass('loading').html(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">' +
                        '<path opacity="0.4" d="M19.24 5.58006H18.84L15.46 2.20006C15.19 1.93006 14.75 1.93006 14.47 2.20006C14.2 2.47006 14.2 2.91006 14.47 3.19006L16.86 5.58006H7.14L9.53 3.19006C9.8 2.92006 9.8 2.48006 9.53 2.20006C9.26 1.93006 8.82 1.93006 8.54 2.20006L5.17 5.58006H4.77C3.87 5.58006 2 5.58006 2 8.14006C2 9.11006 2.2 9.75006 2.62 10.1701C2.86 10.4201 3.15 10.5501 3.46 10.6201C3.75 10.6901 4.06 10.7001 4.36 10.7001H19.64C19.95 10.7001 20.24 10.6801 20.52 10.6201C21.36 10.4201 22 9.82006 22 8.14006C22 5.58006 20.13 5.58006 19.24 5.58006Z" fill="#547F7E"/>' +
                        '<path d="M19.65 10.6999H4.35996C4.06996 10.6999 3.74996 10.6899 3.45996 10.6099L4.71996 18.2999C4.99996 20.0199 5.74996 21.9999 9.07996 21.9999H14.69C18.06 21.9999 18.66 20.3099 19.02 18.4199L20.53 10.6099C20.25 10.6799 19.95 10.6999 19.65 10.6999ZM12 18.4999C9.65996 18.4999 7.74996 16.5899 7.74996 14.2499C7.74996 13.8399 8.08996 13.4999 8.49996 13.4999C8.90996 13.4999 9.24996 13.8399 9.24996 14.2499C9.24996 15.7699 10.48 16.9999 12 16.9999C13.52 16.9999 14.75 15.7699 14.75 14.2499C14.75 13.8399 15.09 13.4999 15.5 13.4999C15.91 13.4999 16.25 13.8399 16.25 14.2499C16.25 16.5899 14.34 18.4999 12 18.4999Z" fill="#547F7E"/>' +
                        '</svg>'
                    );
                }, 500);
            }
        });
    });
});
