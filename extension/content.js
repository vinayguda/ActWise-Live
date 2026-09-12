// ActWise Anywhere — Floating Voice Sidecar Injected Script

(function() {
  if (document.getElementById('actwise-sidecar-root')) return;

  const root = document.createElement('div');
  root.id = 'actwise-sidecar-root';
  
  root.innerHTML = `
    <div id="actwise-floating-btn" title="ActWise Voice Sidecar — Click to ask about Actize">
      <div class="actwise-orb-pulse"></div>
      <span class="actwise-mic-icon">🎙️</span>
    </div>
    <div id="actwise-sidecar-panel" class="actwise-hidden">
      <div class="actwise-panel-header">
        <strong>NICE ActWise Voice Sidecar</strong>
        <span id="actwise-close-btn">&times;</span>
      </div>
      <div class="actwise-panel-body">
        <p class="actwise-status">Tap microphone or highlight text on page to ask ActWise.</p>
        <div id="actwise-results-box"></div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const btn = document.getElementById('actwise-floating-btn');
  const panel = document.getElementById('actwise-sidecar-panel');
  const closeBtn = document.getElementById('actwise-close-btn');

  btn.addEventListener('click', () => {
    panel.classList.toggle('actwise-hidden');
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.add('actwise-hidden');
  });
})();
