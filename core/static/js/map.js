// ------------------------------------------------------------
//  map.js (pure JavaScript; no Django tags inside)
//  Expects three globals from map.html:
//    • USER_IS_AUTH   (true/false)
//    • USER_ID        (number or null)
//    • CSRF_TOKEN     (string)
// ------------------------------------------------------------
function openTreeSlideOut(tree) {
    const slideOut = document.getElementById('tree-slideout');
    const content = document.getElementById('tree-slideout-content');
    content.innerHTML = `
    <h3>Tree ID: ${tree.id}</h3>
    <p><strong>Public Access:</strong> ${tree.public_accessible}</p>
    <p><strong>Created by:</strong> ${tree.created_by_username}</p>
    <p><strong>Created:</strong> ${new Date(tree.created_at).toLocaleDateString()}</p>

    <form method="post" enctype="multipart/form-data" action="/identify/">
        <input type="hidden" name="csrfmiddlewaretoken" value="${CSRF_TOKEN}">
        ${IDENTIFY_FORM_HTML}
        <button type="submit">Identify</button>
    </form>
    `;

    if (USER_IS_AUTH && tree.created_by === USER_ID) {
        const currentZoom = map.getZoom();

        if (currentZoom >= MIN_ZOOM_FOR_ADD) {
            content.innerHTML += `
        <button onclick="enableAdjustPosition('${tree.id}')">Adjust Position</button>
        <button onclick="deleteTree('${tree.id}')">Delete Tree</button>
      `;
        } else {
            content.innerHTML += `
        <button disabled>Zoom to ${MIN_ZOOM_FOR_ADD}+ to adjust</button>
        <button onclick="deleteTree('${tree.id}')">Delete Tree</button>
      `;
        }
    }

    slideOut.classList.add('visible'); // Add a class to show the panel
}

function closeTreeSlideOut() {
  const slideOut = document.getElementById('tree-slideout');
  if (slideOut) {
    slideOut.classList.remove('visible');
  }
}

