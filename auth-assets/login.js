const password=document.getElementById('password'),toggle=document.getElementById('show-password');
toggle.addEventListener('click',()=>{const shown=password.type==='password';password.type=shown?'text':'password';toggle.textContent=shown?'Ocultar':'Mostrar';toggle.setAttribute('aria-pressed',String(shown));toggle.setAttribute('aria-label',shown?'Ocultar contraseña':'Mostrar contraseña')});
document.getElementById('login-form').addEventListener('submit',()=>{const button=document.getElementById('submit-login');button.disabled=true;button.textContent='Ingresando…'});
