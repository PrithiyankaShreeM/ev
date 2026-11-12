const roleButtons = document.querySelectorAll('.role');
const driverView = document.querySelector('#driver-view');
const homeownerView = document.querySelector('#homeowner-view');
const dialog = document.querySelector('#preview-dialog');

roleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const isDriver = button.dataset.role === 'driver';
    driverView.hidden = !isDriver;
    homeownerView.hidden = isDriver;
    roleButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  });
});

document.querySelector('#info-button').addEventListener('click', () => dialog.showModal());
document.querySelector('#listing-button').addEventListener('click', () => dialog.showModal());
document.querySelectorAll('.dialog-close, .dialog-done').forEach((button) => button.addEventListener('click', () => dialog.close()));

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    // Discovery and booking sections belong to the driver preview.
    if (link.getAttribute('href') !== '#overview' && driverView.hidden) roleButtons[0].click();
    document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});
