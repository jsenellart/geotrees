import { BASE_URL } from '../constants.js';

export default class TreeService {
  static fetchTrees(bounds) {
    const params = new URLSearchParams({
      bbox: [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ].join(',')
    });
    return fetch(`${BASE_URL}?${params}`, {
      headers: { 'X-CSRFToken': CSRF_TOKEN }
    }).then(res => res.json());
  }

  static addTree(lng, lat) {
    return fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': CSRF_TOKEN
      },
      body: JSON.stringify({
        location: { type: 'Point', coordinates: [lng, lat] },
        public_accessible: true
      })
    }).then(res => res.json());
  }

  static updateTreePosition(id, lng, lat) {
    return fetch(`${BASE_URL}${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': CSRF_TOKEN
      },
      body: JSON.stringify({
        location: { type: 'Point', coordinates: [lng, lat] }
      })
    });
  }

  static deleteTree(id) {
    return fetch(`${BASE_URL}${id}/`, {
      method: 'DELETE',
      headers: { 'X-CSRFToken': CSRF_TOKEN }
    });
  }
}