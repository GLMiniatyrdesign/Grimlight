// Initialise FlexSlider for Carousels
jQuery(window).delay(500).on('load', function() {
    jQuery('.flexslider').flexslider({
    animation: "fade",
    directionNav: true,
    slideshowSpeed: 5000,
    animationSpeed: 600,
    touch: true
    });
});

