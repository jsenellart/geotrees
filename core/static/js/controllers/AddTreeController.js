import { MIN_ZOOM_FOR_ADD } from '../constants.js';
import TreeService from './TreeService.js';

export default class AddTreeController {
  constructor(map, button) {
    this.map = map;
    this.btn = button;
    this.active = false;
    this.minZoom = MIN_ZOOM_FOR_ADD;
    this._init();
  }

  _init() {
    // Only bind events if the button exists
    if (this.btn) {
      this.btn.addEventListener('click', () => this.toggle());
    }
    this.map.on('click', e => this._onMapClick(e));
    this.map.on('zoomend', () => this._updateButton());
    this._updateButton();
  }

  toggle() {
    if (!this.btn) return;
    if (this.map.getZoom() < this.minZoom) return;
    this.active = !this.active;
    this._updateButton();
  }

  _updateButton() {
    if (!this.btn) return;
    const zoom = this.map.getZoom();
    if (zoom < this.minZoom) {
      this.btn.classList.add('disabled');
      this.btn.textContent = `Zoom in to add trees (${this.minZoom}+)`;
      this.active = false;
      this.map.getContainer().style.cursor = '';
    } else {
      this.btn.classList.remove('disabled');
      if (this.active) {
        this.btn.textContent = 'Cancel Add';
        this.map.getContainer().style.cursor = 'crosshair';
      } else {
        this.btn.textContent = 'Add Tree';
        this.map.getContainer().style.cursor = '';
      }
    }
  }

  _onMapClick(e) {
    if (!this.active) return;
    TreeService.addTree(e.latlng.lng, e.latlng.lat)
      .then(data => {
        if (data.id) {
          this.active = false;
          this._updateButton();
          this.map.fire('moveend');
        } else {
          alert('Error adding tree.');
        }
      })
      .catch(() => alert('Error adding tree.'));
  }
}