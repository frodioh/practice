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

  if (document.querySelector('.left-panel__exit')) {
    var tabs = document.querySelectorAll('.left-panel__item');
    for(var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function() {
        var selector = this.getAttribute('data-tab');
        var contentItems = document.querySelectorAll('.content__item');
        var content = document.querySelector('#'+selector);
        for(var i = 0; i < contentItems.length; i++) {
          contentItems[i].classList.remove('active');
          tabs[i].classList.remove('active');
        }
        content.classList.add('active');
        this.classList.add('active');
      });
    }

    var exitBtn = document.querySelector('.left-panel__exit');
    exitBtn.addEventListener('click', function(e) {
      e.preventDefault();
    });
  }
});