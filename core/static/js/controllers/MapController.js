import TreeService from './TreeService.js';
import SlideoutController from './SlideoutController.js';
import AddTreeController from './AddTreeController.js';
import AdjustPositionController from './AdjustPositionController.js';

export default class MapController {
  constructor(options) {
    this.map = L.map(options.mapId).setView(options.center, options.zoom);
    L.tileLayer(options.tileUrl, { maxZoom: options.maxZoom }).addTo(this.map);

    this.slideout = new SlideoutController(this.map, options.addBtn);
    this.addTreeCtrl = new AddTreeController(this.map, options.addBtn);
    this.adjustPosCtrl = new AdjustPositionController(this.map);

    this._initLayer();
    this._bindEvents();
    this.loadTrees();
  }

  _initLayer() {
    this.treeLayer = L.layerGroup().addTo(this.map);
  }

  _bindEvents() {
    this.map.on('moveend', () => this.loadTrees());
    this.map.on('zoomend', () => this.loadTrees());
    window.enableAdjustPosition = id => this.adjustPosCtrl.enable(id);
    window.deleteTree = id => TreeService.deleteTree(id).then(() => this.loadTrees());
    window.closeTreeSlideOut = () => this.slideout.close();
  }

  loadTrees() {
    TreeService.fetchTrees(this.map.getBounds()).then(data => {
      this.treeLayer.clearLayers();
      L.geoJSON(data, {
        pointToLayer: (feature, latlng) => L.marker(latlng, {
          icon: L.divIcon({ html: '🌳', iconSize: [20,20], className: 'tree-icon' })
        }),
        onEachFeature: (feature, layer) => {
          layer.on('click', () => {
            const props = feature.properties;
            this.slideout.open({
              id: feature.id,
              public_accessible: props.public_accessible,
              created_by_username: props.created_by_username,
              created_at: props.created_at,
              created_by: props.created_by
            });
          });
        }
      }).addTo(this.treeLayer);
    }).catch(err => console.error('Error fetching trees:', err));
  }
}
