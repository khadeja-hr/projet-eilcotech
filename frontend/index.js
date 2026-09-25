// ============================================
// BASE DE DONNÉES (localStorage) - IK
// ============================================

const STORAGE_KEY = 'itec_produits';

function getProduits() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveProduits(produits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(produits));
}

// ============================================
// RÈGLES MÉTIER - IK
// ============================================

const MARQUES_PAR_CATEGORIE = {
    'Smartphones': ['Apple', 'Samsung', 'Huawei'],
    'Ordinateurs': ['Acer', 'Dell', 'HP'],
    'Électroménagers': {
        'Aspirateurs': ['Dyson', 'Ninja', 'Cecotec'],
        'Réfrigérateurs': ['LG', 'Samsung', 'Beko'],
        'Machines à laver': ['Hisense', 'Beko', 'Samsung']
    }
};

const PREFIXE_CATEGORIE = {
    'Smartphones': 'SM',
    'Ordinateurs': 'PC',
    'Électroménagers': 'EM'
};

const MAX_PRODUITS_PAR_MARQUE = 5;

function getMarquesAutorisees(categorie, sousCategorie) {
    if (categorie === 'Électroménagers') {
        return MARQUES_PAR_CATEGORIE['Électroménagers'][sousCategorie] || [];
    }
    return MARQUES_PAR_CATEGORIE[categorie] || [];
}

function compterProduitsParMarque(categorie, sousCategorie, marque) {
    const produits = getProduits();
    return produits.filter(p =>
        p.categorie === categorie &&
        p.sousCategorie === (sousCategorie || null) &&
        p.marque === marque
    ).length;
}

function genererReference(categorie, marque, version) {
    const prefixe = PREFIXE_CATEGORIE[categorie] || 'XX';
    const marqueCode = marque.substring(0, 3).toUpperCase();
    const versionCode = version.substring(0, 3).toUpperCase();
    const produits = getProduits();
    const prefixeRef = `${prefixe}-${marqueCode}-${versionCode}-`;
    const refsExistantes = produits
        .filter(p => p.reference.startsWith(prefixeRef))
        .map(p => parseInt(p.reference.split('-')[3]) || 0);
    const prochainNumero = refsExistantes.length > 0
        ? Math.max(...refsExistantes) + 1
        : 1;
    return `${prefixeRef}${String(prochainNumero).padStart(3, '0')}`;
}

// ============================================
// US 2.1 - AJOUTER UN PRODUIT - IK (TEST-49)
// ============================================

function ajouterProduit(produit) {
    const produits = getProduits();

    // Vérification 1 : Unicité de la référence
    if (produits.some(p => p.reference === produit.reference)) {
        return { success: false, message: `❌ La référence "${produit.reference}" existe déjà !` };
    }

    // Vérification 2 : Quantité entre 0 et 10
    if (produit.quantite < 0 || produit.quantite > 10) {
        return { success: false, message: '❌ La quantité doit être comprise entre 0 et 10.' };
    }

    // Vérification 3 : Cohérence marque/catégorie
    const marquesAutorisees = getMarquesAutorisees(produit.categorie, produit.sousCategorie);
    if (!marquesAutorisees.includes(produit.marque)) {
        return { success: false, message: `❌ La marque "${produit.marque}" n'est pas autorisée pour cette catégorie.` };
    }

    // Vérification 4 : Maximum 5 produits par marque
    const nombreProduits = compterProduitsParMarque(
        produit.categorie,
        produit.sousCategorie,
        produit.marque
    );
    if (nombreProduits >= MAX_PRODUITS_PAR_MARQUE) {
        return { success: false, message: `❌ La marque "${produit.marque}" a déjà ${MAX_PRODUITS_PAR_MARQUE} produits (maximum autorisé).` };
    }

    // Ajout du statut
    produit.statut = produit.quantite === 0 ? 'Rupture' : 'Disponible';

    // Ajout du produit
    produits.push(produit);
    saveProduits(produits);

    return { success: true, message: `✅ Produit "${produit.nom}" ajouté avec succès ! Référence : ${produit.reference}` };
}

function afficherMessage(texte, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = texte;
    messageDiv.className = `mt-4 p-4 rounded-lg font-semibold ${
        type === 'success'
            ? 'bg-green-100 text-green-800 border-2 border-green-300'
            : 'bg-red-100 text-red-800 border-2 border-red-300'
    }`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
}

// ============================================
// GESTION DYNAMIQUE DU FORMULAIRE - IK
// ============================================

const selectCategorie = document.getElementById('categorie');
const selectSousCategorie = document.getElementById('sousCategorie');
const selectMarque = document.getElementById('marque');
const divSousCategorie = document.getElementById('div-sous-categorie');

