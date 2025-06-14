import { formatDate } from '../utils/Utils.js';
import { MIN_ZOOM_FOR_ADD } from '../constants.js';

export default class SlideoutController {
  constructor(map, addTreeBtn) {
    this.map = map;
    this.minZoom = MIN_ZOOM_FOR_ADD;
    this.slideout = document.getElementById('tree-slideout');
    this.content = document.getElementById('tree-slideout-content');
    this.addTreeBtn = addTreeBtn;
  }

  open(tree) {
    this.content.innerHTML = `
      <h3>Tree ID: ${tree.id}</h3>
      <p><strong>Public:</strong> ${tree.public_accessible}</p>
      <p><strong>By:</strong> ${tree.created_by_username}</p>
      <p><strong>On:</strong> ${formatDate(tree.created_at)}</p>

      <form method="post" enctype="multipart/form-data" action="/identify/">
        <input type="hidden" name="csrfmiddlewaretoken" value="${CSRF_TOKEN}">
        ${IDENTIFY_FORM_HTML}
        <button type="submit">Identify</button>
      </form>
    `;

    if (USER_IS_AUTH && tree.created_by === USER_ID) {
      const zoom = this.map.getZoom();
      if (zoom >= this.minZoom) {
        this.content.innerHTML += `
          <button id="adjust-btn">Adjust Position</button>
          <button id="delete-btn">Delete Tree</button>
        `;
      } else {
        this.content.innerHTML += `
          <button disabled>Zoom to ${this.minZoom}+ to adjust</button>
          <button id="delete-btn">Delete Tree</button>
        `;
      }
    }

    this.slideout.classList.add('visible');
    this._bindButtons(tree.id);
  }

  close() {
    this.slideout.classList.remove('visible');
  }

  _bindButtons(treeId) {
    const adjustBtn = document.getElementById('adjust-btn');
    const deleteBtn = document.getElementById('delete-btn');

    if (adjustBtn) adjustBtn.onclick = () => enableAdjustPosition(treeId);
    if (deleteBtn) deleteBtn.onclick = () => deleteTree(treeId);
  }
}
