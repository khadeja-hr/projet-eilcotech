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

    if (produits.some(p => p.reference === produit.reference)) {
        return { success: false, message: `❌ La référence "${produit.reference}" existe déjà !` };
    }

    if (produit.quantite < 0 || produit.quantite > 10) {
        return { success: false, message: '❌ La quantité doit être comprise entre 0 et 10.' };
    }

    const marquesAutorisees = getMarquesAutorisees(produit.categorie, produit.sousCategorie);
    if (!marquesAutorisees.includes(produit.marque)) {
        return { success: false, message: `❌ La marque "${produit.marque}" n'est pas autorisée pour cette catégorie.` };
    }

    const nombreProduits = compterProduitsParMarque(
        produit.categorie,
        produit.sousCategorie,
        produit.marque
    );
    if (nombreProduits >= MAX_PRODUITS_PAR_MARQUE) {
        return { success: false, message: `❌ La marque "${produit.marque}" a déjà ${MAX_PRODUITS_PAR_MARQUE} produits (maximum autorisé).` };
    }

    produit.statut = produit.quantite === 0 ? 'Rupture' : 'Disponible';

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
// GESTION DYNAMIQUE DU FORMULAIRE (AJOUT) - IK
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
// SOUMISSION DU FORMULAIRE - IK
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
        <div class="border-l-4 border-primary bg-gray-50 rounded-lg p-4 hover:shadow-md transition">

            <div onclick="afficherDetail('${produit.reference}')" class="cursor-pointer">
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
            </div>

            <div class="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                <button onclick="afficherDetail('${produit.reference}')"
                        class="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition">
                    👁️ Détail
                </button>
                <button onclick="ouvrirModification('${produit.reference}')"
                        class="px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition">
                    ✏️ Modifier
                </button>
                <button onclick="ouvrirConfirmationSuppression('${produit.reference}')"
                        class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition">
                    🗑️ Supprimer
                </button>
            </div>
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

        <div class="flex gap-2 mt-6 pt-4 border-t border-gray-200">
            <button onclick="fermerModal(); ouvrirModification('${produit.reference}');"
                    class="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition">
                ✏️ Modifier
            </button>
            <button onclick="fermerModal(); ouvrirConfirmationSuppression('${produit.reference}');"
                    class="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition">
                🗑️ Supprimer
            </button>
        </div>
    `;

    document.getElementById('modal-detail').classList.remove('hidden');
}

// ============================================
// FERMER LE MODAL DÉTAIL
// ============================================

function fermerModal() {
    document.getElementById('modal-detail').classList.add('hidden');
}

document.getElementById('modal-detail').addEventListener('click', function(e) {
    if (e.target === this) {
        fermerModal();
    }
});

// ============================================
// TEST-53 - SUPPRIMER UN PRODUIT - FB
// ============================================

function ouvrirConfirmationSuppression(reference) {
    const produit = getProduitParReference(reference);

    if (!produit) {
        afficherMessage('❌ Produit introuvable.', 'error');
        return;
    }

    const infoDiv = document.getElementById('modal-suppression-info');
    infoDiv.innerHTML = `
        <p class="text-gray-800"><strong>Nom :</strong> ${produit.nom}</p>
        <p class="text-gray-800 mt-1"><strong>Référence :</strong> <span class="font-mono">${produit.reference}</span></p>
    `;

    document.getElementById('btn-confirmer-suppression').dataset.reference = reference;
    document.getElementById('modal-suppression').classList.remove('hidden');
}

function fermerModalSuppression() {
    document.getElementById('modal-suppression').classList.add('hidden');
}

function confirmerSuppression() {
    const reference = document.getElementById('btn-confirmer-suppression').dataset.reference;

    if (!reference) {
        afficherMessage('❌ Aucune référence à supprimer.', 'error');
        fermerModalSuppression();
        return;
    }

    const produits = getProduits();
    const produit = produits.find(p => p.reference === reference);

    if (!produit) {
        afficherMessage('❌ Produit introuvable.', 'error');
        fermerModalSuppression();
        return;
    }

    const nouveauxProduits = produits.filter(p => p.reference !== reference);
    saveProduits(nouveauxProduits);
    fermerModalSuppression();
    afficherMessage(`✅ Produit "${produit.nom}" (${produit.reference}) supprimé avec succès.`, 'success');
    afficherProduits();
}

document.getElementById('btn-confirmer-suppression').addEventListener('click', confirmerSuppression);

document.getElementById('modal-suppression').addEventListener('click', function(e) {
    if (e.target === this) {
        fermerModalSuppression();
    }
});

// ============================================
// TEST-52 - MODIFIER UN PRODUIT - FB
// ============================================

/**
 * Ouvre le modal de modification pour un produit
 */
function ouvrirModification(reference) {
    const produit = getProduitParReference(reference);

    if (!produit) {
        afficherMessage('❌ Produit introuvable.', 'error');
        return;
    }

    // Remplir le formulaire avec les infos actuelles
    document.getElementById('mod-reference-originale').value = produit.reference;
    document.getElementById('mod-categorie').value = produit.categorie;
    document.getElementById('mod-nom').value = produit.nom;
    document.getElementById('mod-version').value = produit.version;
    document.getElementById('mod-reference').value = produit.reference;
    document.getElementById('mod-quantite').value = produit.quantite;

    // Gérer la sous-catégorie
    const modDivSousCategorie = document.getElementById('mod-div-sous-categorie');
    const modSousCategorie = document.getElementById('mod-sousCategorie');

    if (produit.categorie === 'Électroménagers') {
        modDivSousCategorie.classList.remove('hidden');
        modSousCategorie.required = true;
        modSousCategorie.value = produit.sousCategorie || '';
    } else {
        modDivSousCategorie.classList.add('hidden');
        modSousCategorie.required = false;
        modSousCategorie.value = '';
    }

    // Mettre à jour les marques
    mettreAJourMarquesModification();
    document.getElementById('mod-marque').value = produit.marque;

    // Afficher le modal
    document.getElementById('modal-modification').classList.remove('hidden');
}

/**
 * Met à jour les marques dans le formulaire de modification
 */
function mettreAJourMarquesModification() {
    const categorie = document.getElementById('mod-categorie').value;
    const sousCategorie = document.getElementById('mod-sousCategorie').value;
    const selectMarqueMod = document.getElementById('mod-marque');

    selectMarqueMod.innerHTML = '<option value="">-- Choisir --</option>';
    if (!categorie) return;

    const marques = getMarquesAutorisees(categorie, sousCategorie);
    marques.forEach(marque => {
        const option = document.createElement('option');
        option.value = marque;
        option.textContent = marque;
        selectMarqueMod.appendChild(option);
    });
}

/**
 * Ferme le modal de modification
 */
function fermerModalModification() {
    document.getElementById('modal-modification').classList.add('hidden');
}

// Gestion dynamique du formulaire de modification
document.getElementById('mod-categorie').addEventListener('change', function() {
    const categorie = this.value;
    const modDivSousCategorie = document.getElementById('mod-div-sous-categorie');
    const modSousCategorie = document.getElementById('mod-sousCategorie');

    if (categorie === 'Électroménagers') {
        modDivSousCategorie.classList.remove('hidden');
        modSousCategorie.required = true;
    } else {
        modDivSousCategorie.classList.add('hidden');
        modSousCategorie.required = false;
        modSousCategorie.value = '';
    }
    mettreAJourMarquesModification();
});

document.getElementById('mod-sousCategorie').addEventListener('change', mettreAJourMarquesModification);

// Fermer le modal de modification en cliquant en dehors
document.getElementById('modal-modification').addEventListener('click', function(e) {
    if (e.target === this) {
        fermerModalModification();
    }
});

// Fermer avec la touche Échap
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fermerModal();
        fermerModalSuppression();
        fermerModalModification();
    }
});

// ============================================
// SOUMISSION DU FORMULAIRE DE MODIFICATION
// ============================================

document.getElementById('form-modification').addEventListener('submit', function(e) {
    e.preventDefault();

    const referenceOriginale = document.getElementById('mod-reference-originale').value;
    const categorie = document.getElementById('mod-categorie').value;
    const sousCategorie = document.getElementById('mod-sousCategorie').value;
    const marque = document.getElementById('mod-marque').value;
    const nom = document.getElementById('mod-nom').value.trim();
    const version = document.getElementById('mod-version').value.trim();
    const reference = document.getElementById('mod-reference').value.trim();
    const quantite = parseInt(document.getElementById('mod-quantite').value);

    // Vérifier que tous les champs sont remplis
    if (!categorie || !marque || !nom || !version || !reference || isNaN(quantite)) {
        afficherMessage('❌ Veuillez remplir tous les champs.', 'error');
        return;
    }

    // Vérifier la sous-catégorie pour électroménager
    if (categorie === 'Électroménagers' && !sousCategorie) {
        afficherMessage('❌ Veuillez choisir une sous-catégorie.', 'error');
        return;
    }

    // Vérifier la quantité
    if (quantite < 0 || quantite > 10) {
        afficherMessage('❌ La quantité doit être comprise entre 0 et 10.', 'error');
        return;
    }

    // Vérifier l'unicité de la référence (si elle a changé)
    const produits = getProduits();
    if (reference !== referenceOriginale) {
        if (produits.some(p => p.reference === reference)) {
            afficherMessage(`❌ La référence "${reference}" existe déjà !`, 'error');
            return;
        }
    }

    // Vérifier la cohérence marque/catégorie
    const marquesAutorisees = getMarquesAutorisees(categorie, sousCategorie);
    if (!marquesAutorisees.includes(marque)) {
        afficherMessage(`❌ La marque "${marque}" n'est pas autorisée pour cette catégorie.`, 'error');
        return;
    }

    // Trouver le produit à modifier
    const index = produits.findIndex(p => p.reference === referenceOriginale);
    if (index === -1) {
        afficherMessage('❌ Produit introuvable.', 'error');
        return;
    }

    // Mettre à jour le produit
    produits[index] = {
        nom,
        marque,
        categorie,
        sousCategorie: categorie === 'Électroménagers' ? sousCategorie : null,
        version,
        reference,
        quantite,
        statut: quantite === 0 ? 'Rupture' : 'Disponible'
    };

    saveProduits(produits);

    // Fermer le modal
    fermerModalModification();

    // Message de confirmation
    afficherMessage(`✅ Produit "${nom}" modifié avec succès !`, 'success');

    // Actualiser la liste
    afficherProduits();
});

// ============================================
// INITIALISATION
// ============================================

afficherProduits();
console.log('✅ Application démarrée');