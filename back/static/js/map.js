// map.js
// Initialiser la carte à Paris avec un niveau de zoom plus élevé
var map = L.map('map').setView([48.8566, 2.3522], 14);

// Ajouter un calque de tuiles OpenStreetMap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Fonction pour ajuster les paramètres de la carte selon la taille de l'écran
function adjustMapForMobile() {
    if (window.innerWidth < 768) {
        map.zoomControl.remove(); // Supprime le contrôle de zoom sur les petits écrans
        map.touchZoom.enable();    // Active le zoom tactile
        map.scrollWheelZoom.disable(); // Désactive le zoom à la molette de la souris
    } else {
        map.touchZoom.disable();    // Désactive le zoom tactile sur les grands écrans
        map.scrollWheelZoom.enable(); // Active le zoom à la molette sur les grands écrans
    }
}

// Ajuster la carte lors du chargement initial
adjustMapForMobile();

// Écouter les changements de taille de la fenêtre
window.addEventListener('resize', function() {
    map.invalidateSize(); // Ajuste la taille de la carte automatiquement
    adjustMapForMobile(); // Ajuster les paramètres de la carte selon la taille de l'écran
});

// Stocker les marqueurs pour les gérer plus tard
let arbreMarkers = [];

// Fonction pour supprimer tous les marqueurs d'arbres
function clearArbres() {
    arbreMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    arbreMarkers = []; // Réinitialiser le tableau des marqueurs
}

// Fonction pour récupérer les données des arbres depuis l'API en fonction de la zone visible
async function fetchArbres() {
    // Obtenez les limites de la carte visible
    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const limit = 1000; // Nombre maximum d'arbres par appel

    // Supprimer les anciens arbres avant de charger les nouveaux
    clearArbres();

    try {
        // Préparez les paramètres de la requête avec les limites géographiques
        const params = new URLSearchParams({
            'rows': limit,
            'geofilter.bbox': `${southWest.lat},${southWest.lng},${northEast.lat},${northEast.lng}`
        });

        // Faites la requête à l'API avec les limites géographiques
        const response = await fetch(`https://opendata.paris.fr/api/records/1.0/search/?dataset=les-arbres&${params.toString()}`);
        const data = await response.json();

        // Affichez la réponse complète dans la console pour inspecter la structure
        console.log(data);

        // Vérifiez si les données existent dans la structure attendue
        if (data.records && Array.isArray(data.records)) {
            const arbres = data.records;

            // Si aucun arbre n'est trouvé, logguer un message
            if (arbres.length === 0) {
                console.error("Aucun arbre trouvé dans cette requête.");
                return;
            }

            // Parcourir et afficher les arbres sur la carte
            arbres.forEach(arb => {
                const lat = arb.fields.geo_point_2d[0]; // Latitude
                const lng = arb.fields.geo_point_2d[1]; // Longitude
                const nom = arb.fields.libellefrancais || "Arbre"; // Nom de l'arbre
                const adresse = arb.fields.adresse || "Adresse inconnue"; // Adresse de l'arbre

                if (lat !== undefined && lng !== undefined) {
                    const circle = L.circleMarker([lat, lng], {
                        color: 'green',      // Bordure verte
                        fillColor: 'green',  // Remplissage vert
                        fillOpacity: 0.8,    // Opacité du remplissage
                        radius: 5            // Rayon du cercle
                    }).addTo(map);
                    circle.bindPopup(`<b>${nom}</b><br>${adresse}`);
                } else {
                    console.warn("Coordonnées manquantes ou invalides pour un arbre :", arb);
                }
            });
        } else {
            console.error("La structure des données est incorrecte.");
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
    }
}

// Appeler la fonction pour récupérer les arbres lorsque la carte est déplacée ou zoomée
map.on('moveend', fetchArbres);

// Initialiser la récupération des arbres à la première ouverture de la carte
fetchArbres();