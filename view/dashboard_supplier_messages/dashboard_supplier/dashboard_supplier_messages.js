// ../../view/dashboard_supplier/dashboard_supplier_messages/dashboard_supplier_messages.js

class DashboardSupplierMessages {
  constructor(root = document){
    this.root = root;
  }

  init(){
    this.initMessagesUI();
  }

  initMessagesUI(){
    const messagesRoot = this.root.querySelector('.Messages');
    if (!messagesRoot) return;

    const listItems        = messagesRoot.querySelectorAll('.msg-item');
    const threadContainers = messagesRoot.querySelectorAll('.messages-thread__content');
    const filterButtons    = messagesRoot.querySelectorAll('.messages-filters .pill');
    const markAllReadBtn   = this.root.getElementById('btn-mark-all-read');
    const composeForm      = this.root.getElementById('messagesCompose');

    // Cambiar de hilo al hacer clic
    listItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetThreadId = item.dataset.thread;

        // Estado active en la lista
        listItems.forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');

        // Marcar como leído
        item.classList.remove('is-unread');
        item.dataset.status = 'read';

        // Mostrar hilo correspondiente
        threadContainers.forEach(thread => {
          if (thread.id === targetThreadId) {
            thread.hidden = false;
            thread.classList.add('is-visible');
          } else {
            thread.hidden = true;
            thread.classList.remove('is-visible');
          }
        });
      });
    });

    // Filtros (All / Unread / Approvals / System)
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        filterButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        listItems.forEach(item => {
          const status = item.dataset.status;
          const type   = item.dataset.type;

          let isVisible = true;
          if (filter === 'unread') {
            isVisible = status === 'unread';
          } else if (filter === 'approval') {
            isVisible = type === 'approval';
          } else if (filter === 'system') {
            isVisible = type === 'system';
          }

          item.style.display = isVisible ? '' : 'none';
        });
      });
    });

    // Botón: marcar todos como leídos
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        listItems.forEach(item => {
          item.classList.remove('is-unread');
          item.dataset.status = 'read';
        });
      });
    }

    // Enviar mensaje (front-end)
    if (composeForm) {
      composeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const textarea = composeForm.querySelector('textarea');
        const text = textarea.value.trim();
        if (!text) return;

        const currentThreadBody = messagesRoot.querySelector('.messages-thread__content.is-visible .messages-thread__body');
        if (!currentThreadBody) return;

        const bubble = this.root.createElement('article');
        bubble.className = 'msg-bubble is-outgoing';
        bubble.innerHTML = `
          <header class="msg-bubble__header">
            <span class="msg-from">You</span>
            <span class="msg-time">Just now</span>
          </header>
          <p>${text.replace(/</g, '&lt;')}</p>
        `;
        currentThreadBody.appendChild(bubble);
        textarea.value = '';
        currentThreadBody.scrollTop = currentThreadBody.scrollHeight;
      });
    }
  }
}

/* Inicialización */
document.addEventListener('DOMContentLoaded', () => {
  const messagesApp = new DashboardSupplierMessages(document);
  messagesApp.init();
});
