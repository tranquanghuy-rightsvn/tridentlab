document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".mobile-menu-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      mobileNav.classList.toggle("open");
    });
  }

  document.querySelectorAll(".mobile-nav .menu-item-has-children > a").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var submenu = link.nextElementSibling;
      if (submenu) {
        submenu.classList.toggle("open");
      }
    });
  });

  var heroSlides = document.querySelectorAll(".hero-slide");
  if (heroSlides.length > 1) {
    var activeIndex = 0;
    // Wait a tick before activating the first slide, so the browser
    // renders the "inactive" state first and the CSS transition
    // (opacity/zoom) actually has a starting point to animate from.
    // setTimeout is used instead of requestAnimationFrame because rAF is
    // paused by the browser while the tab/page isn't visible, which could
    // leave the first slide stuck inactive if the page loads in a
    // background tab.
    setTimeout(function () {
      heroSlides[activeIndex].classList.add("is-active");
    }, 50);
    setInterval(function () {
      heroSlides[activeIndex].classList.remove("is-active");
      activeIndex = (activeIndex + 1) % heroSlides.length;
      heroSlides[activeIndex].classList.add("is-active");
    }, 3000);
  }
});
