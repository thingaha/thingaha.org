$(document).ready(function () {
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $("#scroll-top-button").fadeIn().show();
    } else {
      $("#scroll-top-button").fadeOut().hide();
    }
  });

  $("#scroll-top-button").click(function () {
    $("html, body").animate(
      {
        scrollTop: 0,
      },
      500
    );
    return false;
  });
});