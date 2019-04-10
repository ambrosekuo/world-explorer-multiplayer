window.addEventListener("load", e => {
  console.log('loaded');
  if (JSON.parse(window.localStorage.getItem("user")) != null) {
    fetch("/loggedIn", {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: JSON.parse(window.localStorage.getItem("user")).username,
        inLocal: 'true'
      })
    })
      .then(res => {
        if (res.redirected) {
          window.location.replace(res.url);
        } else {
          return res.json();
        }
      })
      .then(data => {
        if (data) {
          document.getElementById("user-login").value = JSON.parse(window.localStorage.getItem("user")).username;
          document.getElementById("loginErrorMsg").innerHTML = data.message;
        }
      });
  }
});

function submitFormLogin(e, form) {
  e.preventDefault();
  fetch("/login", {
    method: "post",
    body: JSON.stringify({
      username: form.username.value,
      password: form.password.value
    }),
    redirect: "follow",
    headers: { "Content-Type": "application/json" }
  })
    .then(res => {
      if (res.redirected) {
        // Only passing username as user, so using an explicit extraction
        let str = res.url;
        let user = {};
        user.username = decodeURIComponent(
          str.substring(str.lastIndexOf("=") + 1)
        );
        window.localStorage.setItem("user", JSON.stringify(user));
        window.location.replace(str.substring(0, str.indexOf("/")));
      } else {
        return res.json();
      }
    })
    .then(data => {
      if (data) {
        if (!data.success) {
          // Compare to false case of null
          document.getElementById("loginErrorMsg").innerHTML = data.message;
        }
      }
    });
}

function submitFormRegistration(e, form) {
  e.preventDefault();
  fetch("/register", {
    method: "post",
    body: JSON.stringify({
      username: form.username.value,
      password: form.password.value
    }),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => {
      return res.json();
    })
    .then(data => {
      document.getElementById("registerErrorMsg").innerHTML = data.message;
    });
}
