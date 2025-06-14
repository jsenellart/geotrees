import { calculateDistance } from '../utils/Utils.js';
import { MAX_ADJUST_DISTANCE } from '../constants.js';


export default class AdjustPositionController {
  constructor(map) {
    this.map = map;
    this.maxDist = MAX_ADJUST_DISTANCE;
    this.current = null;
  }

  enable(treeId) {
    this.treeId = treeId;
    this._findMarker(treeId);
    if (!this.marker) return;
    this.origLatLng = this.marker.getLatLng();
    this.marker.remove();

    this.dragMarker = L.marker(this.origLatLng, {
      icon: L.divIcon({ html: '🌳', className: 'tree-icon moving-tree', iconSize: [20,20] }),
      draggable: true
    }).addTo(this.map);

    this.map.getContainer().style.cursor = 'move';
    this.dragMarker.bindTooltip(`Drag (max ${this.maxDist}m)`).openTooltip();

    this.dragMarker.on('drag', e => this._onDrag(e));
    this.dragMarker.on('dragend', e => this._onDragEnd(e));
    this.map.once('click', () => this.cancel());
  }

  _onDrag(e) {
    const latlng = e.target.getLatLng();
    const dist = calculateDistance(
      this.origLatLng.lat, this.origLatLng.lng,
      latlng.lat, latlng.lng
    );
    if (dist > this.maxDist) this.dragMarker.setLatLng(this.origLatLng);
  }

  _onDragEnd(e) {
    const newPos = e.target.getLatLng();
    const dist = calculateDistance(
      this.origLatLng.lat, this.origLatLng.lng,
      newPos.lat, newPos.lng
    );
    if (dist <= this.maxDist) {
      TreeService.updateTreePosition(this.treeId, newPos.lng, newPos.lat)
        .then(() => this._cleanup())
        .then(loadTrees);
    } else {
      alert(`Max ${this.maxDist}m. You moved ${dist.toFixed(1)}m.`);
      this.cancel();
    }
  }

  cancel() {
    if (this.dragMarker) this.map.removeLayer(this.dragMarker);
    this.map.getContainer().style.cursor = '';
    loadTrees();
  }
}