selectCategorie.addEventListener('change', function() {
    const categorie = this.value;
    if (categorie === 'Électroménagers') {
        divSousCategorie.classList.remove('hidden');
        selectSousCategorie.required = true;
    } else {
        divSousCategorie.classList.add('hidden');
        selectSousCategorie.required = false;
        selectSousCategorie.value = '';
    }
    mettreAJourMarques();
});

selectSousCategorie.addEventListener('change', mettreAJourMarques);

function mettreAJourMarques() {
    const categorie = selectCategorie.value;
    const sousCategorie = selectSousCategorie.value;
    selectMarque.innerHTML = '<option value="">-- Choisir --</option>';
    if (!categorie) return;
    const marques = getMarquesAutorisees(categorie, sousCategorie);
    marques.forEach(marque => {
        const option = document.createElement('option');
        option.value = marque;
        option.textContent = marque;
        selectMarque.appendChild(option);
    });
}

// ============================================
// SOUMISSION DU FORMULAIRE - IK (TEST-49)
// ============================================

document.getElementById('form-ajout').addEventListener('submit', function(e) {
    e.preventDefault();

    const categorie = document.getElementById('categorie').value;
    const sousCategorie = document.getElementById('sousCategorie').value;
    const marque = document.getElementById('marque').value;
    const nom = document.getElementById('nom').value.trim();
    const version = document.getElementById('version').value.trim();
    const quantite = parseInt(document.getElementById('quantite').value);

    if (!categorie || !marque || !nom || !version || isNaN(quantite)) {
        afficherMessage('❌ Veuillez remplir tous les champs.', 'error');
        return;
    }

    if (categorie === 'Électroménagers' && !sousCategorie) {
        afficherMessage('❌ Veuillez choisir une sous-catégorie.', 'error');
        return;
    }

    const reference = genererReference(categorie, marque, version);

    const produit = {
        nom, marque, categorie,
        sousCategorie: categorie === 'Électroménagers' ? sousCategorie : null,
        version, reference, quantite
    };

    const resultat = ajouterProduit(produit);
    afficherMessage(resultat.message, resultat.success ? 'success' : 'error');

    if (resultat.success) {
        this.reset();
        divSousCategorie.classList.add('hidden');
        selectMarque.innerHTML = '<option value="">-- Choisir une catégorie d\'abord --</option>';
        afficherProduits();
    }
});

// ============================================
// TEST-50 - CONSULTER LES PRODUITS - FB
// ============================================

function getProduitParReference(reference) {
    const produits = getProduits();
    return produits.find(p => p.reference === reference) || null;
}

// ============================================
// TEST-57 - RECHERCHER UN PRODUIT - IK
// ============================================

/**
 * Filtre les produits selon un mot-clé (insensible à la casse)
 * Recherche dans : nom, marque, référence, catégorie, sous-catégorie
 */
function filtrerProduits(motCle) {
    const produits = getProduits();

    // Si pas de mot-clé, retourner tous les produits
    if (!motCle || motCle.trim() === '') {
        return produits;
    }

    const motCleNormalise = motCle.trim().toLowerCase();

    return produits.filter(produit => {
        const nom = (produit.nom || '').toLowerCase();
        const marque = (produit.marque || '').toLowerCase();
        const reference = (produit.reference || '').toLowerCase();
        const categorie = (produit.categorie || '').toLowerCase();
        const sousCategorie = (produit.sousCategorie || '').toLowerCase();

        return nom.includes(motCleNormalise) ||
               marque.includes(motCleNormalise) ||
               reference.includes(motCleNormalise) ||
               categorie.includes(motCleNormalise) ||
               sousCategorie.includes(motCleNormalise);
    });
}

/**
 * Affiche la liste des produits (filtrée si un mot-clé est saisi)
 */