(() => {
    new Slideout({
        'panel': document.getElementById('panel'),
        'menu': document.getElementById('tree-slideout'),
        'padding': 256,
        'tolerance': 70
    });

    const MIN_ZOOM_FOR_ADD = 18;
    const MAX_ADJUST_DISTANCE = 25; // meters

    // 1) Initialize Leaflet map, centered on Orsay
    const map = L.map('map').setView([48.6984, 2.1870], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 20
    }).addTo(map);

    // 2) Define a “🌳” icon
    const treeIcon = L.divIcon({
        html: '🌳',
        iconSize: [20, 20],
        className: 'tree-icon'
    });

    // 3) A LayerGroup to hold all tree markers
    let treeLayer = L.layerGroup().addTo(map);

    // 4) Fetch and draw “trees” within map bounds
    function loadTrees() {
        const bounds = map.getBounds();
        const params = new URLSearchParams({
            bbox: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
        });

        fetch(`/api/trees/?${params}`)
            .then((res) => res.json())
            .then((data) => {
                treeLayer.clearLayers();

                L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {
                        const marker = L.marker(latlng, {
                            icon: treeIcon,
                            draggable: false
                        });
                        marker.treeId = feature.id;
                        return marker;
                    },
                    onEachFeature: (feature, layer) => {
                        layer.treeId = feature.id;
                        const props = feature.properties;

                        layer.on('click', () => {
                            openTreeSlideOut({
                                id: feature.id,
                                public_accessible: props.public_accessible,
                                created_by_username: props.created_by_username,
                                created_at: props.created_at,
                                created_by: props.created_by
                            });
                        });

                }).addTo(treeLayer);
            })
            .catch((err) => {
                console.error('Error fetching trees:', err);
            });
    }

    // 5) Call loadTrees() initially and whenever the map moves/zooms
    map.on('moveend', loadTrees);
    map.on('zoomend', () => {
        updateAddTreeButton();
        loadTrees();
    });
    loadTrees();

    // 6) “Add Tree” Mode
    let addTreeMode = false;
    const addTreeBtn = document.getElementById('addTreeBtn');

    function updateAddTreeButton() {
        if (!addTreeBtn) return;

        const currentZoom = map.getZoom();
        if (currentZoom < MIN_ZOOM_FOR_ADD) {
            addTreeBtn.classList.add('disabled');
            addTreeBtn.textContent = `Zoom in to add trees (${MIN_ZOOM_FOR_ADD}+)`;
            if (addTreeMode) {
                addTreeMode = false;
                map.getContainer().style.cursor = '';
            }
        } else {
            addTreeBtn.classList.remove('disabled');
            if (addTreeMode) {
                addTreeBtn.textContent = 'Cancel Add';
                addTreeBtn.classList.remove('btn-add');
                addTreeBtn.classList.add('btn-cancel');
                map.getContainer().style.cursor = 'crosshair';
            } else {
                addTreeBtn.textContent = 'Add Tree';
                addTreeBtn.classList.remove('btn-cancel');
                addTreeBtn.classList.add('btn-add');
                map.getContainer().style.cursor = '';
            }
        }
    }

    if (addTreeBtn) {
        addTreeBtn.addEventListener('click', () => {
            if (addTreeBtn.classList.contains('disabled')) return;
            addTreeMode = !addTreeMode;
            updateAddTreeButton();
        });

        map.on('click', (e) => {
            if (!addTreeMode) return;

            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            fetch('/api/trees/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRF_TOKEN
                },
                body: JSON.stringify({
                    location: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    public_accessible: true
                })
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.id) {
                        addTreeMode = false;
                        updateAddTreeButton();
                        loadTrees();
                    } else {
                        alert('Error adding tree. Please try again.');
                    }
                })
                .catch((err) => {
                    console.error('Error adding tree:', err);
                    alert('Error adding tree. Please try again.');
                });
        });
    }

    // 7) Adjust Position Logic
    let adjustingTreeId = null;
    let adjustingMarker = null;
    let originalPosition = null;

    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    window.enableAdjustPosition = function (treeId) {
        let targetLayer = null;

        function findLayerRecursive(layerGroup) {
            layerGroup.eachLayer((layer) => {
                if (layer.treeId === treeId) {
                    targetLayer = layer;
                    return;
                }
                if (layer.eachLayer) {
                    findLayerRecursive(layer);
                }
            });
        }

        findLayerRecursive(treeLayer);
        if (!targetLayer) return;

        originalPosition = targetLayer.getLatLng();
        adjustingTreeId = treeId;
        targetLayer.closePopup();

        // Remove the original (non-draggable) marker
        let parentLayer = null;
        treeLayer.eachLayer((layer) => {
            if (layer.eachLayer) {
                layer.eachLayer((sublayer) => {
                    if (sublayer.treeId === treeId) parentLayer = layer;
                });
            }
        });
        if (parentLayer) {
            parentLayer.removeLayer(targetLayer);
        }

        // Create a new draggable marker at the same position
        adjustingMarker = L.marker(originalPosition, {
            icon: L.divIcon({
                html: '🌳',
                iconSize: [20, 20],
                className: 'tree-icon moving-tree'
            }),
            draggable: true
        }).addTo(map);

        map.getContainer().style.cursor = 'move';

        adjustingMarker
            .bindTooltip(
                `Drag to adjust position (max ${MAX_ADJUST_DISTANCE}m)`,
                {
                    permanent: true,
                    direction: 'bottom',
                    offset: [0, 20]
                }
            )
            .openTooltip();

        adjustingMarker.on('drag', (e) => {
            const curr = e.target.getLatLng();
            const dist = calculateDistance(
                originalPosition.lat,
                originalPosition.lng,
                curr.lat,
                curr.lng
            );
            if (dist > MAX_ADJUST_DISTANCE) {
                e.target.setLatLng(originalPosition);
            }
        });

        adjustingMarker.on('dragend', (e) => {
            const newLatLng = e.target.getLatLng();
            const dist = calculateDistance(
                originalPosition.lat,
                originalPosition.lng,
                newLatLng.lat,
                newLatLng.lng
            );
            if (dist <= MAX_ADJUST_DISTANCE) {
                saveTreePosition(treeId, newLatLng);
            } else {
                cancelAdjustPosition();
                alert(
                    `Position adjustment limited to ${MAX_ADJUST_DISTANCE} meters. You tried: ${dist.toFixed(
                        1
                    )} m.`
                );
            }
        });

        adjustingMarker.on('click', (e) => {
            e.originalEvent.stopPropagation();
            cancelAdjustPosition();
        });

        map.once('click', () => {
            if (adjustingMarker) cancelAdjustPosition();
        });
    };

    function saveTreePosition(treeId, newLatLng) {
        fetch(`/api/trees/${treeId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN
            },
            body: JSON.stringify({
                location: {
                    type: 'Point',
                    coordinates: [newLatLng.lng, newLatLng.lat]
                }
            })
        })
            .then((response) => {
                if (response.ok) {
                    cancelAdjustPosition();
                    loadTrees();
                } else if (response.status === 403) {
                    alert('You can only adjust your own trees.');
                    cancelAdjustPosition();
                } else {
                    alert('Error adjusting tree position. Please try again.');
                    cancelAdjustPosition();
                }
            })
            .catch((err) => {
                console.error('Error adjusting tree position:', err);
                alert('Error adjusting tree position. Please try again.');
                cancelAdjustPosition();
            });
    }

    function cancelAdjustPosition() {
        if (adjustingMarker) {
            map.removeLayer(adjustingMarker);
            map.off('click');
        }
        map.getContainer().style.cursor = '';
        adjustingTreeId = null;
        adjustingMarker = null;
        originalPosition = null;
        loadTrees();
    }

    // 8) Delete Tree Logic
    window.deleteTree = function (treeId) {
        if (!confirm('Are you sure you want to delete this tree?')) return;

        fetch(`/api/trees/${treeId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': CSRF_TOKEN
            }
        })
            .then((response) => {
                if (response.ok) {
                    loadTrees();
                } else if (response.status === 403) {
                    alert('You can only delete your own trees.');
                } else {
                    alert('Error deleting tree. Please try again.');
                }
            })
            .catch((err) => {
                console.error('Error deleting tree:', err);
                alert('Error deleting tree. Please try again.');
            });
    };
})();
