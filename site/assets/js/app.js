$(document).ready(function() {
  //Якорный переход
  $('.anchor-link').on('click', function(e) {
    e.preventDefault();
    var id = $(this).attr('href'),
        top = $(id).offset().top;
    $('body, html').animate({
      scrollTop: top
    }, 1500);
  });
});

window.addEventListener('click', function() {
  //Авторизация
  if (document.querySelector("#loginForm")) {
    var btn = document.querySelector("#loginFormBtn");
    btn.addEventListener("click", function (e) {
      var login = document.querySelector("#formLogin").value;
      var pass = document.querySelector("#formPass").value;
      if (login && pass) {
        var data = {
          "login": login,
          "pass": pass
        };
        $.ajax({
          url: '/auth',
          type: 'POST',
          data: JSON.stringify(data),
          cache: false,
          processData: false,
          contentType: 'application/json; charset=utf8',
          dataType: 'json',
          success: function (data, status) {
            if (data.isValid) {
              location = "/admin.html";
            } else {
              alert("Неверный логин или пароль!");
            }
          }
        });
      } else {
        alert("Заполните все поля.");
      }
    });
  }

});