document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const docEl = document.getElementById('doc');
  const titleEl = document.getElementById('title');
  const metaEl = document.getElementById('meta');
  const messagesEl = document.getElementById('messages');

  chrome.storage.local.get(['chatExportPayload'], async (res) => {
    const payload = res.chatExportPayload;
    if (!payload || !payload.messages) {
      statusEl.textContent = 'Nothing to export.';
      return;
    }

    try {
      const { title, messages } = payload;
      const { platform, settings } = payload;

      titleEl.textContent = title || 'AI Chat Export';
      const scopeLabels = { all: 'Hele samtalen', last: 'Kun siste melding', recent: 'Siste 10 meldinger' };
      const roleLabels = { both: 'Både bruker og AI', assistant: 'Kun AI svar', user: 'Kun bruker meldinger' };
      metaEl.textContent = [
        `Platform: ${platform?.charAt(0).toUpperCase() + platform?.slice(1) || 'unknown'}`,
        `Eksportert: ${new Date().toLocaleString('no-NO')}`,
        `Meldinger: ${messages.length}`,
        `Omfang: ${scopeLabels[settings.scope] || settings.scope}`,
        `Inkluderer: ${roleLabels[settings.includeRole] || settings.includeRole}`
      ].join(' • ');

      // Render messages
      messages.forEach((msg) => {
        const wrap = document.createElement('div');
        wrap.className = 'msg';

        const roleDiv = document.createElement('div');
        roleDiv.className = 'role';
        const emoji = msg.role === 'user' ? '👤' : '🤖';
        const label = msg.role === 'user' ? 'Bruker' : 'AI Assistent';
        roleDiv.textContent = `${emoji} ${label}${settings.includeTimestamps && msg.timestamp ? ' - ' + new Date(msg.timestamp).toLocaleString('no-NO') : ''}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        let content = String(msg.content || '');
        if (!settings.includeCodeBlocks) {
          content = content.replace(/```[\s\S]*?```/g, '[Kodeblokk fjernet]');
        }
        contentDiv.textContent = content;
        wrap.appendChild(roleDiv);
        wrap.appendChild(contentDiv);
        messagesEl.appendChild(wrap);
      });

      // Reveal document
      docEl.classList.remove('hidden');

      // If html2pdf is bundled, use one-click PDF; otherwise fallback to print dialog
      if (typeof window.html2pdf === 'function') {
        statusEl.textContent = 'Generating PDF…';
        const filename = `${(title || 'AI_Chat_Export').replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
        const opt = {
          margin: 10,
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await window.html2pdf().set(opt).from(docEl).save();
        statusEl.textContent = 'Done';
        chrome.storage.local.remove('chatExportPayload');
        setTimeout(() => window.close(), 300);
      } else {
        statusEl.textContent = 'Opening print dialog…';
        statusEl.classList.add('hidden');
        window.onafterprint = () => {
          chrome.storage.local.remove('chatExportPayload');
          setTimeout(() => window.close(), 300);
        };
        setTimeout(() => window.print(), 200);
      }
    } catch (err) {
      console.error('Chat exporter failed:', err);
      statusEl.textContent = 'Export failed.';
    }
  });
});