function afficherProduits(motCle = '') {
    const produits = filtrerProduits(motCle);
    const container = document.getElementById('liste-produits');
    const compteur = document.getElementById('compteur-resultats');

    // Mettre à jour le compteur
    if (motCle && motCle.trim() !== '') {
        compteur.textContent = `${produits.length} résultat(s) trouvé(s)`;
    } else {
        compteur.textContent = `${produits.length} produit(s) au total`;
    }

    // Aucun produit dans le catalogue
    if (getProduits().length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-12">
                <p class="text-5xl mb-3">📭</p>
                <p class="text-lg">Aucun produit dans le catalogue.</p>
                <p class="text-sm">Ajoutez votre premier produit ci-dessus.</p>
            </div>
        `;
        return;
    }

    // Aucun résultat de recherche
    if (produits.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-12">
                <p class="text-5xl mb-3">🔍</p>
                <p class="text-lg font-semibold">Aucun produit trouvé.</p>
                <p class="text-sm">Essayez avec un autre mot-clé.</p>
            </div>
        `;
        return;
    }

    // Afficher les produits
    container.innerHTML = produits.map(produit => `
        <div class="border-l-4 border-primary bg-gray-50 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
             onclick="afficherDetail('${produit.reference}')">

            <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-bold text-gray-800">${produit.nom}</h3>
                <span class="px-3 py-1 rounded-full text-xs font-bold ${
                    produit.statut === 'Disponible'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }">
                    ${produit.statut}
                </span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                <div><span class="font-semibold text-gray-700">Marque :</span> <span>${produit.marque}</span></div>
                <div><span class="font-semibold text-gray-700">Catégorie :</span> <span>${produit.categorie}</span></div>
                ${produit.sousCategorie ? `<div><span class="font-semibold text-gray-700">Sous-catégorie :</span> <span>${produit.sousCategorie}</span></div>` : ''}
                <div><span class="font-semibold text-gray-700">Version :</span> <span>${produit.version}</span></div>
                <div><span class="font-semibold text-gray-700">Référence :</span> <span class="font-mono">${produit.reference}</span></div>
                <div><span class="font-semibold text-gray-700">Quantité :</span> <span class="font-bold">${produit.quantite}</span></div>
            </div>

            <p class="text-xs text-gray-400 mt-2 italic">👆 Cliquer pour voir le détail</p>
        </div>
    `).join('');
}

// ============================================
// GESTION DE LA RECHERCHE (TEST-57)
// ============================================

const champRecherche = document.getElementById('champ-recherche');
const btnEffacerRecherche = document.getElementById('btn-effacer-recherche');

// Recherche en temps réel (à chaque frappe)
champRecherche.addEventListener('input', function() {
    const motCle = this.value;
    afficherProduits(motCle);

    if (motCle.trim() !== '') {
        btnEffacerRecherche.classList.remove('hidden');
    } else {
        btnEffacerRecherche.classList.add('hidden');
    }
});

// Bouton "effacer la recherche"
btnEffacerRecherche.addEventListener('click', function() {
    champRecherche.value = '';
    afficherProduits('');
    this.classList.add('hidden');
    champRecherche.focus();
});

// ============================================
// AFFICHAGE DU DÉTAIL D'UN PRODUIT (Modal)
// ============================================

function afficherDetail(reference) {
    const produit = getProduitParReference(reference);
    if (!produit) return;

    const contenu = document.getElementById('modal-contenu');
    contenu.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <h4 class="text-2xl font-bold text-gray-800">${produit.nom}</h4>
            <span class="px-3 py-1 rounded-full text-xs font-bold ${
                produit.statut === 'Disponible'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
            }">
                ${produit.statut}
            </span>
        </div>

        <div class="space-y-3">
            <div class="flex border-b border-gray-100 pb-2">
                <span class="w-40 font-semibold text-gray-600">Marque</span>
                <span class="text-gray-800">${produit.marque}</span>
            </div>
            <div class="flex border-b border-gray-100 pb-2">
                <span class="w-40 font-semibold text-gray-600">Catégorie</span>
                <span class="text-gray-800">${produit.categorie}</span>
            </div>
            ${produit.sousCategorie ? `
            <div class="flex border-b border-gray-100 pb-2">
                <span class="w-40 font-semibold text-gray-600">Sous-catégorie</span>
                <span class="text-gray-800">${produit.sousCategorie}</span>
            </div>
            ` : ''}
            <div class="flex border-b border-gray-100 pb-2">
                <span class="w-40 font-semibold text-gray-600">Version</span>
                <span class="text-gray-800">${produit.version}</span>
            </div>
            <div class="flex border-b border-gray-100 pb-2">
                <span class="w-40 font-semibold text-gray-600">Référence</span>
                <span class="text-gray-800 font-mono">${produit.reference}</span>
            </div>
            <div class="flex border-b border-gray-100 pb-2">
                <span class="w-40 font-semibold text-gray-600">Quantité en stock</span>
                <span class="text-gray-800 font-bold text-lg">${produit.quantite}</span>
            </div>
        </div>
    `;

    document.getElementById('modal-detail').classList.remove('hidden');
}

// ============================================
// FERMER LE MODAL
// ============================================

function fermerModal() {
    document.getElementById('modal-detail').classList.add('hidden');
}

// Fermer le modal en cliquant en dehors
document.getElementById('modal-detail').addEventListener('click', function(e) {
    if (e.target === this) {
        fermerModal();
    }
});

// Fermer avec la touche Échap
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fermerModal();
    }
});

// ============================================
// INITIALISATION
// ============================================

afficherProduits();
console.log('✅ Application démarrée');